'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createRecurrenceSchema, type CreateRecurrenceInput } from './schemas'
import type { ActionResult } from '@/lib/types/action'
import { getNextOccurrences } from './utils'
import { format, isBefore } from 'date-fns'

/** Cria uma nova regra de recorrência */
export async function createRecurrenceRule(
  workspaceId: string,
  formData: CreateRecurrenceInput,
  generateRetroactive?: boolean,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createRecurrenceSchema.safeParse(formData)
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

  const data = parsed.data
  const startsOn = new Date(data.starts_on + 'T00:00:00')

  const { data: rule, error: ruleError } = await supabase
    .from('recurrence_rules')
    .insert({
      workspace_id: workspaceId,
      created_by: user.id,
      account_id: data.account_id,
      category_id: data.category_id ?? null,
      type: data.type,
      amount: data.amount,
      currency: data.currency ?? ws.currency_base,
      description: data.description,
      frequency: data.frequency,
      interval_count: data.interval_count ?? 1,
      day_of_month: data.day_of_month ?? null,
      starts_on: data.starts_on,
      ends_on: data.ends_on ?? null,
      next_occurrence: data.starts_on,
      is_active: true,
    })
    .select('id')
    .single()

  if (ruleError) return { ok: false, error: ruleError.message, code: 'DB_ERROR' }

  // Generate retroactive transactions if requested
  if (generateRetroactive && isBefore(startsOn, new Date())) {
    const occurrences = getNextOccurrences(
      startsOn,
      data.frequency as any,
      data.interval_count ?? 1,
      data.day_of_month ?? null,
      50, // max retroactive
    )

    const today = new Date()
    const retroDates = occurrences.filter(d => isBefore(d, today))

    for (const date of retroDates) {
      await supabase.from('transactions').insert({
        workspace_id: workspaceId,
        account_id: data.account_id,
        created_by: user.id,
        recurrence_id: rule.id,
        type: data.type,
        amount: data.amount,
        amount_in_base: data.amount,
        currency: data.currency ?? ws.currency_base,
        description: data.description,
        date: format(date, 'yyyy-MM-dd'),
        status: 'pending',
        category_id: data.category_id ?? null,
      })
    }
  }

  revalidatePath(`/${ws.slug}/recurrences`)
  revalidatePath(`/${ws.slug}/dashboard`)
  return { ok: true, data: { id: rule.id } }
}

/** Pausa/retoma uma regra de recorrência */
export async function toggleRecurrenceRule(
  workspaceId: string,
  ruleId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { data: ws } = await supabase.from('workspaces').select('slug').eq('id', workspaceId).single()

  const { error } = await supabase
    .from('recurrence_rules')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', ruleId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  if (ws) {
    revalidatePath(`/${ws.slug}/recurrences`)
    revalidatePath(`/${ws.slug}/dashboard`)
  }
  return { ok: true, data: undefined }
}

/** Remove uma regra de recorrência */
export async function deleteRecurrenceRule(
  workspaceId: string,
  ruleId: string,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { data: ws } = await supabase.from('workspaces').select('slug').eq('id', workspaceId).single()

  const { error } = await supabase
    .from('recurrence_rules')
    .delete()
    .eq('id', ruleId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  if (ws) revalidatePath(`/${ws.slug}/recurrences`)
  return { ok: true, data: undefined }
}
