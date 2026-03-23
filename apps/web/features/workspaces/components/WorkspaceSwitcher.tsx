'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Workspace {
  id: string
  name: string
  slug: string
  plan: string
}

interface WorkspaceSwitcherProps {
  workspaces: Workspace[]
  currentSlug: string
}

const planColors: Record<string, string> = {
  free:   'bg-gray-200 text-gray-700',
  pro:    'bg-blue-100 text-blue-700',
  family: 'bg-purple-100 text-purple-700',
}

export function WorkspaceSwitcher({ workspaces, currentSlug }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const current = workspaces.find((w) => w.slug === currentSlug)

  function handleSelect(slug: string) {
    setOpen(false)
    if (slug !== currentSlug) {
      router.push(`/${slug}/dashboard`)
    }
  }

  function handleCreate() {
    setOpen(false)
    router.push('/new-workspace')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium',
          'hover:bg-muted transition-colors w-full',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate max-w-[140px]">{current?.name ?? 'Workspaces'}</span>
        <ChevronDown
          className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="listbox"
            className={cn(
              'absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border bg-popover shadow-md',
              'py-1 animate-in fade-in-0 zoom-in-95',
            )}
          >
            <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Seus workspaces
            </p>

            {workspaces.map((ws) => (
              <button
                key={ws.id}
                role="option"
                aria-selected={ws.slug === currentSlug}
                onClick={() => handleSelect(ws.slug)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-sm',
                  'hover:bg-muted transition-colors text-left',
                  ws.slug === currentSlug && 'font-medium',
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  {/* Avatar inicial */}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                    {ws.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{ws.name}</span>
                </span>

                <span className="flex items-center gap-1.5 shrink-0">
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium', planColors[ws.plan] ?? planColors.free)}>
                    {ws.plan}
                  </span>
                  {ws.slug === currentSlug && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </span>
              </button>
            ))}

            <div className="my-1 h-px bg-border" />

            <button
              onClick={handleCreate}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plus className="h-4 w-4" />
              Novo workspace
            </button>
          </div>
        </>
      )}
    </div>
  )
}
