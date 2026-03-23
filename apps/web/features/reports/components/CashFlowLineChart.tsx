'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { formatCurrency } from '@/lib/format'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { CashFlowMonth } from '../queries'

interface CashFlowLineChartProps {
  months: CashFlowMonth[]
}

function formatMonth(month: string): string {
  return format(parseISO(`${month}-01`), 'MMM/yy', { locale: ptBR })
}

export function CashFlowLineChart({ months }: CashFlowLineChartProps) {
  const data = months.map((m) => ({
    name: formatMonth(m.month),
    cumulative: m.cumulative,
    net: m.net,
  }))

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(v, { compact: true })}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), '']}
            labelStyle={{ fontWeight: 600 }}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="cumulative"
            name="Saldo Acumulado"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#6366f1' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="net"
            name="Resultado Mensal"
            stroke="#10b981"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
