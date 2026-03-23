import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWorkspaceBySlug } from '@/features/workspaces/queries'
import { getBudgetSummary } from '@/features/budgets/queries'
import { BudgetGrid } from '@/features/budgets/components/BudgetGrid'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Orçamentos' }
export const revalidate = 60

interface BudgetsPageProps {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{ month?: string; year?: string }>
}

async function getExpenseCategories(workspaceId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, icon')
    .eq('workspace_id', workspaceId)
    .eq('type', 'expense')
    .eq('is_active', true)
    .order('name')
  return data ?? []
}

export default async function BudgetsPage({ params, searchParams }: BudgetsPageProps) {
  const { workspace: slug } = await params
  const { month, year } = await searchParams

  const ws = await getWorkspaceBySlug(slug)
  if (!ws) notFound()

  const now = new Date()
  const currentYear = year ? parseInt(year) : now.getFullYear()
  const currentMonth = month ? parseInt(month) : now.getMonth() + 1

  const [summary, expenseCategories] = await Promise.all([
    getBudgetSummary(ws.id, currentYear, currentMonth),
    getExpenseCategories(ws.id),
  ])

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold capitalize text-gray-900 dark:text-white">
          Orçamentos — {monthName}
        </h1>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <a
            href={`?year=${currentMonth === 1 ? currentYear - 1 : currentYear}&month=${currentMonth === 1 ? 12 : currentMonth - 1}`}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            ◀
          </a>
          <a
            href={`?year=${currentMonth === 12 ? currentYear + 1 : currentYear}&month=${currentMonth === 12 ? 1 : currentMonth + 1}`}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            ▶
          </a>
        </div>
      </div>

      <BudgetGrid
        summary={summary}
        workspaceId={ws.id}
        expenseCategories={expenseCategories}
      />
    </div>
  )
}
