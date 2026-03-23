'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// Cursor-based pagination (matches spec)
interface CursorPaginationProps {
  hasNextPage: boolean
  hasPrevPage: boolean
  onNext: () => void
  onPrev: () => void
  loading?: boolean
  className?: string
}

export function CursorPagination({
  hasNextPage,
  hasPrevPage,
  onNext,
  onPrev,
  loading,
  className,
}: CursorPaginationProps) {
  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrevPage || loading}
        className={cn(
          'flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm',
          'hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40',
        )}
        aria-label="Página anterior"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Anterior
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasNextPage || loading}
        className={cn(
          'flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm',
          'hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40',
        )}
        aria-label="Próxima página"
      >
        Próxima
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

// Simple page-number pagination (for smaller lists)
interface PagePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function PagePagination({ page, totalPages, onPageChange, className }: PagePaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <nav aria-label="Paginação" className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-md p-1.5 hover:bg-accent disabled:opacity-40"
        aria-label="Página anterior"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'h-8 w-8 rounded-md text-sm',
              p === page
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent',
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-md p-1.5 hover:bg-accent disabled:opacity-40"
        aria-label="Próxima página"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </nav>
  )
}
