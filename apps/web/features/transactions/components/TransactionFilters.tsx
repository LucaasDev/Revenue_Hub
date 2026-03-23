'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { SearchIcon, XIcon } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useDebouncedCallback } from 'use-debounce'
import { cn } from '@/lib/utils/cn'

interface FilterOption { value: string; label: string }

const TYPE_OPTIONS: FilterOption[] = [
  { value: '', label: 'Todos' },
  { value: 'income', label: 'Receitas' },
  { value: 'expense', label: 'Despesas' },
  { value: 'transfer', label: 'Transferências' },
]

const STATUS_OPTIONS: FilterOption[] = [
  { value: '', label: 'Todos' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'reconciled', label: 'Conciliadas' },
  { value: 'void', label: 'Estornadas' },
]

interface TransactionFiltersProps {
  categories?: FilterOption[]
  accounts?: FilterOption[]
}

function FilterChip({
  label,
  value,
  selected,
  onClick,
}: {
  label: string
  value: string
  selected: boolean
  onClick: (value: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors',
        selected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}

export function TransactionFilters({ categories = [], accounts = [] }: TransactionFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (!value) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      params.delete('cursor')   // reset pagination on filter change
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const handleSearch = useDebouncedCallback((value: string) => {
    updateParam('search', value || null)
  }, 400)

  const type = searchParams.get('type') ?? ''
  const status = searchParams.get('status') ?? ''
  const categoryId = searchParams.get('category') ?? ''
  const accountId = searchParams.get('account') ?? ''
  const search = searchParams.get('search') ?? ''

  const hasFilters = type || status || categoryId || accountId || search

  const clearAll = () => {
    router.push(pathname, { scroll: false })
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          defaultValue={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar transações..."
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Type */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Tipo:</span>
          <div className="flex gap-1">
            {TYPE_OPTIONS.map(opt => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                value={opt.value}
                selected={type === opt.value}
                onClick={v => updateParam('type', v || null)}
              />
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          <div className="flex gap-1">
            {STATUS_OPTIONS.map(opt => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                value={opt.value}
                selected={status === opt.value}
                onClick={v => updateParam('status', v || null)}
              />
            ))}
          </div>
        </div>

        {/* Category select */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Categoria:</span>
            <select
              value={categoryId}
              onChange={e => updateParam('category', e.target.value || null)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todas</option>
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Account select */}
        {accounts.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Conta:</span>
            <select
              value={accountId}
              onChange={e => updateParam('account', e.target.value || null)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todas</option>
              {accounts.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Clear all */}
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <XIcon className="h-3.5 w-3.5" />
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}
