'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/format'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { NetWorthPoint } from '../queries'

interface NetWorthChartProps {
  points: NetWorthPoint[]
}

export function NetWorthChart({ points }: NetWorthChartProps) {
  const data = points.map((p) => ({
    name: format(parseISO(`${p.month}-01`), 'MMM/yy', { locale: ptBR }),
    total: p.total,
  }))

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
            formatter={(value: number) => [formatCurrency(value), 'Patrimônio']}
            labelStyle={{ fontWeight: 600 }}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Patrimônio Líquido"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#netWorthGradient)"
            dot={{ r: 3, fill: '#6366f1' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
