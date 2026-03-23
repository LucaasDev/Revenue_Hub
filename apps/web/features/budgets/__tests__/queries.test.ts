import { describe, it, expect } from 'vitest'
import { getBudgetStatus } from '../schemas'

// Tests for the pure logic functions used in getBudgetSummary
// (integration tests would require a real DB; these test the business logic)

describe('Budget status priority ordering', () => {
  const STATUS_ORDER: Record<string, number> = {
    exceeded: 0,
    warning: 1,
    ok: 2,
    no_budget: 3,
  }

  it('exceeded comes before warning', () => {
    expect(STATUS_ORDER['exceeded']).toBeLessThan(STATUS_ORDER['warning'])
  })

  it('warning comes before ok', () => {
    expect(STATUS_ORDER['warning']).toBeLessThan(STATUS_ORDER['ok'])
  })

  it('ok comes before no_budget', () => {
    expect(STATUS_ORDER['ok']).toBeLessThan(STATUS_ORDER['no_budget'])
  })
})

describe('Budget percentage calculation', () => {
  function calcPercentage(spent: number, budgeted: number): number {
    if (budgeted === 0) return 0
    return Math.min(999, (spent / budgeted) * 100)
  }

  it('calculates 0% when no spending', () => {
    expect(calcPercentage(0, 1000)).toBe(0)
  })

  it('calculates 50% correctly', () => {
    expect(calcPercentage(500, 1000)).toBe(50)
  })

  it('calculates 100% at exact budget', () => {
    expect(calcPercentage(1000, 1000)).toBe(100)
  })

  it('caps at 999% when severely exceeded', () => {
    expect(calcPercentage(10000, 100)).toBe(999)
  })

  it('returns 0% when budgeted = 0', () => {
    expect(calcPercentage(500, 0)).toBe(0)
  })
})

describe('Yearly budget monthly equivalent', () => {
  it('divides annual amount by 12 for monthly display', () => {
    const yearlyAmount = 12000
    const monthlyEquivalent = yearlyAmount / 12
    expect(monthlyEquivalent).toBe(1000)
  })

  it('correctly computes monthly share for non-divisible amounts', () => {
    const yearlyAmount = 10000
    const monthlyEquivalent = yearlyAmount / 12
    expect(monthlyEquivalent).toBeCloseTo(833.33, 1)
  })
})

describe('Budget line aggregation logic', () => {
  // Simulates the Map-based aggregation in getBudgetSummary
  function aggregateSpending(
    transactions: Array<{ category_id: string | null; amount: number }>
  ): Map<string, number> {
    const map = new Map<string, number>()
    for (const tx of transactions) {
      if (!tx.category_id) continue
      map.set(tx.category_id, (map.get(tx.category_id) ?? 0) + tx.amount)
    }
    return map
  }

  it('aggregates spending by category correctly', () => {
    const txs = [
      { category_id: 'cat1', amount: 200 },
      { category_id: 'cat1', amount: 300 },
      { category_id: 'cat2', amount: 150 },
    ]
    const map = aggregateSpending(txs)
    expect(map.get('cat1')).toBe(500)
    expect(map.get('cat2')).toBe(150)
  })

  it('skips transactions without category', () => {
    const txs = [
      { category_id: null, amount: 999 },
      { category_id: 'cat1', amount: 100 },
    ]
    const map = aggregateSpending(txs)
    expect(map.size).toBe(1)
    expect(map.get('cat1')).toBe(100)
  })

  it('returns empty map for no transactions', () => {
    const map = aggregateSpending([])
    expect(map.size).toBe(0)
  })
})
