import { createClient } from '@/lib/supabase/server'
import { differenceInMonths, parseISO } from 'date-fns'

export type Goal = {
  id: string
  workspace_id: string
  name: string
  description: string | null
  type: string
  target_amount: number
  current_amount: number
  target_date: string | null
  account_id: string | null
  color: string | null
  icon: string | null
  is_completed: boolean
  is_archived: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type GoalContribution = {
  id: string
  goal_id: string
  workspace_id: string
  amount: number
  note: string | null
  date: string
  created_at: string
}

export type GoalWithStats = Goal & {
  percentage: number
  remaining: number
  monthsLeft: number | null
  requiredMonthly: number | null
  recentContributions: GoalContribution[]
  linkedAccountBalance: number | null
}

export async function getGoals(workspaceId: string): Promise<GoalWithStats[]> {
  const supabase = await createClient()

  const { data: goals, error } = await supabase
    .from('goals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_archived', false)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!goals || goals.length === 0) return []

  // Fetch recent contributions for all goals
  const goalIds = goals.map((g) => g.id)
  const { data: contributions } = await supabase
    .from('goal_contributions')
    .select('*')
    .in('goal_id', goalIds)
    .order('date', { ascending: false })

  const now = new Date()

  return goals.map((goal) => {
    const percentage = goal.target_amount > 0
      ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
      : 0

    const remaining = Math.max(0, goal.target_amount - goal.current_amount)

    let monthsLeft: number | null = null
    let requiredMonthly: number | null = null
    if (goal.target_date) {
      const targetDate = parseISO(goal.target_date)
      monthsLeft = Math.max(0, differenceInMonths(targetDate, now))
      if (monthsLeft > 0 && remaining > 0) {
        requiredMonthly = remaining / monthsLeft
      }
    }

    const recentContributions = (contributions ?? [])
      .filter((c) => c.goal_id === goal.id)
      .slice(0, 3)

    return {
      ...goal,
      percentage,
      remaining,
      monthsLeft,
      requiredMonthly,
      recentContributions,
      linkedAccountBalance: null, // populated separately if needed
    }
  })
}

export async function getArchivedGoals(workspaceId: string): Promise<GoalWithStats[]> {
  const supabase = await createClient()

  const { data: goals, error } = await supabase
    .from('goals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_archived', true)
    .order('updated_at', { ascending: false })

  if (error) throw error
  if (!goals) return []

  return goals.map((goal) => {
    const percentage = goal.target_amount > 0
      ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
      : 0
    return {
      ...goal,
      percentage,
      remaining: Math.max(0, goal.target_amount - goal.current_amount),
      monthsLeft: null,
      requiredMonthly: null,
      recentContributions: [],
      linkedAccountBalance: null,
    }
  })
}

export async function getGoalContributions(
  workspaceId: string,
  goalId: string,
  limit = 20
): Promise<GoalContribution[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('goal_id', goalId)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

/**
 * Calculates goal stats from raw values (used in tests and server-side rendering).
 */
export function calculateGoalStats(
  currentAmount: number,
  targetAmount: number,
  targetDate: string | null,
  now = new Date()
) {
  const percentage = targetAmount > 0
    ? Math.min(100, (currentAmount / targetAmount) * 100)
    : 0
  const remaining = Math.max(0, targetAmount - currentAmount)

  let monthsLeft: number | null = null
  let requiredMonthly: number | null = null
  if (targetDate) {
    const target = parseISO(targetDate)
    monthsLeft = Math.max(0, differenceInMonths(target, now))
    if (monthsLeft > 0 && remaining > 0) {
      requiredMonthly = remaining / monthsLeft
    }
  }

  return { percentage, remaining, monthsLeft, requiredMonthly }
}
