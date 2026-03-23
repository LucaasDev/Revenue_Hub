'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createCreditCardSchema,
  updateCreditCardSchema,
  createCardTransactionSchema,
  payInvoiceSchema,
  type CreateCreditCardInput,
  type UpdateCreditCardInput,
  type CreateCardTransactionInput,
  type PayInvoiceInput,
} from './schemas'
import type { ActionResult } from '@/lib/types/action'
import { addMonths, format, getDaysInMonth } from 'date-fns'

function revalidateCards(workspaceSlug: string) {
  revalidatePath(`/${workspaceSlug}/cards`)
  revalidatePath(`/${workspaceSlug}/dashboard`)
  revalidatePath(`/${workspaceSlug}/transactions`)
}

/**
 * Calcula period_start e period_end para uma data de compra dado
 * o closing_day do cartão.
 */
function getInvoicePeriod(
  purchaseDate: Date,
  closingDay: number,
): { periodStart: string; periodEnd: string } {
  const year = purchaseDate.getFullYear()
  const month = purchaseDate.getMonth()
  const day = purchaseDate.getDate()

  // Se a compra é antes do fechamento, pertence à fatura atual
  // Se é no dia ou depois do fechamento, pertence à fatura do próximo período
  let periodStart: Date
  let periodEnd: Date

  if (day < closingDay) {
    // Fatura do mês atual
    const prevMonth = month === 0 ? new Date(year - 1, 11, closingDay) : new Date(year, month - 1, closingDay)
    periodStart = prevMonth
    periodEnd = new Date(year, month, closingDay - 1)
  } else {
    // Fatura do próximo ciclo
    periodStart = new Date(year, month, closingDay)
    const nextClosing = month === 11 ? new Date(year + 1, 0, closingDay) : new Date(year, month + 1, closingDay)
    periodEnd = new Date(nextClosing.getFullYear(), nextClosing.getMonth(), nextClosing.getDate() - 1)
  }

  return {
    periodStart: format(periodStart, 'yyyy-MM-dd'),
    periodEnd: format(periodEnd, 'yyyy-MM-dd'),
  }
}

/** Cria um cartão de crédito e gera a primeira fatura open */
export async function createCreditCard(
  workspaceId: string,
  formData: CreateCreditCardInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createCreditCardSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('id, slug, currency_base')
    .eq('id', workspaceId)
    .single()
  if (!ws) return { ok: false, error: 'Workspace não encontrado', code: 'NOT_FOUND' }

  const { data: card, error: cardError } = await supabase
    .from('credit_cards')
    .insert({
      ...parsed.data,
      workspace_id: workspaceId,
      created_by: user.id,
      current_balance: 0,
    })
    .select('id')
    .single()

  if (cardError) return { ok: false, error: cardError.message, code: 'DB_ERROR' }

  // Generate initial open invoice for current period
  const today = new Date()
  const { periodStart, periodEnd } = getInvoicePeriod(today, parsed.data.closing_day)

  // Due date: due_day of the month following period_end
  const periodEndDate = new Date(periodEnd)
  const dueMonth = addMonths(periodEndDate, 1)
  const dueDate = format(new Date(dueMonth.getFullYear(), dueMonth.getMonth(), parsed.data.due_day), 'yyyy-MM-dd')

  await supabase.from('card_invoices').insert({
    workspace_id: workspaceId,
    card_id: card.id,
    status: 'open',
    period_start: periodStart,
    period_end: periodEnd,
    due_date: dueDate,
    total_amount: 0,
    paid_amount: 0,
  })

  revalidateCards(ws.slug)
  return { ok: true, data: { id: card.id } }
}

/** Atualiza dados do cartão */
export async function updateCreditCard(
  workspaceId: string,
  formData: UpdateCreditCardInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateCreditCardSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { data: ws } = await supabase.from('workspaces').select('slug').eq('id', workspaceId).single()

  const { id, ...updates } = parsed.data
  const { error } = await supabase
    .from('credit_cards')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  if (ws) revalidateCards(ws.slug)
  return { ok: true, data: { id } }
}

/**
 * Lança despesa no cartão, com suporte a parcelamento.
 * Para N parcelas, cria N transações na fatura correspondente de cada mês.
 */
export async function createCardTransaction(
  workspaceId: string,
  formData: CreateCardTransactionInput,
): Promise<ActionResult<{ ids: string[] }>> {
  const parsed = createCardTransactionSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('slug, currency_base')
    .eq('id', workspaceId)
    .single()
  if (!ws) return { ok: false, error: 'Workspace não encontrado', code: 'NOT_FOUND' }

  // Get card info
  const { data: card } = await supabase
    .from('credit_cards')
    .select('id, closing_day, due_day, account_id')
    .eq('id', parsed.data.card_id)
    .eq('workspace_id', workspaceId)
    .single()
  if (!card) return { ok: false, error: 'Cartão não encontrado', code: 'NOT_FOUND' }

  const {
    card_id,
    total_installments,
    amount,
    description,
    currency,
    date,
    category_id,
    notes,
  } = parsed.data

  const installmentAmount = Math.round((amount / total_installments) * 100) / 100
  const purchaseDate = new Date(date + 'T00:00:00')
  const createdIds: string[] = []

  for (let i = 0; i < total_installments; i++) {
    // Each installment goes to the invoice for (purchaseDate + i months)
    const installmentDate = addMonths(purchaseDate, i)
    const { periodStart, periodEnd } = getInvoicePeriod(installmentDate, card.closing_day)

    // Find or create the invoice for this period
    let { data: invoice } = await supabase
      .from('card_invoices')
      .select('id')
      .eq('card_id', card_id)
      .eq('workspace_id', workspaceId)
      .eq('period_start', periodStart)
      .maybeSingle()

    if (!invoice) {
      const dueMonth = addMonths(new Date(periodEnd), 1)
      const dueDate = format(new Date(dueMonth.getFullYear(), dueMonth.getMonth(), card.due_day), 'yyyy-MM-dd')

      const { data: newInvoice } = await supabase
        .from('card_invoices')
        .insert({
          workspace_id: workspaceId,
          card_id,
          status: 'open',
          period_start: periodStart,
          period_end: periodEnd,
          due_date: dueDate,
          total_amount: 0,
          paid_amount: 0,
        })
        .select('id')
        .single()

      invoice = newInvoice
    }

    // Create base transaction
    const installmentDesc = total_installments > 1
      ? `${description} ${i + 1}/${total_installments}`
      : description

    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        workspace_id: workspaceId,
        account_id: card.account_id,
        created_by: user.id,
        type: 'expense',
        amount: installmentAmount,
        amount_in_base: installmentAmount,
        currency: currency ?? ws.currency_base,
        description: installmentDesc,
        date: format(installmentDate, 'yyyy-MM-dd'),
        status: i === 0 ? 'pending' : 'pending',
        category_id: category_id ?? null,
        notes: notes ?? null,
      })
      .select('id')
      .single()

    if (txError) {
      return { ok: false, error: txError.message, code: 'DB_ERROR' }
    }

    createdIds.push(tx.id)

    // Create card_transaction record
    await supabase.from('card_transactions').insert({
      workspace_id: workspaceId,
      transaction_id: tx.id,
      card_id,
      invoice_id: invoice!.id,
      installment_number: i + 1,
      total_installments,
      parent_tx_id: i > 0 ? createdIds[0] : null,
    })

    // Update invoice total_amount
    await supabase
      .from('card_invoices')
      .update({ total_amount: supabase.rpc('_increment', { x: installmentAmount }) as any })
      .eq('id', invoice!.id)
  }

  revalidateCards(ws.slug)
  return { ok: true, data: { ids: createdIds } }
}

/** Paga uma fatura (total ou parcial) */
export async function payInvoice(
  workspaceId: string,
  formData: PayInvoiceInput,
): Promise<ActionResult<{ transactionId: string }>> {
  const parsed = payInvoiceSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('slug, currency_base')
    .eq('id', workspaceId)
    .single()
  if (!ws) return { ok: false, error: 'Workspace não encontrado', code: 'NOT_FOUND' }

  const { invoiceId, paymentAccountId, paidAmount, paymentDate } = parsed.data

  // Get invoice info
  const { data: invoice } = await supabase
    .from('card_invoices')
    .select('id, total_amount, paid_amount, status, card_id')
    .eq('id', invoiceId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!invoice) return { ok: false, error: 'Fatura não encontrada', code: 'NOT_FOUND' }
  if (invoice.status === 'paid') return { ok: false, error: 'Fatura já está paga', code: 'ALREADY_PAID' }

  // Get card name for description
  const { data: card } = await supabase
    .from('credit_cards')
    .select('name')
    .eq('id', invoice.card_id)
    .single()

  const monthLabel = format(new Date(invoice.id), 'MM/yyyy')
  const description = `Fatura ${card?.name ?? 'Cartão'} — ${paymentDate.slice(0, 7).replace('-', '/')}`

  // Create payment transaction
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      workspace_id: workspaceId,
      account_id: paymentAccountId,
      created_by: user.id,
      type: 'expense',
      amount: paidAmount,
      amount_in_base: paidAmount,
      currency: ws.currency_base,
      description,
      date: paymentDate,
      status: 'confirmed',
    })
    .select('id')
    .single()

  if (txError) return { ok: false, error: txError.message, code: 'DB_ERROR' }

  // Update invoice
  const newPaid = (invoice.paid_amount ?? 0) + paidAmount
  const isPaidFull = newPaid >= invoice.total_amount

  await supabase
    .from('card_invoices')
    .update({
      paid_amount: newPaid,
      status: isPaidFull ? 'paid' : invoice.status,
      paid_at: isPaidFull ? new Date().toISOString() : null,
      payment_tx_id: isPaidFull ? tx.id : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)

  // If fully paid: reconcile all transactions of that period
  if (isPaidFull) {
    const { data: invoiceWithPeriod } = await supabase
      .from('card_invoices')
      .select('period_start, period_end')
      .eq('id', invoiceId)
      .single()

    if (invoiceWithPeriod) {
      await supabase
        .from('card_transactions')
        .select('transaction_id')
        .eq('invoice_id', invoiceId)
        .then(async ({ data: cardTxs }) => {
          if (!cardTxs?.length) return
          await supabase
            .from('transactions')
            .update({ status: 'reconciled', updated_at: new Date().toISOString() })
            .in('id', cardTxs.map(ct => ct.transaction_id))
        })
    }
  }

  revalidateCards(ws.slug)
  return { ok: true, data: { transactionId: tx.id } }
}
