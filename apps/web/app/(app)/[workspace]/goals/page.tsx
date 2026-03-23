import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWorkspaceBySlug } from '@/features/workspaces/queries'
import { getGoals, getArchivedGoals } from '@/features/goals/queries'
import { GoalsTabs } from '@/features/goals/components/GoalsTabs'

export const metadata: Metadata = { title: 'Metas Financeiras' }
export const revalidate = 60

interface GoalsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function GoalsPage({ params }: GoalsPageProps) {
  const { workspace: slug } = await params
  const ws = await getWorkspaceBySlug(slug)
  if (!ws) notFound()

  const [active, archived] = await Promise.all([
    getGoals(ws.id),
    getArchivedGoals(ws.id),
  ])

  const completed = active.filter((g) => g.is_completed)
  const inProgress = active.filter((g) => !g.is_completed)

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <GoalsTabs
        active={inProgress}
        completed={[...completed, ...archived]}
        workspaceId={ws.id}
      />
    </div>
  )
}
