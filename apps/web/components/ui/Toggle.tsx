'use client'

import { cn } from '@/lib/utils/cn'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  id?: string
  size?: 'sm' | 'md'
  className?: string
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
  size = 'md',
  className,
}: ToggleProps) {
  const inputId = id ?? `toggle-${Math.random().toString(36).slice(2, 7)}`

  const trackSize = size === 'sm' ? 'h-4 w-7' : 'h-5 w-9'
  const thumbSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const thumbTranslate = size === 'sm' ? 'translate-x-3.5' : 'translate-x-4.5'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        id={inputId}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-input',
          trackSize,
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-sm',
            'transform transition-transform duration-200 ease-in-out',
            checked ? thumbTranslate : 'translate-x-0',
            thumbSize,
          )}
        />
      </button>
      {(label || description) && (
        <label htmlFor={inputId} className="cursor-pointer select-none">
          {label && <span className="text-sm font-medium text-foreground">{label}</span>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </label>
      )}
    </div>
  )
}

// ToggleGroup — multiple options, only one active (like tabs but compact)
interface ToggleGroupOption<T extends string> {
  value: T
  label: string
}

interface ToggleGroupProps<T extends string> {
  options: ToggleGroupOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
}

export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: ToggleGroupProps<T>) {
  return (
    <div
      role="group"
      className={cn(
        'inline-flex rounded-md border border-border bg-background p-0.5',
        className,
      )}
    >
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={cn(
            'rounded px-3 text-sm font-medium transition-colors',
            size === 'sm' ? 'py-1' : 'py-1.5',
            value === opt.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
