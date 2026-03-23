'use client'

import { useState } from 'react'
import { Settings2, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { BudgetStatusBadge } from './BudgetStatusBadge'
import type { BudgetLine } from '../queries'
import { deactivateBudgetRule } from '../actions'

interface BudgetRowProps {
  line: BudgetLine
  workspaceId: string
  onEdit?: (line: BudgetLine) => void
}

function getProgressVariant(pct: number) {
  if (pct >= 100) return 'expense' as const
  if (pct >= 80) return 'warning' as const
  if (pct > 0) return 'income' as const
  return 'default' as const
}

export function BudgetRow({ line, workspaceId, onEdit }: BudgetRowProps) {
  const [removing, setRemoving] = useState(false)

  async function handleRemove() {
    if (!line.rule_id) return
    setRemoving(true)
    await deactivateBudgetRule(workspaceId, line.rule_id)
    setRemoving(false)
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
      {/* Category icon + name */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {line.category_icon && (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
            style={{ backgroundColor: (line.category_color ?? '#6366f1') + '22' }}
          >
            {line.category_icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
            {line.category_name}
          </p>
          <div className="mt-0.5 w-40 sm:w-56">
            <ProgressBar
              value={Math.min(100, line.percentage)}
              variant={getProgressVariant(line.percentage)}
              size="sm"
              showLabel={false}
            />
          </div>
        </div>
      </div>

      {/* Numbers */}
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {formatCurrency(line.spent)}
        </p>
        {line.budgeted > 0 && (
          <p className="text-xs text-gray-500">de {formatCurrency(line.budgeted)}</p>
        )}
      </div>

      {/* Percentage */}
      <div className="hidden w-12 shrink-0 text-right sm:block">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {line.budgeted > 0 ? `${Math.round(line.percentage)}%` : '—'}
        </p>
      </div>

      {/* Status */}
      <div className="shrink-0">
        <BudgetStatusBadge status={line.status} />
      </div>

      {/* Actions */}
      {line.rule_id && (
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onEdit?.(line)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            title="Editar orçamento"
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            title="Remover orçamento"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
