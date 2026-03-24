'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleSuperAdmin } from '../actions'

interface ToggleAdminButtonProps {
  userId: string
  isAdmin: boolean
}

export function ToggleAdminButton({ userId, isAdmin }: ToggleAdminButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      await toggleSuperAdmin(userId, !isAdmin)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={
        isAdmin
          ? 'rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors'
          : 'rounded-md px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 transition-colors'
      }
    >
      {isPending ? '...' : isAdmin ? 'Remover admin' : 'Tornar admin'}
    </button>
  )
}
