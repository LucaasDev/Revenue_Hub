import { z } from 'zod'

export const createRecurrenceSchema = z
  .object({
    account_id: z.string().uuid('Conta inválida'),
    category_id: z.string().uuid().optional().nullable(),
    description: z.string().min(1, 'Descrição é obrigatória').max(255),
    type: z.enum(['income', 'expense']),
    amount: z
      .number({ invalid_type_error: 'Valor inválido' })
      .positive('Valor deve ser positivo')
      .max(999_999_999),
    currency: z.string().length(3).default('BRL'),
    frequency: z.enum([
      'daily',
      'weekly',
      'biweekly',
      'monthly',
      'bimonthly',
      'quarterly',
      'yearly',
    ]),
    interval_count: z.number().int().min(1).max(12).default(1),
    day_of_month: z.number().int().min(1).max(28).optional().nullable(),
    starts_on: z.string().date('Data de início inválida'),
    ends_on: z.string().date().optional().nullable(),
  })
  .refine(
    (data) => !data.ends_on || data.ends_on > data.starts_on,
    { path: ['ends_on'], message: 'Data de término deve ser após o início' },
  )

export type CreateRecurrenceInput = z.infer<typeof createRecurrenceSchema>
