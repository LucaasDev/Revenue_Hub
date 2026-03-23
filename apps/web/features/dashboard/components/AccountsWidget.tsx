import Link from 'next/link'
import { DynamicIcon } from '@/components/ui/IconPicker'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'
import type { AccountBalance } from '../queries'

interface AccountsWidgetProps {
  accounts: AccountBalance[]
  workspaceSlug: string
}

export function AccountsWidget({ accounts, workspaceSlug }: AccountsWidgetProps) {
  if (!accounts.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma conta ativa.{' '}
        <Link href={`/${workspaceSlug}/accounts`} className="text-primary underline-offset-4 hover:underline">
          Criar conta
        </Link>
      </p>
    )
  }

  const maxBalance = Math.max(...accounts.map(a => Math.abs(a.balance)), 1)

  return (
    <div className="space-y-3">
      {accounts.map(account => (
        <Link
          key={account.id}
          href={`/${workspaceSlug}/accounts`}
          className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent"
        >
          {/* Icon */}
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: account.color ? `${account.color}20` : undefined }}
          >
            <DynamicIcon
              name={account.icon}
              className="h-4 w-4"
              // @ts-ignore inline style
              style={{ color: account.color ?? undefined }}
            />
          </div>

          {/* Name + progress */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between">
              <span className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                {account.name}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  account.balance >= 0 ? 'text-income' : 'text-expense',
                )}
              >
                {formatCurrency(account.balance, account.currency)}
              </span>
            </div>
            <ProgressBar
              value={Math.abs(account.balance)}
              max={maxBalance}
              size="sm"
              variant={account.balance >= 0 ? 'income' : 'expense'}
            />
          </div>
        </Link>
      ))}
    </div>
  )
}
