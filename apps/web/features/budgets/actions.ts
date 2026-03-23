'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createBudgetRuleSchema,
  updateBudgetRuleSchema,
  type CreateBudgetRuleInput,
  type UpdateBudgetRuleInput,
} from './schemas'

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string }

export async function upsertBudgetRule(
  workspaceId: string,
  input: CreateBudgetRuleInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = createBudgetRuleSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  // Verify category belongs to workspace and is type 'expense'
  const { data: category } = await supabase
    .from('categories')
    .select('id, type, workspace_id')
    .eq('id', parsed.data.category_id)
    .single()

  if (!category) {
    return { ok: false, error: 'Categoria não encontrada', code: 'NOT_FOUND' }
  }
  if (category.workspace_id !== workspaceId) {
    return { ok: false, error: 'Categoria não pertence a este workspace', code: 'UNAUTHORIZED' }
  }
  if (category.type !== 'expense') {
    return { ok: false, error: 'Orçamentos só podem ser criados para categorias de despesa', code: 'INVALID_TYPE' }
  }

  const { data, error } = await supabase
    .from('budget_rules')
    .upsert(
      {
        ...parsed.data,
        workspace_id: workspaceId,
      },
      { onConflict: 'workspace_id,category_id,period_type' }
    )
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/[workspace]/budgets`, 'page')
  revalidatePath(`/[workspace]/dashboard`, 'page')
  return { ok: true, data: { id: data.id } }
}

export async function updateBudgetRule(
  workspaceId: string,
  input: UpdateBudgetRuleInput
): Promise<ActionResult<void>> {
  const parsed = updateBudgetRuleSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message }
  }

  const { id, ...fields } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from('budget_rules')
    .update(fields)
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/[workspace]/budgets`, 'page')
  revalidatePath(`/[workspace]/dashboard`, 'page')
  return { ok: true, data: undefined }
}

export async function deactivateBudgetRule(
  workspaceId: string,
  ruleId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('budget_rules')
    .update({ is_active: false })
    .eq('id', ruleId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/[workspace]/budgets`, 'page')
  revalidatePath(`/[workspace]/dashboard`, 'page')
  return { ok: true, data: undefined }
}
