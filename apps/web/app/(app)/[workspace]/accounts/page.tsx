import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceBySlug } from '@/features/workspaces/queries'
import { AccountsPageClient } from '@/features/accounts/components/AccountsPageClient'

export const metadata: Metadata = { title: 'Contas' }

interface AccountsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function AccountsPage({ params }: AccountsPageProps) {
  const { workspace: workspaceSlug } = await params

  const ws = await getWorkspaceBySlug(workspaceSlug)
  if (!ws) return null

  const supabase = await createClient()
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('workspace_id', ws.id)
    .order('sort_order', { ascending: true })

  return (
    <AccountsPageClient
      accounts={accounts ?? []}
      workspaceId={ws.id}
      workspaceSlug={workspaceSlug}
      workspaceCurrency={ws.currency_base}
    />
  )
}
