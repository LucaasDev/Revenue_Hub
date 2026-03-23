'use client'

import { forwardRef, useCallback, useRef, type ChangeEvent, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils/cn'

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | null
  onChange?: (value: number | null) => void
  currency?: string
  locale?: string
  label?: string
  hint?: string
  error?: string
}

function formatDisplay(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function parseRawInput(raw: string): number | null {
  // Remove tudo exceto dígitos e vírgula/ponto
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits || digits === '0') return null
  // Interpreta como centavos
  const cents = parseInt(digits, 10)
  return cents / 100
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onChange,
      currency = 'BRL',
      locale = 'pt-BR',
      label,
      hint,
      error,
      className,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null)

    const displayValue =
      value != null && value !== 0
        ? formatDisplay(value, currency, locale)
        : ''

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        const parsed = parseRawInput(raw)
        onChange?.(parsed)
      },
      [onChange],
    )

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        // Permite: backspace, delete, tab, escape, enter, arrows, home, end
        const allowed = [
          'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
          'ArrowLeft', 'ArrowRight', 'Home', 'End',
        ]
        if (allowed.includes(e.key)) return
        // Bloqueia letras e símbolos (exceto números)
        if (!/^\d$/.test(e.key)) {
          e.preventDefault()
        }
      },
      [],
    )

    const inputId = id ?? `currency-${Math.random().toString(36).slice(2, 7)}`

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref ?? inputRef}
            id={inputId}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive focus:ring-destructive',
              className,
            )}
            placeholder={formatDisplay(0, currency, locale)}
            {...props}
          />
        </div>
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)

CurrencyInput.displayName = 'CurrencyInput'
