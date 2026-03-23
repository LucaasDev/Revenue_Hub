'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  group?: string
  icon?: ReactNode
  disabled?: boolean
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string | null
  onChange?: (value: string | null) => void
  placeholder?: string
  searchPlaceholder?: string
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
  clearable?: boolean
  id?: string
  className?: string
  emptyText?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  searchPlaceholder = 'Buscar...',
  label,
  hint,
  error,
  disabled,
  clearable = true,
  id,
  className,
  emptyText = 'Nenhuma opção encontrada',
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const inputId = id ?? `combobox-${Math.random().toString(36).slice(2, 7)}`

  const selected = options.find(o => o.value === value)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Esc key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setSearch('') }
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  // Focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.description?.toLowerCase().includes(search.toLowerCase()) ?? false),
  )

  // Group options
  const groups: Record<string, ComboboxOption[]> = {}
  const ungrouped: ComboboxOption[] = []
  for (const opt of filtered) {
    if (opt.group) {
      groups[opt.group] = groups[opt.group] ?? []
      groups[opt.group].push(opt)
    } else {
      ungrouped.push(opt)
    }
  }

  const handleSelect = useCallback(
    (optValue: string) => {
      onChange?.(optValue === value ? null : optValue)
      setOpen(false)
      setSearch('')
    },
    [onChange, value],
  )

  const renderOption = (opt: ComboboxOption) => (
    <button
      key={opt.value}
      type="button"
      role="option"
      aria-selected={value === opt.value}
      disabled={opt.disabled}
      onClick={() => handleSelect(opt.value)}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
        'hover:bg-accent focus-visible:bg-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        value === opt.value && 'bg-accent/60',
      )}
    >
      {opt.icon && <span className="h-4 w-4 flex-shrink-0">{opt.icon}</span>}
      <span className="flex-1 truncate">{opt.label}</span>
      {opt.description && (
        <span className="text-xs text-muted-foreground">{opt.description}</span>
      )}
      {value === opt.value && <CheckIcon className="ml-auto h-4 w-4 flex-shrink-0 text-primary" />}
    </button>
  )

  return (
    <div ref={containerRef} className={cn('relative flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <button
        id={inputId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus:ring-destructive',
        )}
      >
        <span className={cn('truncate', !selected && 'text-muted-foreground')}>
          {selected ? (
            <span className="flex items-center gap-2">
              {selected.icon}
              {selected.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <span className="flex items-center gap-1">
          {clearable && value && (
            <span
              role="button"
              onClick={e => { e.stopPropagation(); onChange?.(null) }}
              className="rounded-full p-0.5 hover:bg-accent"
              aria-label="Limpar"
            >
              <XIcon className="h-3 w-3" />
            </span>
          )}
          <ChevronDownIcon className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-full z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg"
        >
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <SearchIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto py-1">
            {ungrouped.map(renderOption)}
            {Object.entries(groups).map(([groupName, opts]) => (
              <div key={groupName}>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {groupName}
                </p>
                {opts.map(renderOption)}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
            )}
          </div>
        </div>
      )}

      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  )
}
