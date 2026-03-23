'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAccountSchema, updateAccountSchema, type CreateAccountInput, type UpdateAccountInput } from './schemas'
import { PLAN_LIMITS } from '@/lib/constants/plans'
import type { ActionResult } from '@/lib/types/action'

function revalidateAccounts(workspaceSlug: string) {
  revalidatePath(`/${workspaceSlug}/accounts`)
  revalidatePath(`/${workspaceSlug}/dashboard`)
  revalidatePath(`/${workspaceSlug}/transactions`)
}

/** Cria uma nova conta financeira */
export async function createAccount(
  workspaceId: string,
  formData: CreateAccountInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createAccountSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  // Get workspace + plan
  const { data: ws } = await supabase
    .from('workspaces')
    .select('id, slug, plan')
    .eq('id', workspaceId)
    .single()
  if (!ws) return { ok: false, error: 'Workspace não encontrado', code: 'NOT_FOUND' }

  // Check account limit
  const { count: currentCount } = await supabase
    .from('accounts')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)

  const planLimits = PLAN_LIMITS[ws.plan as keyof typeof PLAN_LIMITS]
  const limit = planLimits?.maxAccounts ?? 3
  if (limit !== Infinity && (currentCount ?? 0) >= limit) {
    return {
      ok: false,
      error: `Limite de ${limit} contas atingido para o plano ${ws.plan}. Faça upgrade para adicionar mais.`,
      code: 'PLAN_LIMIT',
    }
  }

  // Get max sort_order
  const { data: maxSortRow } = await supabase
    .from('accounts')
    .select('sort_order')
    .eq('workspace_id', workspaceId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { opening_balance, ...accountData } = parsed.data

  const { data: account, error: accError } = await supabase
    .from('accounts')
    .insert({
      ...accountData,
      workspace_id: workspaceId,
      created_by: user.id,
      sort_order: (maxSortRow?.sort_order ?? 0) + 1,
    })
    .select('id')
    .single()

  if (accError) return { ok: false, error: accError.message, code: 'DB_ERROR' }

  // Create opening_balance transaction if > 0
  if (opening_balance && opening_balance > 0) {
    await supabase.from('transactions').insert({
      workspace_id: workspaceId,
      account_id: account.id,
      created_by: user.id,
      type: 'opening_balance',
      amount: opening_balance,
      amount_in_base: opening_balance,
      currency: accountData.currency ?? 'BRL',
      description: 'Saldo inicial',
      date: new Date().toISOString().split('T')[0],
      status: 'confirmed',
    })
  }

  revalidateAccounts(ws.slug)
  return { ok: true, data: { id: account.id } }
}

/** Atualiza uma conta */
export async function updateAccount(
  workspaceId: string,
  formData: UpdateAccountInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateAccountSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()

  const { id, ...updates } = parsed.data

  const { error } = await supabase
    .from('accounts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  if (ws) revalidateAccounts(ws.slug)
  return { ok: true, data: { id } }
}

/** Arquiva uma conta (is_active = false) */
export async function archiveAccount(
  workspaceId: string,
  accountId: string,
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
    .from('accounts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', accountId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  if (ws) revalidateAccounts(ws.slug)
  return { ok: true, data: undefined }
}

/** Reativa conta arquivada */
export async function unarchiveAccount(
  workspaceId: string,
  accountId: string,
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
    .from('accounts')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', accountId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  if (ws) revalidateAccounts(ws.slug)
  return { ok: true, data: undefined }
}

/** Exclui uma conta (só se não tiver transações) */
export async function deleteAccount(
  workspaceId: string,
  accountId: string,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()

  // Check for transactions
  const { count } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: 'Conta possui transações vinculadas. Arquive a conta em vez de excluir.',
      code: 'HAS_TRANSACTIONS',
    }
  }

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', accountId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  if (ws) revalidateAccounts(ws.slug)
  return { ok: true, data: undefined }
}

/** Reordena contas via drag-and-drop */
export async function reorderAccounts(
  workspaceId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()

  // Batch update sort_order
  const updates = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('accounts')
        .update({ sort_order: index + 1, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', workspaceId),
    ),
  )

  const firstError = updates.find(r => r.error)
  if (firstError?.error) {
    return { ok: false, error: firstError.error.message, code: 'DB_ERROR' }
  }

  if (ws) revalidateAccounts(ws.slug)
  return { ok: true, data: undefined }
}
