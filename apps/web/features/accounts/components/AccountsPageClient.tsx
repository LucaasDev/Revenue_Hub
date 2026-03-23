'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AccountList } from './AccountList'
import { AccountForm } from './AccountForm'
import type { Database } from '@revenue-hub/database'

type AccountRow = Database['public']['Tables']['accounts']['Row']

interface AccountsPageClientProps {
  accounts: AccountRow[]
  workspaceId: string
  workspaceSlug: string
  workspaceCurrency: string
}

export function AccountsPageClient({
  accounts,
  workspaceId,
  workspaceSlug,
  workspaceCurrency,
}: AccountsPageClientProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Contas</h1>
        <Button size="sm" onClick={() => { setEditingAccount(null); setFormOpen(true) }}>
          <PlusIcon className="mr-1.5 h-4 w-4" />
          Nova conta
        </Button>
      </div>

      <AccountList
        accounts={accounts}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        onEdit={account => {
          setEditingAccount(account)
          setFormOpen(true)
        }}
      />

      <AccountForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingAccount(null) }}
        account={editingAccount}
        workspaceId={workspaceId}
        workspaceCurrency={workspaceCurrency}
      />
    </div>
  )
}
