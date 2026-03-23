import { describe, it, expect } from 'vitest'
import { createBudgetRuleSchema, updateBudgetRuleSchema, getBudgetStatus } from '../schemas'

describe('createBudgetRuleSchema', () => {
  const valid = {
    category_id: '550e8400-e29b-41d4-a716-446655440000',
    period_type: 'monthly' as const,
    amount: 1000,
    alert_threshold: 80,
  }

  it('accepts valid data', () => {
    expect(createBudgetRuleSchema.safeParse(valid).success).toBe(true)
  })

  it('defaults period_type to monthly', () => {
    const result = createBudgetRuleSchema.safeParse({ ...valid, period_type: undefined })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.period_type).toBe('monthly')
  })

  it('defaults alert_threshold to 80', () => {
    const result = createBudgetRuleSchema.safeParse({ ...valid, alert_threshold: undefined })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.alert_threshold).toBe(80)
  })

  it('rejects zero amount', () => {
    const result = createBudgetRuleSchema.safeParse({ ...valid, amount: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const result = createBudgetRuleSchema.safeParse({ ...valid, amount: -500 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid category_id', () => {
    const result = createBudgetRuleSchema.safeParse({ ...valid, category_id: 'not-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects alert_threshold = 0', () => {
    const result = createBudgetRuleSchema.safeParse({ ...valid, alert_threshold: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects alert_threshold = 100', () => {
    const result = createBudgetRuleSchema.safeParse({ ...valid, alert_threshold: 100 })
    expect(result.success).toBe(false)
  })

  it('accepts alert_threshold = 99', () => {
    const result = createBudgetRuleSchema.safeParse({ ...valid, alert_threshold: 99 })
    expect(result.success).toBe(true)
  })

  it('rejects invalid period_type', () => {
    const result = createBudgetRuleSchema.safeParse({ ...valid, period_type: 'weekly' })
    expect(result.success).toBe(false)
  })

  it('accepts yearly period', () => {
    const result = createBudgetRuleSchema.safeParse({ ...valid, period_type: 'yearly' })
    expect(result.success).toBe(true)
  })
})

describe('updateBudgetRuleSchema', () => {
  it('requires valid uuid id', () => {
    const result = updateBudgetRuleSchema.safeParse({ id: 'bad-id', amount: 500 })
    expect(result.success).toBe(false)
  })

  it('accepts partial update', () => {
    const result = updateBudgetRuleSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      amount: 2000,
    })
    expect(result.success).toBe(true)
  })
})

describe('getBudgetStatus', () => {
  it('returns ok when spent < threshold', () => {
    expect(getBudgetStatus(600, 1000, 80)).toBe('ok')
  })

  it('returns warning when spent >= threshold', () => {
    expect(getBudgetStatus(800, 1000, 80)).toBe('warning')
  })

  it('returns warning at exactly threshold', () => {
    expect(getBudgetStatus(800, 1000, 80)).toBe('warning')
  })

  it('returns exceeded when spent >= budgeted', () => {
    expect(getBudgetStatus(1000, 1000, 80)).toBe('exceeded')
  })

  it('returns exceeded when spent > budgeted', () => {
    expect(getBudgetStatus(1200, 1000, 80)).toBe('exceeded')
  })

  it('returns no_budget when budgeted = 0', () => {
    expect(getBudgetStatus(500, 0, 80)).toBe('no_budget')
  })

  it('respects custom threshold of 50', () => {
    expect(getBudgetStatus(500, 1000, 50)).toBe('warning')
    expect(getBudgetStatus(400, 1000, 50)).toBe('ok')
  })

  it('returns ok when spent = 0', () => {
    expect(getBudgetStatus(0, 1000, 80)).toBe('ok')
  })
})
