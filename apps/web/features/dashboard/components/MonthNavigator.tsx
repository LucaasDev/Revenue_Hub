'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useWorkspaceStore } from '@/store/workspace'
import { cn } from '@/lib/utils/cn'

export function MonthNavigator({ className }: { className?: string }) {
  const activeMonth = useWorkspaceStore(s => s.activeMonth)
  const setActiveMonth = useWorkspaceStore(s => s.setActiveMonth)

  const label = format(activeMonth, 'MMMM yyyy', { locale: ptBR })
  const isCurrentMonth =
    format(activeMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => setActiveMonth(subMonths(activeMonth, 1))}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Mês anterior"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => setActiveMonth(new Date())}
        className={cn(
          'min-w-[140px] rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors',
          'hover:bg-accent',
          isCurrentMonth ? 'text-primary' : 'text-foreground',
        )}
        title="Ir para mês atual"
      >
        {label}
      </button>

      <button
        type="button"
        onClick={() => setActiveMonth(addMonths(activeMonth, 1))}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Próximo mês"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
