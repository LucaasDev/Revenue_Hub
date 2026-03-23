'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  PauseIcon,
  PlayIcon,
  Trash2Icon,
  MoreHorizontalIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { Badge } from '@/components/ui/Badge'
import { DynamicIcon } from '@/components/ui/IconPicker'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'
import { toggleRecurrenceRule, deleteRecurrenceRule } from '../actions'

interface RecurrenceListProps {
  rules: any[]
  workspaceId: string
}

const FREQ_LABEL: Record<string, string> = {
  daily: 'diária',
  weekly: 'semanal',
  monthly: 'mensal',
  yearly: 'anual',
}

export function RecurrenceList({ rules, workspaceId }: RecurrenceListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const active = rules.filter(r => r.is_active)
  const inactive = rules.filter(r => !r.is_active)

  const handleToggle = (ruleId: string, isActive: boolean) => {
    startTransition(async () => {
      await toggleRecurrenceRule(workspaceId, ruleId, isActive)
      router.refresh()
    })
  }

  const handleDelete = (ruleId: string, name: string) => {
    if (!confirm(`Excluir recorrência "${name}"?`)) return
    startTransition(async () => {
      await deleteRecurrenceRule(workspaceId, ruleId)
      router.refresh()
    })
  }

  if (!rules.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma recorrência configurada.
      </p>
    )
  }

  const renderRule = (rule: any) => {
    const cat = Array.isArray(rule.category) ? rule.category[0] : rule.category
    const acc = Array.isArray(rule.account) ? rule.account[0] : rule.account

    return (
      <div
        key={rule.id}
        className={cn(
          'flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3',
          !rule.is_active && 'opacity-60',
        )}
      >
        {/* Type icon */}
        <div
          className={cn(
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
            rule.type === 'income' ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense',
          )}
        >
          {rule.type === 'income'
            ? <TrendingUpIcon className="h-4 w-4" />
            : <TrendingDownIcon className="h-4 w-4" />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">{rule.description}</p>
            {cat && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <DynamicIcon name={cat.icon} className="h-3 w-3" />
                {cat.name}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {FREQ_LABEL[rule.frequency] ?? rule.frequency}
            {rule.day_of_month ? ` · dia ${rule.day_of_month}` : ''}
            {acc ? ` · ${acc.name}` : ''}
          </p>
          {rule.next_occurrence && (
            <p className="text-xs text-muted-foreground">
              Próxima: {format(new Date(rule.next_occurrence + 'T00:00:00'), "dd 'de' MMM", { locale: ptBR })}
            </p>
          )}
        </div>

        {/* Amount */}
        <p
          className={cn(
            'text-sm font-semibold tabular-nums',
            rule.type === 'income' ? 'text-income' : 'text-expense',
          )}
        >
          {rule.type === 'income' ? '+' : '-'}{formatCurrency(rule.amount, rule.currency)}
        </p>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-md p-1 hover:bg-accent">
            <MoreHorizontalIcon className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleToggle(rule.id, !rule.is_active)}
              icon={rule.is_active ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
            >
              {rule.is_active ? 'Pausar' : 'Retomar'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(rule.id, rule.description)}
              destructive
              icon={<Trash2Icon className="h-4 w-4" />}
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ativas ({active.length})
          </h2>
          <div className="space-y-2">{active.map(renderRule)}</div>
        </section>
      )}
      {inactive.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pausadas / Encerradas ({inactive.length})
          </h2>
          <div className="space-y-2">{inactive.map(renderRule)}</div>
        </section>
      )}
    </div>
  )
}
