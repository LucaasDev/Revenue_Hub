import { describe, it, expect } from 'vitest'
import { calculateGoalStats } from '../queries'

describe('calculateGoalStats', () => {
  it('calculates percentage correctly', () => {
    const stats = calculateGoalStats(7500, 15000, null)
    expect(stats.percentage).toBe(50)
  })

  it('caps percentage at 100 when exceeded', () => {
    const stats = calculateGoalStats(20000, 15000, null)
    expect(stats.percentage).toBe(100)
  })

  it('returns 0 percentage when target is 0', () => {
    const stats = calculateGoalStats(0, 0, null)
    expect(stats.percentage).toBe(0)
  })

  it('calculates remaining correctly', () => {
    const stats = calculateGoalStats(3000, 10000, null)
    expect(stats.remaining).toBe(7000)
  })

  it('returns 0 remaining when goal exceeded', () => {
    const stats = calculateGoalStats(15000, 10000, null)
    expect(stats.remaining).toBe(0)
  })

  it('calculates monthsLeft when target_date provided', () => {
    const now = new Date('2026-03-01')
    const stats = calculateGoalStats(0, 10000, '2026-09-01', now)
    expect(stats.monthsLeft).toBe(6)
  })

  it('returns 0 monthsLeft when target_date is in the past', () => {
    const now = new Date('2026-03-01')
    const stats = calculateGoalStats(0, 10000, '2025-01-01', now)
    expect(stats.monthsLeft).toBe(0)
  })

  it('calculates requiredMonthly correctly', () => {
    const now = new Date('2026-03-01')
    // remaining = 6000, monthsLeft = 6, required = 1000/month
    const stats = calculateGoalStats(4000, 10000, '2026-09-01', now)
    expect(stats.requiredMonthly).toBeCloseTo(1000, 0)
  })

  it('returns null monthsLeft when no target_date', () => {
    const stats = calculateGoalStats(5000, 10000, null)
    expect(stats.monthsLeft).toBeNull()
    expect(stats.requiredMonthly).toBeNull()
  })

  it('returns null requiredMonthly when already achieved', () => {
    const now = new Date('2026-03-01')
    const stats = calculateGoalStats(10000, 10000, '2026-09-01', now)
    // remaining = 0, so requiredMonthly should be null
    expect(stats.requiredMonthly).toBeNull()
  })
})
