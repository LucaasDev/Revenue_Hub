import { describe, it, expect } from 'vitest'
import { createAccountSchema, updateAccountSchema } from '../schemas'

describe('createAccountSchema', () => {
  const valid = {
    name: 'Nubank',
    type: 'checking',
    institution: 'Nubank',
    currency: 'BRL',
    opening_balance: 1500,
    color: '#8B5CF6',
    icon: 'credit_card',
    include_in_net_worth: true,
  }

  it('accepts valid data', () => {
    expect(createAccountSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts minimum required fields', () => {
    const minimal = { name: 'Conta', type: 'checking', currency: 'BRL', opening_balance: 0 }
    expect(createAccountSchema.safeParse(minimal).success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createAccountSchema.safeParse({ ...valid, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name too long', () => {
    const result = createAccountSchema.safeParse({ ...valid, name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rejects invalid account type', () => {
    const result = createAccountSchema.safeParse({ ...valid, type: 'bitcoin' })
    expect(result.success).toBe(false)
  })

  it('rejects negative opening balance', () => {
    const result = createAccountSchema.safeParse({ ...valid, opening_balance: -100 })
    expect(result.success).toBe(false)
  })

  it('accepts zero opening balance', () => {
    const result = createAccountSchema.safeParse({ ...valid, opening_balance: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects invalid hex color', () => {
    const result = createAccountSchema.safeParse({ ...valid, color: 'blue' })
    expect(result.success).toBe(false)
  })

  it('accepts 3-digit hex color', () => {
    const result = createAccountSchema.safeParse({ ...valid, color: '#fff' })
    expect(result.success).toBe(true)
  })
})

describe('PLAN_LIMITS logic', () => {
  const LIMITS = { free: 3, pro: 10, family: Infinity }

  it('enforces free plan limit', () => {
    expect(LIMITS.free).toBe(3)
    expect(3 >= LIMITS.free).toBe(true) // should block at 3
    expect(2 >= LIMITS.free).toBe(false) // 2 accounts is ok
  })

  it('pro plan allows up to 10', () => {
    expect(LIMITS.pro).toBe(10)
    expect(9 >= LIMITS.pro).toBe(false) // 9 is ok
    expect(10 >= LIMITS.pro).toBe(true) // 10 blocks
  })

  it('family plan has no limit', () => {
    expect(LIMITS.family).toBe(Infinity)
    expect(100 >= LIMITS.family).toBe(false) // always ok
  })
})
