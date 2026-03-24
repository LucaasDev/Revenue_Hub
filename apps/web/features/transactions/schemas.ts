import { z } from 'zod'

// Base schema sem superRefine — permite chamar .partial() no updateTransactionSchema
const transactionBaseSchema = z.object({
  account_id: z.string().uuid('Conta inválida'),
  category_id: z.string().uuid('Categoria inválida').optional().nullable(),
  type: z.enum(['income', 'expense', 'transfer', 'opening_balance']),
  amount: z
    .number({ invalid_type_error: 'Valor deve ser um número' })
    .positive('Valor deve ser positivo')
    .max(999_999_999, 'Valor muito alto'),
  currency: z.string().length(3, 'Moeda inválida').default('BRL'),
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição muito longa'),
  notes: z.string().max(2000, 'Notas muito longas').optional().nullable(),
  date: z.string().date('Data inválida'),
  status: z.enum(['pending', 'confirmed']).default('confirmed'),
  // Campos condicionais para transferência
  transfer_to_account_id: z.string().uuid().optional(),
})

export const createTransactionSchema = transactionBaseSchema.superRefine((data, ctx) => {
  if (data.type === 'transfer' && !data.transfer_to_account_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['transfer_to_account_id'],
      message: 'Conta destino é obrigatória para transferências',
    })
  }
  if (data.type === 'expense' && data.status === 'confirmed' && !data.category_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['category_id'],
      message: 'Categoria é obrigatória para despesas',
    })
  }
})

export const updateTransactionSchema = transactionBaseSchema
  .partial()
  .omit({ type: true }) // tipo não pode ser alterado após criação
  .extend({
    id: z.string().uuid(),
  })

export const listTransactionsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(20),
  status: z.enum(['pending', 'confirmed', 'reconciled', 'void']).optional(),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  search: z.string().max(100).optional(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>
