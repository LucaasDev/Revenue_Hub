'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#a855f7', '#ec4899', '#f43f5e',
  '#78716c', '#6b7280', '#0f172a', '#ffffff',
]

interface ColorPickerProps {
  value?: string | null
  onChange?: (value: string) => void
  label?: string
  error?: string
  id?: string
}

function isValidHex(hex: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)
}

export function ColorPicker({ value, onChange, label, error, id }: ColorPickerProps) {
  const [custom, setCustom] = useState(value ?? '#3b82f6')
  const inputId = id ?? `colorpicker-${Math.random().toString(36).slice(2, 7)}`

  const selected = value ?? custom

  const handleCustomChange = (raw: string) => {
    const hex = raw.startsWith('#') ? raw : `#${raw}`
    setCustom(hex)
    if (isValidHex(hex)) onChange?.(hex)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      {/* Swatches */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map(color => (
          <button
            key={color}
            type="button"
            onClick={() => onChange?.(color)}
            style={{ backgroundColor: color }}
            className={cn(
              'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
              selected === color ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-transparent',
            )}
            aria-label={`Cor ${color}`}
            aria-pressed={selected === color}
          />
        ))}
      </div>
      {/* Custom hex input */}
      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 flex-shrink-0 rounded-full border border-border"
          style={{ backgroundColor: isValidHex(selected) ? selected : '#3b82f6' }}
        />
        <input
          id={inputId}
          type="text"
          value={custom}
          onChange={e => handleCustomChange(e.target.value)}
          maxLength={7}
          placeholder="#000000"
          className={cn(
            'w-28 rounded-md border border-input bg-background px-2 py-1 font-mono text-xs',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
            error && 'border-destructive',
          )}
        />
      </div>
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  )
}
