'use client'

import {
  type FieldPath,
  type FieldValues,
  useFormContext,
  Controller,
} from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  name: TName
  label?: string
  hint?: string
  required?: boolean
  className?: string
  children: (field: {
    value: unknown
    onChange: (value: unknown) => void
    onBlur: () => void
    ref: React.Ref<unknown>
    error?: string
  }) => ReactNode
}

/**
 * Generic FormField wrapper that connects any input to react-hook-form.
 * Usage:
 *   <FormField name="amount" label="Valor">
 *     {field => <CurrencyInput {...field} />}
 *   </FormField>
 */
export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, label, hint, required, className, children }: FormFieldProps<TFieldValues, TName>) {
  const {
    control,
    formState: { errors },
  } = useFormContext<TFieldValues>()

  const error = errors[name]?.message as string | undefined

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={cn('flex flex-col gap-1.5', className)}>
          {label && (
            <label className="text-sm font-medium text-foreground">
              {label}
              {required && <span className="ml-0.5 text-destructive">*</span>}
            </label>
          )}
          {children({ ...field, error })}
          {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    />
  )
}

// Convenience: text input field
interface TextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  name: TName
  label?: string
  hint?: string
  required?: boolean
  placeholder?: string
  type?: string
  className?: string
  disabled?: boolean
}

export function TextField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, label, hint, required, placeholder, type = 'text', className, disabled }: TextFieldProps<TFieldValues, TName>) {
  const { register, formState: { errors } } = useFormContext<TFieldValues>()
  const error = errors[name]?.message as string | undefined

  return (
    <Input
      {...register(name)}
      label={label}
      hint={hint}
      error={error}
      placeholder={placeholder}
      type={type}
      disabled={disabled}
      className={className}
    />
  )
}
