'use client'

import { useFormContext } from 'react-hook-form'
import { DatePicker } from '@/components/ui/DatePicker'

interface DateFieldProps {
  name?: string
  label?: string
  hint?: string
  required?: boolean
  min?: string
  max?: string
  placeholder?: string
  disabled?: boolean
}

export function DateField({
  name = 'date',
  label,
  hint,
  required,
  min,
  max,
  placeholder,
  disabled,
}: DateFieldProps) {
  const { setValue, watch, formState: { errors } } = useFormContext()
  const value: string | null = watch(name)
  const error = errors[name]?.message as string | undefined

  return (
    <DatePicker
      value={value}
      onChange={v => setValue(name, v, { shouldValidate: true })}
      label={label ?? (required ? 'Data *' : 'Data')}
      hint={hint}
      error={error}
      min={min}
      max={max}
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}
