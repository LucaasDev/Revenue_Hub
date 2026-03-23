'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { BudgetRow } from './BudgetRow'
import { BudgetRuleModal } from './BudgetRuleModal'
import type { BudgetSummary, BudgetLine } from '../queries'

interface BudgetGridProps {
  summary: BudgetSummary
  workspaceId: string
  expenseCategories: Array<{ id: string; name: string; icon: string | null }>
}

export function BudgetGrid({ summary, workspaceId, expenseCategories }: BudgetGridProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editLine, setEditLine] = useState<BudgetLine | null>(null)

  function handleEdit(line: BudgetLine) {
    setEditLine(line)
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditLine(null)
  }

  return (
    <div>
      {/* Summary bar */}
      {summary.totalBudgeted > 0 && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-sm text-gray-500">Total gasto</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.totalSpent)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Planejado</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.totalBudgeted)}
              </p>
            </div>
          </div>
          <ProgressBar
            value={Math.min(100, summary.totalPercentage)}
            variant={
              summary.totalPercentage >= 100
                ? 'expense'
                : summary.totalPercentage >= 80
                ? 'warning'
                : 'income'
            }
            size="md"
            showLabel={false}
          />
          <p className="mt-1 text-right text-xs text-gray-500">
            {Math.round(summary.totalPercentage)}% utilizado
          </p>
        </div>
      )}

      {/* Header row */}
      {summary.lines.length > 0 && (
        <div className="mb-2 hidden grid-cols-[1fr_100px_60px_120px_80px] gap-4 px-4 sm:grid">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Categoria</p>
          <p className="text-right text-xs font-medium uppercase tracking-wide text-gray-400">Gasto</p>
          <p className="text-right text-xs font-medium uppercase tracking-wide text-gray-400">%</p>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Status</p>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Ações</p>
        </div>
      )}

      {/* Budget lines */}
      {summary.lines.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">📊</span>}
          title="Nenhum orçamento definido"
          description="Defina limites por categoria para controlar seus gastos mensais."
          action={{ label: 'Criar primeiro orçamento', onClick: () => setModalOpen(true) }}
        />
      ) : (
        <div className="space-y-2">
          {summary.lines.map((line) => (
            <BudgetRow
              key={line.category_id}
              line={line}
              workspaceId={workspaceId}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Add button */}
      {summary.lines.length > 0 && (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Novo orçamento
          </Button>
        </div>
      )}

      <BudgetRuleModal
        open={modalOpen}
        onClose={handleClose}
        workspaceId={workspaceId}
        line={editLine ?? undefined}
        categories={expenseCategories}
      />
    </div>
  )
}
