'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TransactionForm } from './TransactionForm'

interface TransactionPageActionsProps {
  workspaceId: string
  workspaceSlug: string
  workspaceCurrency?: string
}

export function TransactionPageActions({
  workspaceId,
  workspaceSlug,
  workspaceCurrency,
}: TransactionPageActionsProps) {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setFormOpen(true)}>
        <PlusIcon className="mr-1.5 h-4 w-4" />
        Nova transação
      </Button>

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        workspaceCurrency={workspaceCurrency}
        categories={[]}   // loaded server-side — pass via props in a full impl
        accounts={[]}
      />
    </>
  )
}
