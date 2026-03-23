'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RecurrenceList } from './RecurrenceList'
import { RecurrenceForm } from './RecurrenceForm'

interface RecurrencesPageClientProps {
  rules: any[]
  accounts: any[]
  categories: any[]
  workspaceId: string
  workspaceCurrency: string
}

export function RecurrencesPageClient({
  rules,
  accounts,
  categories,
  workspaceId,
  workspaceCurrency,
}: RecurrencesPageClientProps) {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Transações Recorrentes</h1>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <PlusIcon className="mr-1.5 h-4 w-4" />
          Nova recorrência
        </Button>
      </div>

      <RecurrenceList rules={rules} workspaceId={workspaceId} />

      <RecurrenceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        workspaceId={workspaceId}
        workspaceCurrency={workspaceCurrency}
        accounts={accounts}
        categories={categories}
      />
    </div>
  )
}
