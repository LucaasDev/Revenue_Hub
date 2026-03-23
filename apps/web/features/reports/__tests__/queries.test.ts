import { describe, it, expect } from 'vitest'

// Tests for pure logic extracted from reports/queries.ts
// These test the computation logic without requiring a DB connection.

// ─────────────────────────────────────────────
// Month generation
// ─────────────────────────────────────────────

function generateMonths(from: string, to: string): string[] {
  const months: string[] = []
  const [fromYear, fromMonth] = from.split('-').map(Number)
  const [toYear, toMonth] = to.split('-').map(Number)
  let year = fromYear
  let month = fromMonth
  while (year < toYear || (year === toYear && month <= toMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`)
    month++
    if (month > 12) { month = 1; year++ }
  }
  return months
}

describe('generateMonths', () => {
  it('generates 3 months for Jan-Mar same year', () => {
    const months = generateMonths('2026-01', '2026-03')
    expect(months).toEqual(['2026-01', '2026-02', '2026-03'])
  })

  it('generates single month when from = to', () => {
    const months = generateMonths('2026-06', '2026-06')
    expect(months).toHaveLength(1)
    expect(months[0]).toBe('2026-06')
  })

  it('crosses year boundary correctly', () => {
    const months = generateMonths('2025-11', '2026-02')
    expect(months).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
  })

  it('generates 12 months for a full year', () => {
    const months = generateMonths('2026-01', '2026-12')
    expect(months).toHaveLength(12)
  })
})

// ─────────────────────────────────────────────
// Income Statement — aggregation math
// ─────────────────────────────────────────────

describe('Income statement aggregation', () => {
  function sumByMonth(rows: Array<{ values: Record<string, number> }>, month: string): number {
    return rows.reduce((sum, r) => sum + (r.values[month] ?? 0), 0)
  }

  const months = ['2026-01', '2026-02', '2026-03']

  const incomeRows = [
    { category_name: 'Salário', values: { '2026-01': 5000, '2026-02': 5000, '2026-03': 5000 } },
    { category_name: 'Freelance', values: { '2026-01': 1200, '2026-02': 800, '2026-03': 2000 } },
  ]

  const expenseRows = [
    { category_name: 'Alimentação', values: { '2026-01': 780, '2026-02': 820, '2026-03': 710 } },
    { category_name: 'Moradia', values: { '2026-01': 1800, '2026-02': 1800, '2026-03': 1800 } },
  ]

  it('sums income correctly for Jan', () => {
    expect(sumByMonth(incomeRows, '2026-01')).toBe(6200)
  })

  it('sums expenses correctly for Jan', () => {
    expect(sumByMonth(expenseRows, '2026-01')).toBe(2580)
  })

  it('computes net result for Jan', () => {
    const income = sumByMonth(incomeRows, '2026-01')
    const expense = sumByMonth(expenseRows, '2026-01')
    expect(income - expense).toBe(3620)
  })

  it('computes cumulative net correctly', () => {
    let cumulative = 0
    for (const month of months) {
      const income = sumByMonth(incomeRows, month)
      const expense = sumByMonth(expenseRows, month)
      cumulative += income - expense
    }
    // Jan: 6200-2580=3620 | Feb: 5800-2620=3180 | Mar: 7000-2510=4490
    expect(cumulative).toBeCloseTo(11290, 0)
  })
})

// ─────────────────────────────────────────────
// Cash Flow — cumulative calculation
// ─────────────────────────────────────────────

describe('Cash flow cumulative', () => {
  function computeCumulative(monthlyNets: number[]): number[] {
    let acc = 0
    return monthlyNets.map((n) => { acc += n; return acc })
  }

  it('computes cumulative correctly for 3 months', () => {
    const nets = [1000, 2000, -500]
    const result = computeCumulative(nets)
    expect(result).toEqual([1000, 3000, 2500])
  })

  it('handles all-negative months', () => {
    const nets = [-100, -200, -300]
    const result = computeCumulative(nets)
    expect(result).toEqual([-100, -300, -600])
  })

  it('handles zero net months', () => {
    const nets = [0, 0, 500]
    const result = computeCumulative(nets)
    expect(result).toEqual([0, 0, 500])
  })
})

// ─────────────────────────────────────────────
// Net worth — account balance simulation
// ─────────────────────────────────────────────

describe('Account balance calculation', () => {
  function computeBalance(
    openingBalance: number,
    transactions: Array<{ type: string; amount: number }>
  ): number {
    return transactions.reduce((bal, tx) => {
      if (tx.type === 'income' || tx.type === 'transfer_in') return bal + tx.amount
      if (tx.type === 'expense' || tx.type === 'transfer_out') return bal - tx.amount
      return bal
    }, openingBalance)
  }

  it('adds income to opening balance', () => {
    const balance = computeBalance(0, [{ type: 'income', amount: 5000 }])
    expect(balance).toBe(5000)
  })

  it('subtracts expenses from balance', () => {
    const balance = computeBalance(5000, [{ type: 'expense', amount: 2000 }])
    expect(balance).toBe(3000)
  })

  it('handles transfers', () => {
    const balance = computeBalance(
      1000,
      [
        { type: 'transfer_in', amount: 500 },
        { type: 'transfer_out', amount: 300 },
      ]
    )
    expect(balance).toBe(1200)
  })

  it('ignores unknown transaction types', () => {
    const balance = computeBalance(1000, [{ type: 'other', amount: 999 }])
    expect(balance).toBe(1000)
  })

  it('uses opening_balance as starting point', () => {
    const balance = computeBalance(10000, [])
    expect(balance).toBe(10000)
  })
})

// ─────────────────────────────────────────────
// Net worth change calculation
// ─────────────────────────────────────────────

describe('Net worth change', () => {
  function calcChange(
    current: number,
    first: number
  ): { amount: number; percent: number | null } {
    const amount = current - first
    const percent = first !== 0 ? (amount / Math.abs(first)) * 100 : null
    return { amount, percent }
  }

  it('calculates positive change correctly', () => {
    const { amount, percent } = calcChange(50000, 36000)
    expect(amount).toBe(14000)
    expect(percent).toBeCloseTo(38.89, 1)
  })

  it('calculates negative change correctly', () => {
    const { amount, percent } = calcChange(8000, 10000)
    expect(amount).toBe(-2000)
    expect(percent).toBeCloseTo(-20, 1)
  })

  it('returns null percent when first = 0', () => {
    const { amount, percent } = calcChange(5000, 0)
    expect(amount).toBe(5000)
    expect(percent).toBeNull()
  })

  it('returns 0 change when current = first', () => {
    const { amount, percent } = calcChange(20000, 20000)
    expect(amount).toBe(0)
    expect(percent).toBe(0)
  })
})
