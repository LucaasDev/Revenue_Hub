import { createClient } from '@/lib/supabase/server'

export interface DashboardKPIs {
  totalIncome: number
  totalExpense: number
  balance: number         // income - expense for the month
  netWorth: number        // soma de todos os saldos incluídos no net worth
  incomeVsPrev: number    // variação % vs mês anterior
  expenseVsPrev: number
}

export interface CashFlowDay {
  date: string
  income: number
  expense: number
}

export interface CategoryExpense {
  categoryId: string
  name: string
  color: string | null
  icon: string | null
  total: number
  percentage: number
}

export interface AccountBalance {
  id: string
  name: string
  balance: number
  currency: string
  color: string | null
  icon: string | null
  type: string
}

export interface PendingRecurrenceCount {
  count: number
}

/** KPIs financeiros do mês atual + comparação com mês anterior */
export async function getDashboardKPIs(
  workspaceId: string,
  year: number,
  month: number,
): Promise<DashboardKPIs> {
  const supabase = await createClient()

  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // Previous month boundaries
  const prevDate = new Date(year, month - 2, 1)
  const prevYear = prevDate.getFullYear()
  const prevMonth = prevDate.getMonth() + 1
  const prevFrom = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
  const prevLastDay = new Date(prevYear, prevMonth, 0).getDate()
  const prevTo = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`

  // Current month totals
  const { data: current } = await supabase
    .from('transactions')
    .select('type, amount_in_base')
    .eq('workspace_id', workspaceId)
    .in('status', ['confirmed', 'reconciled'])
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .is('deleted_at', null)

  // Previous month totals
  const { data: previous } = await supabase
    .from('transactions')
    .select('type, amount_in_base')
    .eq('workspace_id', workspaceId)
    .in('status', ['confirmed', 'reconciled'])
    .gte('date', prevFrom)
    .lte('date', prevTo)
    .is('deleted_at', null)

  // Net worth: sum of account balances (include_in_net_worth = true)
  const { data: accounts } = await supabase
    .from('accounts')
    .select('balance')
    .eq('workspace_id', workspaceId)
    .eq('include_in_net_worth', true)
    .eq('is_active', true)

  const sumByType = (rows: { type: string; amount_in_base: number }[] | null, type: string) =>
    (rows ?? []).filter(r => r.type === type).reduce((acc, r) => acc + (r.amount_in_base ?? 0), 0)

  const totalIncome = sumByType(current, 'income')
  const totalExpense = sumByType(current, 'expense')
  const prevIncome = sumByType(previous, 'income')
  const prevExpense = sumByType(previous, 'expense')

  const pctChange = (curr: number, prev: number) =>
    prev === 0 ? 0 : ((curr - prev) / prev) * 100

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    netWorth: (accounts ?? []).reduce((acc, a) => acc + (a.balance ?? 0), 0),
    incomeVsPrev: pctChange(totalIncome, prevIncome),
    expenseVsPrev: pctChange(totalExpense, prevExpense),
  }
}

/** Fluxo de caixa diário para o período */
export async function getCashFlowByDay(
  workspaceId: string,
  dateFrom: string,
  dateTo: string,
): Promise<CashFlowDay[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('transactions')
    .select('date, type, amount_in_base')
    .eq('workspace_id', workspaceId)
    .in('type', ['income', 'expense'])
    .in('status', ['confirmed', 'reconciled'])
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .is('deleted_at', null)
    .order('date', { ascending: true })

  // Aggregate by date
  const map = new Map<string, { income: number; expense: number }>()

  for (const row of data ?? []) {
    const existing = map.get(row.date) ?? { income: 0, expense: 0 }
    if (row.type === 'income') existing.income += row.amount_in_base ?? 0
    if (row.type === 'expense') existing.expense += row.amount_in_base ?? 0
    map.set(row.date, existing)
  }

  return Array.from(map.entries()).map(([date, vals]) => ({ date, ...vals }))
}

/** Top 5 categorias de despesa do mês */
export async function getExpensesByCategory(
  workspaceId: string,
  year: number,
  month: number,
): Promise<CategoryExpense[]> {
  const supabase = await createClient()

  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data } = await supabase
    .from('transactions')
    .select(`
      amount_in_base,
      category:categories(id, name, color, icon)
    `)
    .eq('workspace_id', workspaceId)
    .eq('type', 'expense')
    .in('status', ['confirmed', 'reconciled'])
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .is('deleted_at', null)
    .not('category_id', 'is', null)

  // Aggregate by category
  const map = new Map<string, { name: string; color: string | null; icon: string | null; total: number }>()

  for (const row of data ?? []) {
    const cat = Array.isArray(row.category) ? row.category[0] : row.category
    if (!cat) continue
    const existing = map.get(cat.id) ?? { name: cat.name, color: cat.color, icon: cat.icon, total: 0 }
    existing.total += row.amount_in_base ?? 0
    map.set(cat.id, existing)
  }

  const total = Array.from(map.values()).reduce((acc, v) => acc + v.total, 0)

  return Array.from(map.entries())
    .map(([categoryId, vals]) => ({
      categoryId,
      ...vals,
      percentage: total > 0 ? (vals.total / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
}

/** Contas ativas com saldo */
export async function getAccountsBalances(workspaceId: string): Promise<AccountBalance[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('accounts')
    .select('id, name, balance, currency, color, icon, type')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return data ?? []
}

/** Últimas N transações do workspace */
export async function getRecentTransactions(workspaceId: string, limit = 5) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('transactions')
    .select(`
      id, description, amount, amount_in_base, currency, type, status, date,
      account:accounts(id, name, icon, color),
      category:categories(id, name, icon, color)
    `)
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

/** Faturas de cartão abertas ou fechadas não pagas */
export async function getOpenInvoices(workspaceId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('card_invoices')
    .select(`
      id, status, total_amount, paid_amount, due_date,
      card:credit_cards(id, name, brand)
    `)
    .eq('workspace_id', workspaceId)
    .in('status', ['open', 'closed', 'overdue'])
    .order('due_date', { ascending: true })

  return data ?? []
}

/** Quantidade de transações recorrentes pendentes de confirmação */
export async function getPendingRecurrenceCount(workspaceId: string): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .not('recurrence_id', 'is', null)
    .is('deleted_at', null)

  return count ?? 0
}
