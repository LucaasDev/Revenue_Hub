import { z } from 'zod'

export const createCreditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(60),
  brand: z.enum(['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'other']),
  last_four: z.string().length(4).regex(/^\d{4}$/).optional().nullable(),
  credit_limit: z.number().positive('Limite deve ser positivo'),
  closing_day: z.number().int().min(1).max(28),
  due_day: z.number().int().min(1).max(28),
  account_id: z.string().uuid('Conta de pagamento é obrigatória'),
})

export const updateCreditCardSchema = createCreditCardSchema.partial().extend({
  id: z.string().uuid(),
})

export const createCardTransactionSchema = z.object({
  card_id: z.string().uuid(),
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_installments: z.number().int().min(1).max(48).default(1),
  category_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).optional().nullable(),
})

export const payInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
  paymentAccountId: z.string().uuid(),
  paidAmount: z.number().positive(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardSchema>
export type CreateCardTransactionInput = z.infer<typeof createCardTransactionSchema>
export type PayInvoiceInput = z.infer<typeof payInvoiceSchema>
