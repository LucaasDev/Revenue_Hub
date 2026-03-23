'use client'

import { forwardRef, useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { format, isValid, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DatePickerProps {
  value?: string | null   // ISO date string: 'YYYY-MM-DD'
  onChange?: (value: string | null) => void
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
  id?: string
  min?: string
  max?: string
  placeholder?: string
  className?: string
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function buildCalendar(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = getDaysInMonth(year, month)
  const weeks: (Date | null)[][] = []
  let day = 1 - firstDay

  for (let w = 0; w < 6; w++) {
    const week: (Date | null)[] = []
    for (let d = 0; d < 7; d++) {
      if (day < 1 || day > daysInMonth) {
        week.push(null)
      } else {
        week.push(new Date(year, month, day))
      }
      day++
    }
    weeks.push(week)
    if (day > daysInMonth) break
  }
  return weeks
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, label, hint, error, disabled, id, min, max, placeholder, className }, ref) => {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const parsed = value ? new Date(value + 'T00:00:00') : null
    const today = new Date()

    const [viewYear, setViewYear] = useState(() => parsed?.getFullYear() ?? today.getFullYear())
    const [viewMonth, setViewMonth] = useState(() => parsed?.getMonth() ?? today.getMonth())

    const inputId = id ?? `datepicker-${Math.random().toString(36).slice(2, 7)}`
    const displayValue = parsed && isValid(parsed) ? format(parsed, 'dd/MM/yyyy') : ''

    const selectDate = useCallback(
      (date: Date) => {
        const iso = format(date, 'yyyy-MM-dd')
        onChange?.(iso)
        setOpen(false)
      },
      [onChange],
    )

    const prevMonth = () => {
      if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
      else setViewMonth(m => m - 1)
    }

    const nextMonth = () => {
      if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
      else setViewMonth(m => m + 1)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    const weeks = buildCalendar(viewYear, viewMonth)
    const monthLabel = format(new Date(viewYear, viewMonth, 1), 'MMMM yyyy', { locale: ptBR })

    return (
      <div ref={containerRef} className={cn('relative flex flex-col gap-1.5', className)} onKeyDown={handleKeyDown}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type="text"
            readOnly
            value={displayValue}
            onClick={() => !disabled && setOpen(o => !o)}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-invalid={!!error}
            placeholder={placeholder ?? 'dd/mm/aaaa'}
            className={cn(
              'w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive focus:ring-destructive',
            )}
          />
          <CalendarIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        {open && (
          <div
            role="dialog"
            aria-label="Calendário"
            className="absolute top-full z-50 mt-1 w-72 rounded-lg border border-border bg-popover p-3 shadow-lg"
          >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded p-1 hover:bg-accent"
                aria-label="Mês anterior"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium capitalize">{monthLabel}</span>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded p-1 hover:bg-accent"
                aria-label="Próximo mês"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="mb-1 grid grid-cols-7 text-center">
              {WEEKDAYS.map(d => (
                <span key={d} className="text-xs font-medium text-muted-foreground">{d}</span>
              ))}
            </div>

            {/* Days */}
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 text-center">
                {week.map((day, di) => {
                  if (!day) return <span key={di} />
                  const iso = format(day, 'yyyy-MM-dd')
                  const isSelected = value === iso
                  const isToday = format(today, 'yyyy-MM-dd') === iso
                  const isDisabled =
                    (min && iso < min) || (max && iso > max)

                  return (
                    <button
                      key={di}
                      type="button"
                      onClick={() => !isDisabled && selectDate(day)}
                      disabled={!!isDisabled}
                      className={cn(
                        'mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm',
                        'hover:bg-accent',
                        isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                        isToday && !isSelected && 'font-semibold text-primary',
                        isDisabled && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            ))}

            {/* Footer */}
            <div className="mt-2 border-t border-border pt-2 text-center">
              <button
                type="button"
                onClick={() => selectDate(today)}
                className="text-xs text-primary hover:underline"
              >
                Hoje
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange?.(null); setOpen(false) }}
                  className="ml-4 text-xs text-muted-foreground hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        )}

        {hint && !error && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-destructive" role="alert">{error}</p>
        )}
      </div>
    )
  },
)

DatePicker.displayName = 'DatePicker'
