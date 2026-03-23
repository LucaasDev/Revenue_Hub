import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { TrialBanner } from '@/features/billing/components/TrialBanner'
import { getWorkspaceBillingInfo } from '@/features/billing/queries'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  params: Promise<{ workspace: string }>
}

/**
 * Layout do workspace — inclui Sidebar e Topbar.
 * Verifica se o usuário tem acesso ao workspace pelo slug.
 */
export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspace: slug } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verifica se o workspace existe e se o usuário é membro
  const { data: workspaceData } = await supabase
    .from('workspaces')
    .select('id, name, slug, plan, currency_base')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (!workspaceData) notFound()

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceData.id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    // Usuário não tem acesso a este workspace
    redirect('/')
  }

  // Billing info para o TrialBanner
  const billingInfo = await getWorkspaceBillingInfo(workspaceData.id)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar workspace={workspaceData} userRole={membership.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {billingInfo && (
          <TrialBanner billingInfo={billingInfo} workspaceSlug={slug} />
        )}
        <Topbar workspace={workspaceData} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
