'use client'

import { useState } from 'react'
import { Target, Calendar, TrendingUp, MoreHorizontal, Archive, Pencil, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { GoalProgressBar } from './GoalProgressBar'
import { ContributionModal } from './ContributionModal'
import { archiveGoal } from '../actions'
import type { GoalWithStats } from '../queries'
import { GOAL_TYPE_LABELS } from '../schemas'
import { cn } from '@/lib/utils'

interface GoalCardProps {
  goal: GoalWithStats
  workspaceId: string
  onEdit?: (goal: GoalWithStats) => void
}

export function GoalCard({ goal, workspaceId, onEdit }: GoalCardProps) {
  const [contributionOpen, setContributionOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const typeLabel = GOAL_TYPE_LABELS[goal.type as keyof typeof GOAL_TYPE_LABELS] ?? goal.type

  async function handleArchive() {
    setArchiving(true)
    await archiveGoal(workspaceId, goal.id)
    setArchiving(false)
  }

  return (
    <>
      <div
        className={cn(
          'rounded-xl border bg-white p-5 shadow-sm dark:bg-gray-900',
          'border-gray-200 dark:border-gray-700',
          goal.is_completed && 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
        )}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl"
              style={{ backgroundColor: goal.color ?? '#6366f1' + '22' }}
            >
              {goal.icon ? (
                <span>{goal.icon}</span>
              ) : (
                <Target className="h-5 w-5" style={{ color: goal.color ?? '#6366f1' }} />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{goal.name}</p>
              <p className="text-xs text-gray-500">{typeLabel}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(goal)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar meta
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleArchive}
                disabled={archiving}
                className="text-red-600"
              >
                <Archive className="mr-2 h-4 w-4" />
                Arquivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="mb-1 flex items-end justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatCurrency(goal.current_amount)}
            </span>
            <span className="text-sm text-gray-500">
              de {formatCurrency(goal.target_amount)}
            </span>
          </div>
          <GoalProgressBar percentage={goal.percentage} />
        </div>

        {/* Meta info */}
        <div className="mb-4 flex flex-wrap gap-3 text-xs text-gray-500">
          {goal.remaining > 0 && (
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Faltam {formatCurrency(goal.remaining)}
            </span>
          )}
          {goal.target_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(parseISO(goal.target_date), "MMM 'de' yyyy", { locale: ptBR })}
              {goal.monthsLeft !== null && goal.monthsLeft > 0 && (
                <span className="ml-1">({goal.monthsLeft} {goal.monthsLeft === 1 ? 'mês' : 'meses'})</span>
              )}
            </span>
          )}
          {goal.requiredMonthly !== null && goal.requiredMonthly > 0 && (
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
              ≈ {formatCurrency(goal.requiredMonthly)}/mês para atingir
            </span>
          )}
        </div>

        {/* Completed badge */}
        {goal.is_completed && (
          <div className="mb-3 rounded-md bg-green-100 px-3 py-1.5 text-center text-sm font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
            🎉 Meta atingida!
          </div>
        )}

        {/* Actions */}
        {!goal.is_completed && (
          <button
            onClick={() => setContributionOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400"
          >
            <Plus className="h-4 w-4" />
            Registrar contribuição
          </button>
        )}

        {/* Recent contributions */}
        {goal.recentContributions.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500">Últimas contribuições</p>
            {goal.recentContributions.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {format(parseISO(c.date), 'dd/MM/yyyy')}
                  {c.note && <span className="ml-1 text-gray-400">· {c.note}</span>}
                </span>
                <span className="font-medium text-green-600">+{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ContributionModal
        open={contributionOpen}
        onClose={() => setContributionOpen(false)}
        workspaceId={workspaceId}
        goalId={goal.id}
        goalName={goal.name}
      />
    </>
  )
}
