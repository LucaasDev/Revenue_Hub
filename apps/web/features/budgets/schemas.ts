import { z } from 'zod'

export const createBudgetRuleSchema = z.object({
  category_id: z.string().uuid('Categoria inválida'),
  period_type: z.enum(['monthly', 'yearly']).default('monthly'),
  amount: z.number().positive('Valor deve ser maior que zero'),
  alert_threshold: z.number().int().min(1).max(99).default(80),
})

export const updateBudgetRuleSchema = createBudgetRuleSchema.partial().extend({
  id: z.string().uuid(),
})

export type CreateBudgetRuleInput = z.infer<typeof createBudgetRuleSchema>
export type UpdateBudgetRuleInput = z.infer<typeof updateBudgetRuleSchema>

export type BudgetStatus = 'ok' | 'warning' | 'exceeded' | 'no_budget'

export function getBudgetStatus(
  spent: number,
  budgeted: number,
  threshold: number
): BudgetStatus {
  if (budgeted === 0) return 'no_budget'
  const pct = (spent / budgeted) * 100
  if (pct >= 100) return 'exceeded'
  if (pct >= threshold) return 'warning'
  return 'ok'
}
