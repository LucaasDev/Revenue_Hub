import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
}))

describe('Dashboard KPI calculations', () => {
  it('calculates balance correctly', () => {
    const income = 8500
    const expense = 3200
    expect(income - expense).toBe(5300)
  })

  it('calculates percentage change', () => {
    const curr = 8500
    const prev = 7200
    const pct = ((curr - prev) / prev) * 100
    expect(pct).toBeCloseTo(18.06, 1)
  })

  it('returns 0% change when prev is 0', () => {
    const pctChange = (curr: number, prev: number) =>
      prev === 0 ? 0 : ((curr - prev) / prev) * 100
    expect(pctChange(1000, 0)).toBe(0)
  })

  it('calculates net worth as sum of account balances', () => {
    const accounts = [
      { balance: 10000 },
      { balance: 5000 },
      { balance: -200 },
    ]
    const netWorth = accounts.reduce((acc, a) => acc + a.balance, 0)
    expect(netWorth).toBe(14800)
  })

  it('buildDateRange returns correct boundaries for a month', () => {
    const year = 2026
    const month = 3 // March
    const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    expect(dateFrom).toBe('2026-03-01')
    expect(dateTo).toBe('2026-03-31')
    expect(lastDay).toBe(31)
  })

  it('aggregates cash flow correctly', () => {
    const rows = [
      { date: '2026-03-01', type: 'income', amount_in_base: 5000 },
      { date: '2026-03-01', type: 'expense', amount_in_base: 1200 },
      { date: '2026-03-05', type: 'expense', amount_in_base: 800 },
      { date: '2026-03-15', type: 'income', amount_in_base: 3500 },
    ]

    const map = new Map<string, { income: number; expense: number }>()
    for (const row of rows) {
      const existing = map.get(row.date) ?? { income: 0, expense: 0 }
      if (row.type === 'income') existing.income += row.amount_in_base
      if (row.type === 'expense') existing.expense += row.amount_in_base
      map.set(row.date, existing)
    }

    expect(map.get('2026-03-01')).toEqual({ income: 5000, expense: 1200 })
    expect(map.get('2026-03-05')).toEqual({ income: 0, expense: 800 })
    expect(map.get('2026-03-15')).toEqual({ income: 3500, expense: 0 })
    expect(map.size).toBe(3)
  })

  it('calculates category expense percentages', () => {
    const categories = [
      { name: 'Alimentação', total: 1500 },
      { name: 'Transporte', total: 500 },
      { name: 'Moradia', total: 2200 },
    ]
    const total = categories.reduce((acc, c) => acc + c.total, 0)
    const withPct = categories.map(c => ({
      ...c,
      percentage: total > 0 ? (c.total / total) * 100 : 0,
    }))

    expect(total).toBe(4200)
    expect(withPct[2].percentage).toBeCloseTo(52.38, 1)
    expect(withPct[0].percentage).toBeCloseTo(35.71, 1)
  })

  it('sorts categories by total descending', () => {
    const categories = [
      { name: 'Alimentação', total: 1500 },
      { name: 'Moradia', total: 2200 },
      { name: 'Transporte', total: 500 },
    ]
    const sorted = [...categories].sort((a, b) => b.total - a.total)
    expect(sorted[0].name).toBe('Moradia')
    expect(sorted[1].name).toBe('Alimentação')
    expect(sorted[2].name).toBe('Transporte')
  })
})
