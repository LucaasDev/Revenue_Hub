'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils/cn'

interface DropdownContextValue {
  open: boolean
  setOpen: (v: boolean) => void
}

const DropdownContext = createContext<DropdownContextValue>({ open: false, setOpen: () => {} })

interface DropdownMenuProps {
  children: ReactNode
  className?: string
}

export function DropdownMenu({ children, className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className={cn('relative inline-block', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

interface DropdownMenuTriggerProps {
  children: ReactNode
  asChild?: boolean
  className?: string
}

export function DropdownMenuTrigger({ children, className }: DropdownMenuTriggerProps) {
  const { setOpen, open } = useContext(DropdownContext)
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-haspopup="menu"
      aria-expanded={open}
      className={className}
    >
      {children}
    </button>
  )
}

interface DropdownMenuContentProps {
  children: ReactNode
  align?: 'start' | 'end' | 'center'
  className?: string
}

export function DropdownMenuContent({ children, align = 'end', className }: DropdownMenuContentProps) {
  const { open } = useContext(DropdownContext)
  if (!open) return null

  const alignClass = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  }[align]

  return (
    <div
      role="menu"
      className={cn(
        'absolute top-full z-50 mt-1 min-w-[160px] rounded-lg border border-border bg-popover py-1 shadow-lg',
        alignClass,
        className,
      )}
    >
      {children}
    </div>
  )
}

interface DropdownMenuItemProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  destructive?: boolean
  className?: string
  icon?: ReactNode
}

export function DropdownMenuItem({
  children,
  onClick,
  disabled,
  destructive,
  className,
  icon,
}: DropdownMenuItemProps) {
  const { setOpen } = useContext(DropdownContext)

  return (
    <button
      role="menuitem"
      type="button"
      disabled={disabled}
      onClick={() => {
        onClick?.()
        setOpen(false)
      }}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm',
        'hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        destructive && 'text-destructive hover:bg-destructive/10',
        className,
      )}
    >
      {icon && <span className="h-4 w-4 flex-shrink-0">{icon}</span>}
      {children}
    </button>
  )
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cn('my-1 border-t border-border', className)} />
}

export function DropdownMenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('px-3 py-1.5 text-xs font-semibold text-muted-foreground', className)}>
      {children}
    </p>
  )
}
