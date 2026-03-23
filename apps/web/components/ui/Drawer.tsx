'use client'

import { useEffect, type ReactNode } from 'react'
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DrawerProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  side?: 'bottom' | 'right'
  className?: string
}

export function Drawer({ open, onClose, children, side = 'bottom', className }: DrawerProps) {
  // Scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Esc key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const slideClass = {
    bottom: 'bottom-0 left-0 right-0 rounded-t-2xl max-h-[90vh]',
    right: 'top-0 right-0 bottom-0 w-full max-w-md',
  }[side]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed z-50 flex flex-col overflow-hidden bg-background shadow-xl',
          slideClass,
          className,
        )}
      >
        {children}
      </div>
    </>
  )
}

interface DrawerHeaderProps {
  children: ReactNode
  onClose?: () => void
  className?: string
}

export function DrawerHeader({ children, onClose, className }: DrawerHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between border-b border-border px-4 py-3', className)}>
      <div className="font-semibold">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 hover:bg-accent"
          aria-label="Fechar"
        >
          <XIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

export function DrawerBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-4 py-4', className)}>
      {children}
    </div>
  )
}

export function DrawerFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex justify-end gap-2 border-t border-border px-4 py-3', className)}>
      {children}
    </div>
  )
}
