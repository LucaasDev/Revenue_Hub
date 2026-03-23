'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createTransactionSchema,
  updateTransactionSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from './schemas'
import type { ActionResult } from '@/lib/types/action'
import { z } from 'zod'

function revalidateAll(workspaceSlug: string) {
  revalidatePath(`/${workspaceSlug}/transactions`)
  revalidatePath(`/${workspaceSlug}/dashboard`)
  revalidatePath(`/${workspaceSlug}/accounts`)
}

/** Cria uma nova transação (ou par de transferência) */
export async function createTransaction(
  workspaceId: string,
  formData: CreateTransactionInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createTransactionSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  // Validate workspace membership
  const { data: ws } = await supabase
    .from('workspaces')
    .select('id, slug, currency_base')
    .eq('id', workspaceId)
    .single()
  if (!ws) return { ok: false, error: 'Workspace não encontrado', code: 'NOT_FOUND' }

  const { transfer_to_account_id, exchange_rate, ...txData } = parsed.data as any
  const amountInBase = txData.currency === ws.currency_base
    ? txData.amount
    : txData.amount * (exchange_rate ?? 1)

  // Transferência: cria dois registros em operação ACID
  if (txData.type === 'transfer' && transfer_to_account_id) {
    const { data: originTx, error: originError } = await supabase
      .from('transactions')
      .insert({
        ...txData,
        workspace_id: workspaceId,
        created_by: user.id,
        amount_in_base: amountInBase,
        exchange_rate: exchange_rate ?? 1,
        is_transfer: true,
      })
      .select('id')
      .single()

    if (originError) return { ok: false, error: originError.message, code: 'DB_ERROR' }

    const { data: destTx, error: destError } = await supabase
      .from('transactions')
      .insert({
        workspace_id: workspaceId,
        account_id: transfer_to_account_id,
        created_by: user.id,
        type: 'income',
        amount: txData.amount,
        currency: txData.currency,
        amount_in_base: amountInBase,
        exchange_rate: exchange_rate ?? 1,
        description: txData.description,
        notes: txData.notes,
        date: txData.date,
        status: txData.status,
        is_transfer: true,
        transfer_peer_id: originTx.id,
      })
      .select('id')
      .single()

    if (destError) {
      await supabase.from('transactions').update({ deleted_at: new Date().toISOString() }).eq('id', originTx.id)
      return { ok: false, error: destError.message, code: 'DB_ERROR' }
    }

    // Update transfer_peer_id on origin
    await supabase
      .from('transactions')
      .update({ transfer_peer_id: destTx.id })
      .eq('id', originTx.id)

    revalidateAll(ws.slug)
    return { ok: true, data: { id: originTx.id } }
  }

  // Transação simples
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...txData,
      workspace_id: workspaceId,
      created_by: user.id,
      amount_in_base: amountInBase,
      exchange_rate: exchange_rate ?? 1,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  revalidateAll(ws.slug)
  return { ok: true, data: { id: data.id } }
}

/** Edita uma transação existente */
export async function updateTransaction(
  workspaceId: string,
  formData: UpdateTransactionInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateTransactionSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { id, ...updates } = parsed.data

  // Fetch current tx to validate editability
  const { data: existing } = await supabase
    .from('transactions')
    .select('id, status, workspace_id')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()

  if (!existing) return { ok: false, error: 'Transação não encontrada', code: 'NOT_FOUND' }

  // Reconciled: only description and notes editable
  let allowedUpdates: Record<string, unknown>
  if (existing.status === 'reconciled') {
    allowedUpdates = {
      description: updates.description,
      notes: updates.notes,
    }
  } else {
    // Validate category.type === transaction.type
    if (updates.category_id && updates.type) {
      const { data: cat } = await supabase
        .from('categories')
        .select('type')
        .eq('id', updates.category_id)
        .single()

      if (cat && cat.type !== updates.type && updates.type !== 'transfer') {
        return { ok: false, error: 'Categoria incompatível com o tipo da transação', code: 'CATEGORY_TYPE_MISMATCH' }
      }
    }
    allowedUpdates = updates
  }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()

  const { error } = await supabase
    .from('transactions')
    .update({ ...allowedUpdates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  if (ws) revalidateAll(ws.slug)
  return { ok: true, data: { id } }
}

/** Soft-delete de uma transação */
export async function deleteTransaction(
  workspaceId: string,
  transactionId: string,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()

  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', transactionId)
    .eq('workspace_id', workspaceId)
    .neq('status', 'reconciled')

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  if (ws) revalidateAll(ws.slug)
  return { ok: true, data: undefined }
}

/** Estorna uma transação (void) — reverte o saldo via trigger */
export async function voidTransaction(
  workspaceId: string,
  transactionId: string,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()

  const { error } = await supabase
    .from('transactions')
    .update({ status: 'void', updated_at: new Date().toISOString() })
    .eq('id', transactionId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'confirmed')  // Only confirmed can be voided

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  if (ws) revalidateAll(ws.slug)
  return { ok: true, data: undefined }
}

/** Confirma uma transação pendente */
export async function confirmTransaction(
  workspaceId: string,
  transactionId: string,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()

  const { error } = await supabase
    .from('transactions')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', transactionId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  if (ws) revalidateAll(ws.slug)
  return { ok: true, data: undefined }
}

/** Bulk delete (soft-delete múltiplas transações) */
export async function bulkDeleteTransactions(
  workspaceId: string,
  ids: string[],
): Promise<ActionResult<{ affected: number }>> {
  if (ids.length === 0) return { ok: true, data: { affected: 0 } }
  if (ids.length > 100) return { ok: false, error: 'Máximo de 100 transações por operação', code: 'LIMIT_EXCEEDED' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()

  const { error, count } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', ids)
    .eq('workspace_id', workspaceId)
    .neq('status', 'reconciled')

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  if (ws) revalidateAll(ws.slug)
  return { ok: true, data: { affected: count ?? ids.length } }
}

/** Bulk confirm (confirma múltiplas transações pendentes) */
export async function bulkConfirmTransactions(
  workspaceId: string,
  ids: string[],
): Promise<ActionResult<{ affected: number }>> {
  if (ids.length === 0) return { ok: true, data: { affected: 0 } }
  if (ids.length > 100) return { ok: false, error: 'Máximo de 100 transações por operação', code: 'LIMIT_EXCEEDED' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()

  const { error, count } = await supabase
    .from('transactions')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  if (ws) revalidateAll(ws.slug)
  return { ok: true, data: { affected: count ?? ids.length } }
}
