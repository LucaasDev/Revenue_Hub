import { createClient } from '@/lib/supabase/server'
import { getBudgetStatus, type BudgetStatus } from './schemas'

export type BudgetRule = {
  id: string
  workspace_id: string
  category_id: string
  period_type: 'monthly' | 'yearly'
  amount: number
  alert_threshold: number
  is_active: boolean
}

export type BudgetLine = {
  category_id: string
  category_name: string
  category_icon: string | null
  category_color: string | null
  budgeted: number
  spent: number
  percentage: number
  status: BudgetStatus
  alert_threshold: number
  rule_id: string | null
}

export type BudgetSummary = {
  lines: BudgetLine[]
  totalBudgeted: number
  totalSpent: number
  totalPercentage: number
}

// Priority order for sorting budget lines
const STATUS_ORDER: Record<BudgetStatus, number> = {
  exceeded: 0,
  warning: 1,
  ok: 2,
  no_budget: 3,
}

export async function getBudgetSummary(
  workspaceId: string,
  year: number,
  month: number
): Promise<BudgetSummary> {
  const supabase = await createClient()

  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

  // Fetch active budget rules with category info
  const { data: rules } = await supabase
    .from('budget_rules')
    .select(`
      id,
      category_id,
      period_type,
      amount,
      alert_threshold,
      categories (
        id,
        name,
        icon,
        color
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)

  // Fetch actual spending by category for the month
  const { data: expenses } = await supabase
    .from('transactions')
    .select('category_id, amount')
    .eq('workspace_id', workspaceId)
    .eq('type', 'expense')
    .neq('status', 'void')
    .gte('date', firstDay)
    .lte('date', lastDay)

  // Build spending map: category_id → total spent
  const spendingMap = new Map<string, number>()
  for (const tx of expenses ?? []) {
    if (!tx.category_id) continue
    spendingMap.set(tx.category_id, (spendingMap.get(tx.category_id) ?? 0) + tx.amount)
  }

  // Build budget lines from rules
  const lines: BudgetLine[] = []
  const categoriesWithBudget = new Set<string>()

  for (const rule of rules ?? []) {
    const category = Array.isArray(rule.categories) ? rule.categories[0] : rule.categories
    if (!category) continue

    categoriesWithBudget.add(rule.category_id)
    const spent = spendingMap.get(rule.category_id) ?? 0
    const budgeted = rule.period_type === 'yearly' ? rule.amount / 12 : rule.amount
    const percentage = budgeted > 0 ? Math.min(999, (spent / budgeted) * 100) : 0
    const status = getBudgetStatus(spent, budgeted, rule.alert_threshold)

    lines.push({
      category_id: rule.category_id,
      category_name: (category as { name: string }).name,
      category_icon: (category as { icon: string | null }).icon,
      category_color: (category as { color: string | null }).color,
      budgeted,
      spent,
      percentage,
      status,
      alert_threshold: rule.alert_threshold,
      rule_id: rule.id,
    })
  }

  // Add categories with spending but no budget rule
  for (const [categoryId, spent] of spendingMap) {
    if (categoriesWithBudget.has(categoryId)) continue

    const { data: cat } = await supabase
      .from('categories')
      .select('id, name, icon, color')
      .eq('id', categoryId)
      .single()

    if (!cat) continue

    lines.push({
      category_id: categoryId,
      category_name: cat.name,
      category_icon: cat.icon,
      category_color: cat.color,
      budgeted: 0,
      spent,
      percentage: 0,
      status: 'no_budget',
      alert_threshold: 80,
      rule_id: null,
    })
  }

  // Sort: exceeded → warning → ok → no_budget, then by category name
  lines.sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (statusDiff !== 0) return statusDiff
    return a.category_name.localeCompare(b.category_name, 'pt-BR')
  })

  const totalBudgeted = lines.reduce((sum, l) => sum + l.budgeted, 0)
  const totalSpent = lines.reduce((sum, l) => sum + l.spent, 0)
  const totalPercentage = totalBudgeted > 0 ? Math.min(999, (totalSpent / totalBudgeted) * 100) : 0

  return { lines, totalBudgeted, totalSpent, totalPercentage }
}

export async function getPendingBudgetAlerts(
  workspaceId: string,
  year: number,
  month: number
): Promise<{ exceeded: number; warning: number }> {
  const summary = await getBudgetSummary(workspaceId, year, month)
  return {
    exceeded: summary.lines.filter((l) => l.status === 'exceeded').length,
    warning: summary.lines.filter((l) => l.status === 'warning').length,
  }
}

export async function getBudgetRules(workspaceId: string): Promise<BudgetRule[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('budget_rules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  return (data as BudgetRule[]) ?? []
}
