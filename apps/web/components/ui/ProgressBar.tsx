import { cn } from '@/lib/utils/cn'

interface ProgressBarProps {
  value: number          // 0–100
  max?: number
  label?: string
  showValue?: boolean
  variant?: 'default' | 'income' | 'expense' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const variantClass = {
  default: 'bg-primary',
  income: 'bg-income',
  expense: 'bg-expense',
  warning: 'bg-yellow-500',
}

const sizeClass = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  variant = 'default',
  size = 'md',
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {label && <span>{label}</span>}
          {showValue && <span>{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className={cn('w-full overflow-hidden rounded-full bg-muted', sizeClass[size])}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300', variantClass[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
