'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { GoalCard } from './GoalCard'
import { GoalForm } from './GoalForm'
import type { GoalWithStats } from '../queries'

interface GoalsTabsProps {
  active: GoalWithStats[]
  completed: GoalWithStats[]
  workspaceId: string
}

export function GoalsTabs({ active, completed, workspaceId }: GoalsTabsProps) {
  const [tab, setTab] = useState<'active' | 'completed'>('active')
  const [formOpen, setFormOpen] = useState(false)
  const [editGoal, setEditGoal] = useState<GoalWithStats | null>(null)

  const goals = tab === 'active' ? active : completed

  function handleEdit(goal: GoalWithStats) {
    setEditGoal(goal)
    setFormOpen(true)
  }

  function handleCloseForm() {
    setFormOpen(false)
    setEditGoal(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Metas Financeiras</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nova meta
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            tab === 'active'
              ? 'bg-white text-gray-900 shadow dark:bg-gray-800 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Ativas ({active.length})
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            tab === 'completed'
              ? 'bg-white text-gray-900 shadow dark:bg-gray-800 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Concluídas ({completed.length})
        </button>
      </div>

      {/* Goal grid */}
      {goals.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">🎯</span>}
          title={tab === 'active' ? 'Nenhuma meta ativa' : 'Nenhuma meta concluída'}
          description={
            tab === 'active'
              ? 'Crie sua primeira meta financeira e acompanhe seu progresso.'
              : 'Quando você atingir uma meta, ela aparecerá aqui.'
          }
          action={
            tab === 'active'
              ? { label: 'Criar primeira meta', onClick: () => setFormOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              workspaceId={workspaceId}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      <GoalForm
        open={formOpen}
        onClose={handleCloseForm}
        workspaceId={workspaceId}
        goal={editGoal ?? undefined}
      />
    </div>
  )
}
