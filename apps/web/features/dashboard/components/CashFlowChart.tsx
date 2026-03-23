'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils/currency'
import type { CashFlowDay } from '../queries'

interface CashFlowChartProps {
  data: CashFlowDay[]
  currency?: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  const date = label ? format(parseISO(label), 'dd/MM/yyyy', { locale: ptBR }) : ''
  const income = payload.find(p => p.name === 'income')?.value ?? 0
  const expense = payload.find(p => p.name === 'expense')?.value ?? 0

  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-md text-sm">
      <p className="mb-2 font-medium text-foreground">{date}</p>
      <p className="text-income">Receitas: {formatCurrency(income)}</p>
      <p className="text-expense">Despesas: {formatCurrency(expense)}</p>
    </div>
  )
}

export function CashFlowChart({ data, currency = 'BRL' }: CashFlowChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Nenhuma movimentação no período
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={d => format(parseISO(d), 'dd/MM', { locale: ptBR })}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={v => formatCurrency(v, currency, { compact: true })}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))' }} />
        <Bar dataKey="income" name="income" fill="hsl(var(--income))" radius={[3, 3, 0, 0]} maxBarSize={24} />
        <Bar dataKey="expense" name="expense" fill="hsl(var(--expense))" radius={[3, 3, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}
