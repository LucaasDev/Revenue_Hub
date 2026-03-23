'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ============================================================
// Contexto
// ============================================================
interface DialogContextValue {
  open: boolean
  onClose: () => void
}

const DialogContext = React.createContext<DialogContextValue>({
  open: false,
  onClose: () => {},
})

// ============================================================
// Root
// ============================================================
interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Dialog({ open, onClose, children }: DialogProps) {
  // Fechar com Esc
  React.useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Travar scroll do body
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <DialogContext.Provider value={{ open, onClose }}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
        aria-hidden="true"
      />
      {children}
    </DialogContext.Provider>
  )
}

// ============================================================
// Content
// ============================================================
interface DialogContentProps {
  children: React.ReactNode
  className?: string
  /** Largura máxima. Default: max-w-md */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizeMap: Record<NonNullable<DialogContentProps['size']>, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  full: 'max-w-full',
}

export function DialogContent({ children, className, size = 'md' }: DialogContentProps) {
  const { onClose } = React.useContext(DialogContext)

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2',
        'rounded-lg border bg-background shadow-xl',
        'animate-in fade-in-0 zoom-in-95',
        sizeMap[size],
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
      {children}
    </div>
  )
}

// ============================================================
// Sub-componentes semânticos
// ============================================================
export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 p-6 pb-0', className)}
      {...props}
    />
  )
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 p-6 pt-0 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}
