/**
 * Edge Function: generate-invoices
 *
 * Cron: todos os dias (recomendado 03:00 UTC antes do process-recurrences)
 * Configurar em supabase/config.toml:
 *   [functions.generate-invoices]
 *   schedule = "0 3 * * *"
 *
 * Responsabilidade:
 * 1. Fechar faturas cujo period_end < hoje e status = 'open'
 * 2. Gerar nova fatura 'open' para o próximo período
 * 3. Marcar como 'overdue' faturas closed com due_date < hoje
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

interface CreditCard {
  id: string
  workspace_id: string
  closing_day: number
  due_day: number
  is_active: boolean
}

function getInvoicePeriod(
  closingDay: number,
  dueDay: number,
  referenceDate: Date,
): { periodStart: string; periodEnd: string; dueDate: string } {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()

  // Período atual: do dia seguinte ao closing do mês anterior até o closing deste mês
  const periodEnd = new Date(year, month, closingDay)
  const periodStart = new Date(year, month - 1, closingDay + 1)

  // Vencimento: due_day do mês seguinte ao closing
  const due = new Date(year, month + 1, dueDay)

  return {
    periodStart: periodStart.toISOString().split('T')[0],
    periodEnd: periodEnd.toISOString().split('T')[0],
    dueDate: due.toISOString().split('T')[0],
  }
}

Deno.serve(async (_req) => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  let closed = 0
  let created = 0
  let overdued = 0

  console.log(`[generate-invoices] Iniciando para data: ${todayStr}`)

  // 1. Fechar faturas abertas cujo period_end < hoje
  const { data: openInvoices, error: fetchOpenError } = await supabase
    .from('card_invoices')
    .select('id, card_id, period_end, due_date, card:credit_cards(closing_day, due_day, workspace_id)')
    .eq('status', 'open')
    .lt('period_end', todayStr)

  if (fetchOpenError) {
    console.error('[generate-invoices] Erro ao buscar faturas abertas:', fetchOpenError)
  }

  for (const invoice of openInvoices ?? []) {
    // Fechar fatura
    await supabase
      .from('card_invoices')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', invoice.id)

    closed++

    // Criar nova fatura aberta para o próximo período
    const card = invoice.card as unknown as CreditCard
    if (!card) continue

    const { periodStart, periodEnd, dueDate } = getInvoicePeriod(
      card.closing_day,
      card.due_day,
      new Date(invoice.period_end),
    )

    // Verificar se já existe fatura para este período
    const { data: existing } = await supabase
      .from('card_invoices')
      .select('id')
      .eq('card_id', invoice.card_id)
      .eq('period_start', periodStart)
      .single()

    if (!existing) {
      await supabase.from('card_invoices').insert({
        card_id: invoice.card_id,
        workspace_id: card.workspace_id,
        period_start: periodStart,
        period_end: periodEnd,
        due_date: dueDate,
        status: 'open',
        total_amount: 0,
        paid_amount: 0,
      })
      created++
    }
  }

  // 2. Marcar como overdue: faturas closed com due_date < hoje
  const { data: overdueResult } = await supabase
    .from('card_invoices')
    .update({ status: 'overdue', updated_at: new Date().toISOString() })
    .eq('status', 'closed')
    .lt('due_date', todayStr)
    .select('id')

  overdued = overdueResult?.length ?? 0

  const result = { date: todayStr, invoicesClosed: closed, invoicesCreated: created, invoicesOverdued: overdued }
  console.log('[generate-invoices] Concluído:', result)

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
