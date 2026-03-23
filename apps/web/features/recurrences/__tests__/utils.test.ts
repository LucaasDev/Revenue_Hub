import { describe, it, expect } from 'vitest'
import { getNextOccurrences } from '../utils'
import { format } from 'date-fns'

describe('getNextOccurrences', () => {
  it('returns correct dates for monthly recurrence', () => {
    const starts = new Date('2026-01-05')
    const result = getNextOccurrences(starts, 'monthly', 1, null, 3)
    expect(result).toHaveLength(3)
    expect(format(result[0], 'yyyy-MM-dd')).toBe('2026-01-05')
    expect(format(result[1], 'yyyy-MM-dd')).toBe('2026-02-05')
    expect(format(result[2], 'yyyy-MM-dd')).toBe('2026-03-05')
  })

  it('returns correct dates for weekly recurrence', () => {
    const starts = new Date('2026-03-02')
    const result = getNextOccurrences(starts, 'weekly', 1, null, 3)
    expect(format(result[0], 'yyyy-MM-dd')).toBe('2026-03-02')
    expect(format(result[1], 'yyyy-MM-dd')).toBe('2026-03-09')
    expect(format(result[2], 'yyyy-MM-dd')).toBe('2026-03-16')
  })

  it('returns correct dates for daily recurrence', () => {
    const starts = new Date('2026-03-01')
    const result = getNextOccurrences(starts, 'daily', 1, null, 5)
    expect(result).toHaveLength(5)
    expect(format(result[4], 'yyyy-MM-dd')).toBe('2026-03-05')
  })

  it('returns correct dates for bimonthly (interval=2) recurrence', () => {
    const starts = new Date('2026-01-15')
    const result = getNextOccurrences(starts, 'monthly', 2, null, 3)
    expect(format(result[0], 'yyyy-MM-dd')).toBe('2026-01-15')
    expect(format(result[1], 'yyyy-MM-dd')).toBe('2026-03-15')
    expect(format(result[2], 'yyyy-MM-dd')).toBe('2026-05-15')
  })

  it('respects dayOfMonth override for monthly', () => {
    const starts = new Date('2026-01-01')
    const result = getNextOccurrences(starts, 'monthly', 1, 25, 3)
    // The day_of_month overrides the day from month 2 onward
    expect(format(result[0], 'yyyy-MM-dd')).toBe('2026-01-01')
    const day2 = result[1].getDate()
    expect(day2).toBe(25)
  })

  it('clamps dayOfMonth to last day of short months', () => {
    const starts = new Date('2026-01-31')
    const result = getNextOccurrences(starts, 'monthly', 1, 31, 3)
    // February has 28 days in 2026
    const feb = result[1]
    expect(feb.getMonth()).toBe(1) // February
    expect(feb.getDate()).toBeLessThanOrEqual(28)
  })

  it('returns single occurrence when count=1', () => {
    const starts = new Date('2026-03-20')
    const result = getNextOccurrences(starts, 'monthly', 1, null, 1)
    expect(result).toHaveLength(1)
    expect(format(result[0], 'yyyy-MM-dd')).toBe('2026-03-20')
  })

  it('returns yearly occurrences correctly', () => {
    const starts = new Date('2026-01-01')
    const result = getNextOccurrences(starts, 'yearly', 1, null, 3)
    expect(format(result[0], 'yyyy-MM-dd')).toBe('2026-01-01')
    expect(format(result[1], 'yyyy-MM-dd')).toBe('2027-01-01')
    expect(format(result[2], 'yyyy-MM-dd')).toBe('2028-01-01')
  })
})
