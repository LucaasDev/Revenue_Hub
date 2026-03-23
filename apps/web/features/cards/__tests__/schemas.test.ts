import { describe, it, expect } from 'vitest'
import { createCreditCardSchema, createCardTransactionSchema, payInvoiceSchema } from '../schemas'

describe('createCreditCardSchema', () => {
  const valid = {
    name: 'Nubank Roxo',
    brand: 'visa' as const,
    last_four: '1234',
    credit_limit: 10000,
    closing_day: 12,
    due_day: 20,
    account_id: '550e8400-e29b-41d4-a716-446655440000',
  }

  it('accepts valid data', () => {
    expect(createCreditCardSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects closing_day > 28', () => {
    const result = createCreditCardSchema.safeParse({ ...valid, closing_day: 31 })
    expect(result.success).toBe(false)
  })

  it('rejects closing_day < 1', () => {
    const result = createCreditCardSchema.safeParse({ ...valid, closing_day: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects negative credit_limit', () => {
    const result = createCreditCardSchema.safeParse({ ...valid, credit_limit: -100 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid last_four (non-digits)', () => {
    const result = createCreditCardSchema.safeParse({ ...valid, last_four: 'abcd' })
    expect(result.success).toBe(false)
  })

  it('rejects last_four with wrong length', () => {
    const result = createCreditCardSchema.safeParse({ ...valid, last_four: '12345' })
    expect(result.success).toBe(false)
  })

  it('accepts null last_four', () => {
    const result = createCreditCardSchema.safeParse({ ...valid, last_four: null })
    expect(result.success).toBe(true)
  })

  it('rejects invalid brand', () => {
    const result = createCreditCardSchema.safeParse({ ...valid, brand: 'unknown' })
    expect(result.success).toBe(false)
  })
})

describe('createCardTransactionSchema', () => {
  const valid = {
    card_id: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Netflix',
    amount: 55.90,
    currency: 'BRL',
    date: '2026-03-15',
    total_installments: 1,
  }

  it('accepts valid data', () => {
    expect(createCardTransactionSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts installments up to 48', () => {
    const result = createCardTransactionSchema.safeParse({ ...valid, total_installments: 48 })
    expect(result.success).toBe(true)
  })

  it('rejects installments > 48', () => {
    const result = createCardTransactionSchema.safeParse({ ...valid, total_installments: 60 })
    expect(result.success).toBe(false)
  })

  it('rejects zero amount', () => {
    const result = createCardTransactionSchema.safeParse({ ...valid, amount: 0 })
    expect(result.success).toBe(false)
  })

  it('defaults total_installments to 1', () => {
    const result = createCardTransactionSchema.safeParse({ ...valid, total_installments: undefined })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.total_installments).toBe(1)
  })
})

describe('payInvoiceSchema', () => {
  const valid = {
    invoiceId: '550e8400-e29b-41d4-a716-446655440000',
    paymentAccountId: '550e8400-e29b-41d4-a716-446655440001',
    paidAmount: 890,
    paymentDate: '2026-03-20',
  }

  it('accepts valid data', () => {
    expect(payInvoiceSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects zero paidAmount', () => {
    const result = payInvoiceSchema.safeParse({ ...valid, paidAmount: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid date format', () => {
    const result = payInvoiceSchema.safeParse({ ...valid, paymentDate: '20/03/2026' })
    expect(result.success).toBe(false)
  })
})

describe('Invoice period algorithm', () => {
  // Test the logic from actions.ts getInvoicePeriod
  function getInvoicePeriod(purchaseDate: Date, closingDay: number) {
    const year = purchaseDate.getFullYear()
    const month = purchaseDate.getMonth()
    const day = purchaseDate.getDate()

    let periodStart: Date
    let periodEnd: Date

    if (day < closingDay) {
      const prevMonth = month === 0
        ? new Date(year - 1, 11, closingDay)
        : new Date(year, month - 1, closingDay)
      periodStart = prevMonth
      periodEnd = new Date(year, month, closingDay - 1)
    } else {
      periodStart = new Date(year, month, closingDay)
      const nextClosing = month === 11
        ? new Date(year + 1, 0, closingDay)
        : new Date(year, month + 1, closingDay)
      periodEnd = new Date(nextClosing.getFullYear(), nextClosing.getMonth(), nextClosing.getDate() - 1)
    }

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { periodStart: fmt(periodStart), periodEnd: fmt(periodEnd) }
  }

  it('assigns purchase before closing day to current cycle', () => {
    // closing day = 12, purchase on 10th → belongs to current cycle
    const result = getInvoicePeriod(new Date('2026-03-10'), 12)
    expect(result.periodEnd).toContain('2026-03-11')
  })

  it('assigns purchase on closing day to next cycle', () => {
    const result = getInvoicePeriod(new Date('2026-03-12'), 12)
    expect(result.periodStart).toBe('2026-03-12')
  })

  it('assigns purchase after closing day to next cycle', () => {
    const result = getInvoicePeriod(new Date('2026-03-20'), 12)
    expect(result.periodStart).toBe('2026-03-12')
  })
})
