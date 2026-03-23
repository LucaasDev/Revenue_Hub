import type { Metadata } from 'next'
import { getTransactionsCursor } from '@/features/transactions/queries'
import { TransactionTable } from '@/features/transactions/components/TransactionTable'
import { TransactionFilters } from '@/features/transactions/components/TransactionFilters'
import { getWorkspaceBySlug } from '@/features/workspaces/queries'
import { createClient } from '@/lib/supabase/server'
import { CursorPagination } from '@/components/ui/Pagination'
import { TransactionPageActions } from '@/features/transactions/components/TransactionPageActions'

export const metadata: Metadata = { title: 'Transações' }

interface TransactionsPageProps {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{
    status?: string
    type?: string
    category?: string
    account?: string
    search?: string
    cursor?: string
  }>
}

export default async function TransactionsPage({
  params,
  searchParams,
}: TransactionsPageProps) {
  const { workspace: workspaceSlug } = await params
  const filters = await searchParams

  const ws = await getWorkspaceBySlug(workspaceSlug)
  if (!ws) return null

  const supabase = await createClient()

  // Load categories and accounts for filter options
  const [{ data: categories }, { data: accounts }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, type')
      .eq('workspace_id', ws.id)
      .order('name'),
    supabase
      .from('accounts')
      .select('id, name')
      .eq('workspace_id', ws.id)
      .eq('is_active', true)
      .order('sort_order'),
  ])

  // Parse cursor
  let cursor: { date: string; id: string } | undefined
  if (filters.cursor) {
    try { cursor = JSON.parse(atob(filters.cursor)) } catch {}
  }

  const PER_PAGE = 25
  const { data: transactions, nextCursor } = await getTransactionsCursor(ws.id, {
    status: filters.status,
    type: filters.type as any,
    categoryId: filters.category,
    accountId: filters.account,
    search: filters.search,
    perPage: PER_PAGE,
  }, cursor)

  const categoryOptions = (categories ?? []).map(c => ({ value: c.id, label: c.name }))
  const accountOptions = (accounts ?? []).map(a => ({ value: a.id, label: a.name }))

  const nextCursorParam = nextCursor ? btoa(JSON.stringify(nextCursor)) : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Transações</h1>
        <TransactionPageActions
          workspaceId={ws.id}
          workspaceSlug={workspaceSlug}
          workspaceCurrency={ws.currency_base}
        />
      </div>

      {/* Filters */}
      <TransactionFilters
        categories={categoryOptions}
        accounts={accountOptions}
      />

      {/* Table */}
      <TransactionTable
        transactions={transactions ?? []}
        workspaceId={ws.id}
        workspaceSlug={workspaceSlug}
      />

      {/* Pagination */}
      {(nextCursorParam || filters.cursor) && (
        <CursorPagination
          hasNextPage={!!nextCursorParam}
          hasPrevPage={!!filters.cursor}
          onNext={() => {}}     // handled by URL params in client
          onPrev={() => {}}
        />
      )}
    </div>
  )
}
