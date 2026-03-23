'use client'

import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { logout } from '@/features/auth/actions'
import { cn } from '@/lib/utils/cn'

interface TopbarProps {
  workspace: {
    id: string
    name: string
    slug: string
    plan: string
    currency_base: string
  }
}

export function Topbar({ workspace }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b bg-card px-6 h-14 shrink-0">
      {/* Breadcrumb / Título da seção — preenchido por cada página via slot */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{workspace.name}</span>
        <span className="text-border">/</span>
        {/* TODO: Slot de breadcrumb via context ou parallel routes */}
      </div>

      {/* Ações do usuário */}
      <div className="flex items-center gap-2">
        <PlanBadge plan={workspace.plan} />
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </form>
      </div>
    </header>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    free:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    pro:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    family: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }
  const labels: Record<string, string> = {
    free: 'Free', pro: 'Pro', family: 'Family',
  }
  return (
    <span className={cn('text-xs font-medium rounded-full px-2 py-0.5', styles[plan])}>
      {labels[plan] ?? plan}
    </span>
  )
}
