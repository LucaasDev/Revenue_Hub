'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createCategorySchema,
  updateCategorySchema,
  mergeCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type MergeCategoryInput,
} from './schemas'
import type { ActionResult } from '@/lib/types/action'

async function getWorkspaceSlug(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string) {
  const { data } = await supabase.from('workspaces').select('slug').eq('id', workspaceId).single()
  return data?.slug
}

/** Cria uma nova categoria */
export async function createCategory(
  workspaceId: string,
  formData: CreateCategoryInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createCategorySchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  // Validate parent depth (max 2 levels)
  if (parsed.data.parent_id) {
    const { data: parent } = await supabase
      .from('categories')
      .select('id, parent_id')
      .eq('id', parsed.data.parent_id)
      .single()

    if (parent?.parent_id) {
      return { ok: false, error: 'Subcategorias não podem ter filhos (máximo 2 níveis)', code: 'MAX_DEPTH' }
    }
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      ...parsed.data,
      workspace_id: workspaceId,
      is_system: false,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  const slug = await getWorkspaceSlug(supabase, workspaceId)
  if (slug) revalidatePath(`/${slug}/settings/categories`)

  return { ok: true, data: { id: data.id } }
}

/** Atualiza uma categoria */
export async function updateCategory(
  workspaceId: string,
  formData: UpdateCategoryInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateCategorySchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { id, ...updates } = parsed.data

  const { error } = await supabase
    .from('categories')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  const slug = await getWorkspaceSlug(supabase, workspaceId)
  if (slug) revalidatePath(`/${slug}/settings/categories`)

  return { ok: true, data: { id } }
}

/** Mescla categoria source → target e deleta source (se não for sistema) */
export async function mergeAndDeleteCategory(
  workspaceId: string,
  formData: MergeCategoryInput,
): Promise<ActionResult<{ transactionsMoved: number }>> {
  const parsed = mergeCategorySchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  const { sourceCategoryId, targetCategoryId } = parsed.data

  // Validate same type
  const { data: source } = await supabase
    .from('categories')
    .select('id, type, is_system')
    .eq('id', sourceCategoryId)
    .eq('workspace_id', workspaceId)
    .single()

  const { data: target } = await supabase
    .from('categories')
    .select('id, type')
    .eq('id', targetCategoryId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!source || !target) {
    return { ok: false, error: 'Categoria não encontrada', code: 'NOT_FOUND' }
  }

  if (source.type !== target.type) {
    return { ok: false, error: 'Categorias devem ser do mesmo tipo', code: 'TYPE_MISMATCH' }
  }

  // Move transactions
  const { count } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', sourceCategoryId)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)

  await supabase
    .from('transactions')
    .update({ category_id: targetCategoryId, updated_at: new Date().toISOString() })
    .eq('category_id', sourceCategoryId)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)

  // Delete source (only if not system)
  if (!source.is_system) {
    await supabase.from('categories').delete().eq('id', sourceCategoryId)
  }

  const slug = await getWorkspaceSlug(supabase, workspaceId)
  if (slug) revalidatePath(`/${slug}/settings/categories`)

  return { ok: true, data: { transactionsMoved: count ?? 0 } }
}

/** Exclui uma categoria (se não for sistema e sem transações) */
export async function deleteCategory(
  workspaceId: string,
  categoryId: string,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  // Check if system
  const { data: cat } = await supabase
    .from('categories')
    .select('id, is_system')
    .eq('id', categoryId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!cat) return { ok: false, error: 'Categoria não encontrada', code: 'NOT_FOUND' }
  if (cat.is_system) return { ok: false, error: 'Categorias do sistema não podem ser excluídas', code: 'SYSTEM_CATEGORY' }

  // Check for transactions
  const { count } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: 'Categoria possui transações. Use "Mesclar" para reatribuí-las antes de excluir.',
      code: 'HAS_TRANSACTIONS',
    }
  }

  await supabase.from('categories').delete().eq('id', categoryId)

  const slug = await getWorkspaceSlug(supabase, workspaceId)
  if (slug) revalidatePath(`/${slug}/settings/categories`)

  return { ok: true, data: undefined }
}
