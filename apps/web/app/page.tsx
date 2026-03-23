import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Página raiz — redireciona para o workspace ativo do usuário.
 * O middleware já garante que só usuários autenticados chegam aqui.
 */
export default async function RootPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca o workspace pessoal (onde o usuário é owner)
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace:workspaces(slug)')
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .is('workspace.deleted_at', null)
    .order('workspace(created_at)', { ascending: true })
    .limit(1)
    .single()

  const slug = (membership?.workspace as { slug: string } | null)?.slug

  if (!slug) {
    // Estado inesperado — workspace não encontrado
    redirect('/login')
  }

  redirect(`/${slug}/dashboard`)
}
