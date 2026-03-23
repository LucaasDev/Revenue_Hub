import { z } from 'zod'

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  type: z.enum(['checking', 'savings', 'wallet', 'investment', 'other']),
  institution: z.string().max(100).optional().nullable(),
  currency: z.string().length(3).default('BRL'),
  opening_balance: z.number().min(0).default(0),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{3,6}$/, 'Cor inválida')
    .optional()
    .nullable(),
  icon: z.string().max(50).optional().nullable(),
  include_in_net_worth: z.boolean().default(true),
})

export const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.string().uuid(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
})

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
