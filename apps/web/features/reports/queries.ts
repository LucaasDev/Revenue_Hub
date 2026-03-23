import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ISRow = {
  category_id: string
  category_name: string
  parent_id: string | null
  values: Record<string, number>  // 'YYYY-MM' → amount
  isParent: boolean
}

export type IncomeStatementData = {
  months: string[]
  incomeRows: ISRow[]
  expenseRows: ISRow[]
  totalIncome: Record<string, number>
  totalExpense: Record<string, number>
  netResult: Record<string, number>
}

export type CashFlowMonth = {
  month: string   // 'YYYY-MM'
  income: number
  expense: number
  net: number
  cumulative: number
}

export type CashFlowData = {
  months: CashFlowMonth[]
  totalIncome: number
  totalExpense: number
  totalNet: number
}

export type NetWorthPoint = {
  month: string   // 'YYYY-MM'
  total: number
  byAccount: Record<string, number>
}

export type NetWorthData = {
  current: number
  points: NetWorthPoint[]
  accounts: Array<{ id: string; name: string; type: string; balance: number }>
  changeAmount: number
  changePercent: number | null
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function generateMonths(from: string, to: string): string[] {
  const months: string[] = []
  const [fromYear, fromMonth] = from.split('-').map(Number)
  const [toYear, toMonth] = to.split('-').map(Number)

  let year = fromYear
  let month = fromMonth
  while (year < toYear || (year === toYear && month <= toMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`)
    month++
    if (month > 12) { month = 1; year++ }
  }
  return months
}

function lastDayOfMonth(year: number, month: number): string {
  return new Date(year, month, 0).toISOString().split('T')[0]
}

// ─────────────────────────────────────────────
// DRE — Income Statement
// ─────────────────────────────────────────────

export async function getIncomeStatement(
  workspaceId: string,
  from: string,   // 'YYYY-MM'
  to: string,     // 'YYYY-MM'
  accountIds?: string[]
): Promise<IncomeStatementData> {
  const supabase = await createClient()
  const months = generateMonths(from, to)

  const [fromYear, fromMonth] = from.split('-').map(Number)
  const [toYear, toMonth] = to.split('-').map(Number)
  const firstDay = `${fromYear}-${String(fromMonth).padStart(2, '0')}-01`
  const lastDay = lastDayOfMonth(toYear, toMonth)

  // Fetch all non-void transactions in range (excluding transfers)
  let query = supabase
    .from('transactions')
    .select('type, amount, date, category_id, account_id')
    .eq('workspace_id', workspaceId)
    .neq('status', 'void')
    .not('type', 'in', '(transfer_in,transfer_out)')
    .gte('date', firstDay)
    .lte('date', lastDay)

  if (accountIds && accountIds.length > 0) {
    query = query.in('account_id', accountIds)
  }

  const { data: transactions } = await query

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, parent_id, type')
    .eq('workspace_id', workspaceId)

  const catMap = new Map((categories ?? []).map((c) => [c.id, c]))

  // Aggregate: categoryId → month → amount
  const aggregate = new Map<string, Map<string, number>>()

  for (const tx of transactions ?? []) {
    if (!tx.category_id) continue
    const month = tx.date.slice(0, 7) // 'YYYY-MM'
    if (!aggregate.has(tx.category_id)) aggregate.set(tx.category_id, new Map())
    const monthMap = aggregate.get(tx.category_id)!
    monthMap.set(month, (monthMap.get(month) ?? 0) + tx.amount)
  }

  // Build rows
  function buildRows(type: 'income' | 'expense'): ISRow[] {
    const rows: ISRow[] = []

    for (const [catId, monthMap] of aggregate) {
      const cat = catMap.get(catId)
      if (!cat || cat.type !== type) continue

      const values: Record<string, number> = {}
      for (const m of months) values[m] = monthMap.get(m) ?? 0

      rows.push({
        category_id: catId,
        category_name: cat.name,
        parent_id: cat.parent_id,
        values,
        isParent: false,
      })
    }

    // Sort by name
    rows.sort((a, b) => a.category_name.localeCompare(b.category_name, 'pt-BR'))
    return rows
  }

  const incomeRows = buildRows('income')
  const expenseRows = buildRows('expense')

  // Compute totals per month
  const totalIncome: Record<string, number> = {}
  const totalExpense: Record<string, number> = {}
  const netResult: Record<string, number> = {}

  for (const m of months) {
    totalIncome[m] = incomeRows.reduce((s, r) => s + (r.values[m] ?? 0), 0)
    totalExpense[m] = expenseRows.reduce((s, r) => s + (r.values[m] ?? 0), 0)
    netResult[m] = totalIncome[m] - totalExpense[m]
  }

  return { months, incomeRows, expenseRows, totalIncome, totalExpense, netResult }
}

// ─────────────────────────────────────────────
// Cash Flow Statement
// ─────────────────────────────────────────────

export async function getCashFlowStatement(
  workspaceId: string,
  year: number,
  accountIds?: string[]
): Promise<CashFlowData> {
  const supabase = await createClient()
  const months = generateMonths(`${year}-01`, `${year}-12`)

  let query = supabase
    .from('transactions')
    .select('type, amount, date')
    .eq('workspace_id', workspaceId)
    .neq('status', 'void')
    .not('type', 'in', '(transfer_in,transfer_out)')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)

  if (accountIds && accountIds.length > 0) {
    query = query.in('account_id', accountIds)
  }

  const { data: transactions } = await query

  // Aggregate by month
  const incomeByMonth = new Map<string, number>()
  const expenseByMonth = new Map<string, number>()

  for (const tx of transactions ?? []) {
    const m = tx.date.slice(0, 7)
    if (tx.type === 'income') {
      incomeByMonth.set(m, (incomeByMonth.get(m) ?? 0) + tx.amount)
    } else if (tx.type === 'expense') {
      expenseByMonth.set(m, (expenseByMonth.get(m) ?? 0) + tx.amount)
    }
  }

  let cumulative = 0
  const monthData: CashFlowMonth[] = months.map((m) => {
    const income = incomeByMonth.get(m) ?? 0
    const expense = expenseByMonth.get(m) ?? 0
    const net = income - expense
    cumulative += net
    return { month: m, income, expense, net, cumulative }
  })

  return {
    months: monthData,
    totalIncome: monthData.reduce((s, m) => s + m.income, 0),
    totalExpense: monthData.reduce((s, m) => s + m.expense, 0),
    totalNet: monthData.reduce((s, m) => s + m.net, 0),
  }
}

// ─────────────────────────────────────────────
// Net Worth Evolution
// ─────────────────────────────────────────────

export async function getNetWorthEvolution(
  workspaceId: string,
  monthCount: number
): Promise<NetWorthData> {
  const supabase = await createClient()

  // Generate past N months
  const now = new Date()
  const months: string[] = []
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // Fetch accounts that contribute to net worth
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, type, opening_balance')
    .eq('workspace_id', workspaceId)
    .eq('include_in_net_worth', true)
    .eq('is_active', true)

  if (!accounts || accounts.length === 0) {
    return {
      current: 0,
      points: [],
      accounts: [],
      changeAmount: 0,
      changePercent: null,
    }
  }

  // For each month, compute balance per account
  // Balance = opening_balance + SUM(income/transfer_in) - SUM(expense/transfer_out) up to last day of month
  const points: NetWorthPoint[] = []

  for (const month of months) {
    const [year, m] = month.split('-').map(Number)
    const lastDay = lastDayOfMonth(year, m)

    const byAccount: Record<string, number> = {}
    let total = 0

    for (const account of accounts) {
      const { data: txs } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('account_id', account.id)
        .neq('status', 'void')
        .lte('date', lastDay)

      const balance = (account.opening_balance ?? 0) +
        (txs ?? []).reduce((sum, tx) => {
          if (tx.type === 'income' || tx.type === 'transfer_in') return sum + tx.amount
          if (tx.type === 'expense' || tx.type === 'transfer_out') return sum - tx.amount
          return sum
        }, 0)

      byAccount[account.id] = balance
      total += balance
    }

    points.push({ month, total, byAccount })
  }

  const current = points.at(-1)?.total ?? 0
  const first = points.at(0)?.total ?? 0
  const changeAmount = current - first
  const changePercent = first !== 0 ? (changeAmount / Math.abs(first)) * 100 : null

  // Current balance per account
  const currentBalances = points.at(-1)?.byAccount ?? {}
  const accountList = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    balance: currentBalances[a.id] ?? 0,
  }))

  return { current, points, accounts: accountList, changeAmount, changePercent }
}
