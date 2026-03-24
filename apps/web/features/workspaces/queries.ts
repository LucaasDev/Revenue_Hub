import { createServerClient } from '@/lib/supabase/server'

/** Lista todos os workspaces do usuário autenticado */
export async function getMyWorkspaces() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      role,
      joined_at,
      workspace:workspaces(
        id, name, slug, plan, currency_base, created_at
      )
    `)
    .eq('user_id', user.id)
    .is('workspace.deleted_at', null)
    .order('workspace(created_at)', { ascending: true })

  return { data, error: error?.message }
}

/** Busca um workspace pelo slug, retornando o objeto direto ou null */
export async function getWorkspaceBySlug(slug: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id, name, slug, plan, currency_base, owner_id')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (error || !workspace) return null

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single()

  return { ...workspace, userRole: membership?.role ?? null }
}

/** Lista membros de um workspace */
export async function getWorkspaceMembers(workspaceId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      id, role, joined_at,
      profile:profiles(id, full_name, avatar_url)
    `)
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true })

  return { data, error: error?.message }
}
