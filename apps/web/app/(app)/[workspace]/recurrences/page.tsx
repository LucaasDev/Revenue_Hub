import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceBySlug } from '@/features/workspaces/queries'
import { getRecurrenceRules } from '@/features/recurrences/queries'
import { RecurrencesPageClient } from '@/features/recurrences/components/RecurrencesPageClient'

export const metadata: Metadata = { title: 'Recorrências' }

interface RecurrencesPageProps {
  params: Promise<{ workspace: string }>
}

export default async function RecurrencesPage({ params }: RecurrencesPageProps) {
  const { workspace: workspaceSlug } = await params

  const ws = await getWorkspaceBySlug(workspaceSlug)
  if (!ws) return null

  const supabase = await createClient()
  const [{ data: rules }, { data: accounts }, { data: categories }] = await Promise.all([
    getRecurrenceRules(ws.id),
    supabase
      .from('accounts')
      .select('id, name, balance, currency, icon, color, is_active, type')
      .eq('workspace_id', ws.id)
      .eq('is_active', true),
    supabase
      .from('categories')
      .select('id, name, type, parent_id, icon, color')
      .eq('workspace_id', ws.id),
  ])

  return (
    <RecurrencesPageClient
      rules={rules ?? []}
      accounts={accounts ?? []}
      categories={(categories as any) ?? []}
      workspaceId={ws.id}
      workspaceCurrency={ws.currency_base}
    />
  )
}
