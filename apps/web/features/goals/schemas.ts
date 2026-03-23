import { z } from 'zod'

export const GOAL_TYPES = [
  'savings',
  'debt_payoff',
  'purchase',
  'investment',
  'emergency_fund',
  'other',
] as const

export type GoalType = (typeof GOAL_TYPES)[number]

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  savings: 'Poupança',
  debt_payoff: 'Quitação de Dívida',
  purchase: 'Compra / Aquisição',
  investment: 'Investimento',
  emergency_fund: 'Reserva de Emergência',
  other: 'Outro',
}

export const createGoalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(80, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional().nullable(),
  type: z.enum(GOAL_TYPES),
  target_amount: z.number().positive('Valor deve ser maior que zero'),
  target_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional()
    .nullable(),
  account_id: z.string().uuid().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{3,6}$/, 'Cor inválida')
    .optional()
    .nullable(),
  icon: z.string().max(50).optional().nullable(),
})

export const updateGoalSchema = createGoalSchema.partial().extend({
  id: z.string().uuid(),
  sort_order: z.number().int().optional(),
})

export const addContributionSchema = z.object({
  goal_id: z.string().uuid(),
  amount: z.number().positive('Valor deve ser maior que zero'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  note: z.string().max(200, 'Nota muito longa').optional().nullable(),
})

export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
export type AddContributionInput = z.infer<typeof addContributionSchema>
