'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createGoalSchema,
  updateGoalSchema,
  addContributionSchema,
  type CreateGoalInput,
  type UpdateGoalInput,
  type AddContributionInput,
} from './schemas'

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string }

export async function createGoal(
  workspaceId: string,
  input: CreateGoalInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = createGoalSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  // Auto-increment sort_order
  const { data: maxOrder } = await supabase
    .from('goals')
    .select('sort_order')
    .eq('workspace_id', workspaceId)
    .eq('is_archived', false)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const sort_order = maxOrder ? maxOrder.sort_order + 1 : 0

  const { data, error } = await supabase
    .from('goals')
    .insert({
      ...parsed.data,
      workspace_id: workspaceId,
      sort_order,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/[workspace]/goals`, 'page')
  return { ok: true, data: { id: data.id } }
}

export async function updateGoal(
  workspaceId: string,
  input: UpdateGoalInput
): Promise<ActionResult<void>> {
  const parsed = updateGoalSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message }
  }

  const { id, ...fields } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from('goals')
    .update(fields)
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/[workspace]/goals`, 'page')
  return { ok: true, data: undefined }
}

export async function archiveGoal(
  workspaceId: string,
  goalId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('goals')
    .update({ is_archived: true })
    .eq('id', goalId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/[workspace]/goals`, 'page')
  return { ok: true, data: undefined }
}

export async function unarchiveGoal(
  workspaceId: string,
  goalId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('goals')
    .update({ is_archived: false })
    .eq('id', goalId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/[workspace]/goals`, 'page')
  return { ok: true, data: undefined }
}

export async function addGoalContribution(
  workspaceId: string,
  input: AddContributionInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = addContributionSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  // Verify goal exists and belongs to workspace
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('id, target_amount, current_amount, is_completed, is_archived')
    .eq('id', parsed.data.goal_id)
    .eq('workspace_id', workspaceId)
    .single()

  if (goalError || !goal) {
    return { ok: false, error: 'Meta não encontrada', code: 'NOT_FOUND' }
  }

  if (goal.is_archived) {
    return { ok: false, error: 'Não é possível contribuir para uma meta arquivada', code: 'ARCHIVED' }
  }

  // Insert contribution
  const { data: contribution, error: insertError } = await supabase
    .from('goal_contributions')
    .insert({
      goal_id: parsed.data.goal_id,
      workspace_id: workspaceId,
      amount: parsed.data.amount,
      date: parsed.data.date,
      note: parsed.data.note ?? null,
    })
    .select('id')
    .single()

  if (insertError) return { ok: false, error: insertError.message }

  // Atomically increment current_amount
  const newAmount = goal.current_amount + parsed.data.amount
  const isCompleted = newAmount >= goal.target_amount

  const { error: updateError } = await supabase
    .from('goals')
    .update({
      current_amount: newAmount,
      is_completed: isCompleted,
    })
    .eq('id', parsed.data.goal_id)
    .eq('workspace_id', workspaceId)

  if (updateError) return { ok: false, error: updateError.message }

  revalidatePath(`/[workspace]/goals`, 'page')
  return { ok: true, data: { id: contribution.id } }
}

export async function removeGoalContribution(
  workspaceId: string,
  contributionId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  // Get contribution details before deleting
  const { data: contribution, error: fetchError } = await supabase
    .from('goal_contributions')
    .select('id, goal_id, amount')
    .eq('id', contributionId)
    .eq('workspace_id', workspaceId)
    .single()

  if (fetchError || !contribution) {
    return { ok: false, error: 'Contribuição não encontrada', code: 'NOT_FOUND' }
  }

  // Get current goal state
  const { data: goal } = await supabase
    .from('goals')
    .select('id, target_amount, current_amount')
    .eq('id', contribution.goal_id)
    .eq('workspace_id', workspaceId)
    .single()

  if (!goal) return { ok: false, error: 'Meta não encontrada', code: 'NOT_FOUND' }

  // Delete contribution
  const { error: deleteError } = await supabase
    .from('goal_contributions')
    .delete()
    .eq('id', contributionId)
    .eq('workspace_id', workspaceId)

  if (deleteError) return { ok: false, error: deleteError.message }

  // Decrement current_amount
  const newAmount = Math.max(0, goal.current_amount - contribution.amount)
  const isCompleted = newAmount >= goal.target_amount

  await supabase
    .from('goals')
    .update({ current_amount: newAmount, is_completed: isCompleted })
    .eq('id', contribution.goal_id)
    .eq('workspace_id', workspaceId)

  revalidatePath(`/[workspace]/goals`, 'page')
  return { ok: true, data: undefined }
}

export async function reorderGoals(
  workspaceId: string,
  orderedIds: string[]
): Promise<ActionResult<void>> {
  if (orderedIds.length === 0) return { ok: true, data: undefined }

  const supabase = await createClient()

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('goals')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
  )

  await Promise.all(updates)

  revalidatePath(`/[workspace]/goals`, 'page')
  return { ok: true, data: undefined }
}
