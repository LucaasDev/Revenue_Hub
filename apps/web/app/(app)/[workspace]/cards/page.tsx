import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceBySlug } from '@/features/workspaces/queries'
import { getCreditCards } from '@/features/cards/queries'
import { CardsPageClient } from '@/features/cards/components/CardsPageClient'

export const metadata: Metadata = { title: 'Cartões de Crédito' }

interface CardsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function CardsPage({ params }: CardsPageProps) {
  const { workspace: workspaceSlug } = await params

  const ws = await getWorkspaceBySlug(workspaceSlug)
  if (!ws) return null

  const supabase = await createClient()
  const [{ data: cards }, { data: accounts }] = await Promise.all([
    getCreditCards(ws.id),
    supabase
      .from('accounts')
      .select('id, name, balance, currency, icon, color, is_active, type')
      .eq('workspace_id', ws.id)
      .eq('is_active', true)
      .order('sort_order'),
  ])

  return (
    <CardsPageClient
      cards={cards ?? []}
      accounts={accounts ?? []}
      workspaceId={ws.id}
      workspaceSlug={workspaceSlug}
      workspaceCurrency={ws.currency_base}
    />
  )
}
