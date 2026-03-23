import Link from 'next/link'
import { AlertTriangleIcon } from 'lucide-react'

interface PendingRecurrenceBannerProps {
  count: number
  workspaceSlug: string
}

export function PendingRecurrenceBanner({ count, workspaceSlug }: PendingRecurrenceBannerProps) {
  if (count === 0) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 dark:border-yellow-900/40 dark:bg-yellow-900/20">
      <AlertTriangleIcon className="h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
      <p className="flex-1 text-sm text-yellow-800 dark:text-yellow-300">
        Você tem{' '}
        <strong>{count}</strong>{' '}
        {count === 1 ? 'transação recorrente aguardando confirmação' : 'transações recorrentes aguardando confirmação'}.
      </p>
      <Link
        href={`/${workspaceSlug}/transactions?status=pending&source=recurrence`}
        className="text-sm font-medium text-yellow-700 underline-offset-4 hover:underline dark:text-yellow-400"
      >
        Revisar agora →
      </Link>
    </div>
  )
}
