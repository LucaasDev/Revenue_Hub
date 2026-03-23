'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  Target,
  PieChart,
  BarChart3,
  Settings,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useWorkspaceStore } from '@/store/workspace'
import type { Enums } from '@revenue-hub/database'

interface SidebarProps {
  workspace: {
    id: string
    name: string
    slug: string
    plan: string
    currency_base: string
  }
  userRole: Enums<'workspace_role'>
}

const navItems = [
  { href: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: 'transactions', label: 'Transações',   icon: ArrowLeftRight  },
  { href: 'accounts',     label: 'Contas',       icon: Wallet          },
  { href: 'cards',        label: 'Cartões',      icon: CreditCard      },
  { href: 'goals',        label: 'Metas',        icon: Target          },
  { href: 'budgets',      label: 'Orçamentos',   icon: PieChart        },
  { href: 'reports',      label: 'Relatórios',   icon: BarChart3       },
]

export function Sidebar({ workspace, userRole }: SidebarProps) {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useWorkspaceStore()
  const base = `/${workspace.slug}`

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b h-14">
        {!sidebarCollapsed && (
          <span className="font-semibold text-sm truncate">{workspace.name}</span>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto rounded-md p-1 hover:bg-muted"
          aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform', sidebarCollapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const href = `${base}/${item.href}`
          const isActive = pathname.startsWith(href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t">
        <Link
          href={`${base}/settings`}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
            pathname.startsWith(`${base}/settings`) && 'bg-muted text-foreground',
          )}
          title={sidebarCollapsed ? 'Configurações' : undefined}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Configurações</span>}
        </Link>
      </div>
    </aside>
  )
}
