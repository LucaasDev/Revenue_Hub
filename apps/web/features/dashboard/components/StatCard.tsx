import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'

interface StatCardProps {
  title: string
  value: number
  currency?: string
  trend?: number        // % change vs previous period (+12.5 or -3.2)
  trendLabel?: string   // "vs mês anterior"
  variant?: 'income' | 'expense' | 'neutral'
  loading?: boolean
}

export function StatCard({
  title,
  value,
  currency = 'BRL',
  trend,
  trendLabel = 'vs mês anterior',
  variant = 'neutral',
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-5 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-28" />
        </CardContent>
      </Card>
    )
  }

  const valueColor = {
    income: 'text-income',
    expense: 'text-expense',
    neutral: 'text-foreground',
  }[variant]

  const hasTrend = trend != null
  const trendPositive = (trend ?? 0) > 0
  const trendNegative = (trend ?? 0) < 0

  // For expense: more expense is bad (red), less is good (green)
  // For income: more income is good (green), less is bad (red)
  const trendGood =
    variant === 'expense' ? trendNegative :
    variant === 'income'  ? trendPositive :
    trendPositive

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn('mt-1 text-2xl font-bold tabular-nums', valueColor)}>
          {formatCurrency(value, currency)}
        </p>
        {hasTrend && (
          <div className="mt-2 flex items-center gap-1">
            {trendGood ? (
              <TrendingUpIcon className="h-3.5 w-3.5 text-income" />
            ) : (
              <TrendingDownIcon className="h-3.5 w-3.5 text-expense" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                trendGood ? 'text-income' : 'text-expense',
              )}
            >
              {trendPositive ? '+' : ''}{trend?.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">{trendLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
