import { createClient } from '@/lib/supabase/server'
import type { ListTransactionsInput } from './schemas'

const TX_SELECT = `
  *,
  account:accounts(id, name, icon, color, currency),
  category:categories(id, name, icon, color, type)
`

export interface TransactionCursorInput {
  status?: string
  type?: 'income' | 'expense' | 'transfer' | 'opening_balance'
  categoryId?: string
  accountId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  perPage?: number
}

/**
 * Cursor-based pagination for transactions.
 * Cursor = { date: string, id: string } encoded as base64 JSON.
 * Returns items + nextCursor (or null if last page).
 */
export async function getTransactionsCursor(
  workspaceId: string,
  filters: TransactionCursorInput = {},
  cursor?: { date: string; id: string },
): Promise<{
  data: Awaited<ReturnType<typeof buildQuery>>['data']
  nextCursor: { date: string; id: string } | null
}> {
  const { status, type, categoryId, accountId, dateFrom, dateTo, search, perPage = 25 } = filters

  const result = await buildQuery(workspaceId, filters, cursor, perPage + 1)
  const rows = result.data ?? []

  const hasMore = rows.length > perPage
  const items = hasMore ? rows.slice(0, perPage) : rows

  const nextCursor =
    hasMore && items.length > 0
      ? { date: items[items.length - 1].date, id: items[items.length - 1].id }
      : null

  return { data: items, nextCursor }
}

async function buildQuery(
  workspaceId: string,
  filters: TransactionCursorInput,
  cursor: { date: string; id: string } | undefined,
  limit: number,
) {
  const supabase = await createClient()
  const { status, type, categoryId, accountId, dateFrom, dateTo, search } = filters

  let query = supabase
    .from('transactions')
    .select(TX_SELECT)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (type) query = query.eq('type', type)
  if (categoryId) query = query.eq('category_id', categoryId)
  if (accountId) query = query.eq('account_id', accountId)
  if (dateFrom) query = query.gte('date', dateFrom)
  if (dateTo) query = query.lte('date', dateTo)

  // Cursor: fetch rows before (date, id) pair
  if (cursor) {
    query = query
      .lt('date', cursor.date)
      .or(`date.eq.${cursor.date},id.lt.${cursor.id}`)
  }

  // Full-text search (uses GIN index from migration 019)
  // Note: Supabase JS doesn't expose textSearch with custom config directly,
  // so we use .textSearch() for Portuguese full-text search.
  if (search?.trim()) {
    query = query.textSearch('fts', search.trim(), {
      type: 'plain',
      config: 'portuguese',
    })
  }

  return query
}

/** Legacy offset pagination (for compatibility) */
export async function getTransactions(
  workspaceId: string,
  filters: Partial<ListTransactionsInput> = {},
) {
  const supabase = await createClient()
  const { page = 1, perPage = 25, status, categoryId, accountId, dateFrom, dateTo } = filters
  const offset = (page - 1) * perPage

  let query = supabase
    .from('transactions')
    .select(TX_SELECT, { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (status) query = query.eq('status', status)
  if (categoryId) query = query.eq('category_id', categoryId)
  if (accountId) query = query.eq('account_id', accountId)
  if (dateFrom) query = query.gte('date', dateFrom)
  if (dateTo) query = query.lte('date', dateTo)

  const { data, count, error } = await query
  return { data, count: count ?? 0, error: error?.message }
}

/** Busca uma transação pelo ID */
export async function getTransactionById(workspaceId: string, id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      account:accounts(id, name, icon, color, currency),
      category:categories(id, name, icon, color, type),
      recurrence:recurrence_rules(id, frequency, interval_count)
    `)
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .single()

  return { data, error: error?.message }
}
