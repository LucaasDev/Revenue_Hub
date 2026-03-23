import { CheckCircle2, AlertTriangle, XCircle, MinusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BudgetStatus } from '../schemas'

interface BudgetStatusBadgeProps {
  status: BudgetStatus
  className?: string
}

const CONFIG: Record<BudgetStatus, { label: string; icon: React.FC<{ className?: string }>; className: string }> = {
  ok: {
    label: 'OK',
    icon: CheckCircle2,
    className: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
  },
  warning: {
    label: 'Atenção',
    icon: AlertTriangle,
    className: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30',
  },
  exceeded: {
    label: 'Estourado',
    icon: XCircle,
    className: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
  },
  no_budget: {
    label: 'Sem orçamento',
    icon: MinusCircle,
    className: 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
  },
}

export function BudgetStatusBadge({ status, className }: BudgetStatusBadgeProps) {
  const { label, icon: Icon, className: colorClass } = CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}
