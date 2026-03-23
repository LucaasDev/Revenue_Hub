'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CardList } from './CardList'
import { CardForm } from './CardForm'

interface CardsPageClientProps {
  cards: any[]
  accounts: any[]
  workspaceId: string
  workspaceSlug: string
  workspaceCurrency: string
}

export function CardsPageClient({
  cards,
  accounts,
  workspaceId,
  workspaceSlug,
  workspaceCurrency,
}: CardsPageClientProps) {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Cartões de crédito</h1>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <PlusIcon className="mr-1.5 h-4 w-4" />
          Novo cartão
        </Button>
      </div>

      <CardList cards={cards} workspaceSlug={workspaceSlug} />

      <CardForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        workspaceId={workspaceId}
        workspaceCurrency={workspaceCurrency}
        accounts={accounts}
      />
    </div>
  )
}
