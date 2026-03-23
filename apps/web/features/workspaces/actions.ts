'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createWorkspaceSchema, updateWorkspaceSchema, inviteMemberSchema } from './schemas'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/lib/constants/categories'
import type { ActionResult } from '@/lib/types/action'

/** Cria um novo workspace adicional para o usuário autenticado */
export async function createWorkspace(
  formData: unknown,
): Promise<ActionResult<{ slug: string }>> {
  const parsed = createWorkspaceSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  // Gerar slug único a partir do nome
  const baseSlug = parsed.data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)

  let finalSlug = baseSlug
  let counter = 0
  while (true) {
    const { data: existing } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', finalSlug)
      .single()
    if (!existing) break
    counter++
    finalSlug = `${baseSlug}-${counter}`
  }

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({
      name: parsed.data.name,
      slug: finalSlug,
      owner_id: user.id,
      currency_base: parsed.data.currency_base,
    })
    .select('id, slug')
    .single()

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  // Adicionar como owner
  await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: 'owner',
  })

  // Seed de categorias (a função SQL seed_workspace_categories é chamada via trigger no signup,
  // mas para workspaces adicionais precisamos chamá-la manualmente via RPC)
  await supabase.rpc('seed_workspace_categories', { p_workspace_id: workspace.id })

  revalidatePath('/')
  return { ok: true, data: { slug: workspace.slug } }
}

/** Atualiza configurações do workspace (nome e moeda base) */
export async function updateWorkspace(
  workspaceId: string,
  formData: unknown,
): Promise<ActionResult> {
  const parsed = updateWorkspaceSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('workspaces')
    .update(parsed.data)
    .eq('id', workspaceId)

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  revalidatePath('/')
  return { ok: true, data: undefined }
}

/** Convida um membro por email */
export async function inviteMember(
  workspaceId: string,
  formData: unknown,
): Promise<ActionResult> {
  const parsed = inviteMemberSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado', code: 'UNAUTHENTICATED' }

  // Verificar se o convidado já tem conta
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', parsed.data.email) // Supabase não expõe email via RLS — usar Auth Admin API em produção
    .single()

  // TODO: Usar Supabase Auth Admin API para buscar user por email e enviar convite
  // Por ora, envia magic link via auth.admin.inviteUserByEmail (requer service role)
  return { ok: false, error: 'Funcionalidade de convite requer configuração do Supabase Auth Admin' }
}

/** Remove um membro do workspace */
export async function removeMember(
  workspaceId: string,
  memberId: string,
): Promise<ActionResult> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message, code: 'DB_ERROR' }

  revalidatePath(`/settings/members`)
  return { ok: true, data: undefined }
}
