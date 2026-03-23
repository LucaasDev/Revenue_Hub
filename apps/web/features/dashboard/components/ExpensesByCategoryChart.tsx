'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils/currency'
import { DynamicIcon } from '@/components/ui/IconPicker'
import type { CategoryExpense } from '../queries'

interface ExpensesByCategoryChartProps {
  data: CategoryExpense[]
  currency?: string
}

const FALLBACK_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
]

export function ExpensesByCategoryChart({ data, currency = 'BRL' }: ExpensesByCategoryChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Sem despesas no período
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      {/* Donut */}
      <div className="h-40 w-40 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              dataKey="total"
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.categoryId}
                  fill={entry.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value, currency)}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 overflow-hidden">
        {data.map((cat, i) => (
          <div key={cat.categoryId} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: cat.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
            />
            {cat.icon && (
              <DynamicIcon name={cat.icon} className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            )}
            <span className="flex-1 truncate text-muted-foreground">{cat.name}</span>
            <span className="font-medium tabular-nums">{cat.percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
