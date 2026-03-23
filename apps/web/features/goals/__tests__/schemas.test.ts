import { describe, it, expect } from 'vitest'
import { createGoalSchema, updateGoalSchema, addContributionSchema } from '../schemas'

describe('createGoalSchema', () => {
  const valid = {
    name: 'Viagem para Europa',
    type: 'savings' as const,
    target_amount: 15000,
    target_date: '2026-12-31',
    color: '#6366f1',
  }

  it('accepts valid data', () => {
    expect(createGoalSchema.safeParse(valid).success).toBe(true)
  })

  it('requires name', () => {
    const result = createGoalSchema.safeParse({ ...valid, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 80 chars', () => {
    const result = createGoalSchema.safeParse({ ...valid, name: 'a'.repeat(81) })
    expect(result.success).toBe(false)
  })

  it('rejects non-positive target_amount', () => {
    const result = createGoalSchema.safeParse({ ...valid, target_amount: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects negative target_amount', () => {
    const result = createGoalSchema.safeParse({ ...valid, target_amount: -100 })
    expect(result.success).toBe(false)
  })

  it('accepts target_amount = 0.01', () => {
    const result = createGoalSchema.safeParse({ ...valid, target_amount: 0.01 })
    expect(result.success).toBe(true)
  })

  it('rejects invalid type', () => {
    const result = createGoalSchema.safeParse({ ...valid, type: 'lottery' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid types', () => {
    const types = ['savings', 'debt_payoff', 'purchase', 'investment', 'emergency_fund', 'other']
    for (const type of types) {
      expect(createGoalSchema.safeParse({ ...valid, type }).success).toBe(true)
    }
  })

  it('accepts null target_date', () => {
    const result = createGoalSchema.safeParse({ ...valid, target_date: null })
    expect(result.success).toBe(true)
  })

  it('rejects invalid date format', () => {
    const result = createGoalSchema.safeParse({ ...valid, target_date: '31/12/2026' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid hex color', () => {
    const result = createGoalSchema.safeParse({ ...valid, color: 'purple' })
    expect(result.success).toBe(false)
  })

  it('accepts 3-digit hex color', () => {
    const result = createGoalSchema.safeParse({ ...valid, color: '#fff' })
    expect(result.success).toBe(true)
  })

  it('accepts null account_id', () => {
    const result = createGoalSchema.safeParse({ ...valid, account_id: null })
    expect(result.success).toBe(true)
  })

  it('rejects non-UUID account_id', () => {
    const result = createGoalSchema.safeParse({ ...valid, account_id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })
})

describe('updateGoalSchema', () => {
  it('requires id as uuid', () => {
    const result = updateGoalSchema.safeParse({ id: 'not-a-uuid', name: 'Test' })
    expect(result.success).toBe(false)
  })

  it('accepts partial update with valid id', () => {
    const result = updateGoalSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Updated name',
    })
    expect(result.success).toBe(true)
  })

  it('accepts sort_order as integer', () => {
    const result = updateGoalSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      sort_order: 3,
    })
    expect(result.success).toBe(true)
  })
})

describe('addContributionSchema', () => {
  const valid = {
    goal_id: '550e8400-e29b-41d4-a716-446655440001',
    amount: 500,
    date: '2026-03-22',
    note: 'Bônus de março',
  }

  it('accepts valid data', () => {
    expect(addContributionSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects zero amount', () => {
    const result = addContributionSchema.safeParse({ ...valid, amount: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const result = addContributionSchema.safeParse({ ...valid, amount: -10 })
    expect(result.success).toBe(false)
  })

  it('requires valid goal_id uuid', () => {
    const result = addContributionSchema.safeParse({ ...valid, goal_id: 'not-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid date format', () => {
    const result = addContributionSchema.safeParse({ ...valid, date: '22/03/2026' })
    expect(result.success).toBe(false)
  })

  it('accepts null note', () => {
    const result = addContributionSchema.safeParse({ ...valid, note: null })
    expect(result.success).toBe(true)
  })

  it('rejects note longer than 200 chars', () => {
    const result = addContributionSchema.safeParse({ ...valid, note: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })
})
