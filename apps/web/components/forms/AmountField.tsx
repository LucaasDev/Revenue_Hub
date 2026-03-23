'use client'

import { useEffect, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils/cn'

interface AmountFieldProps {
  amountName?: string          // default: 'amount'
  currencyName?: string        // default: 'currency'
  exchangeRateName?: string    // default: 'exchange_rate'
  workspaceCurrency?: string   // default: 'BRL'
  label?: string
  required?: boolean
  className?: string
}

/**
 * Combined field: amount (CurrencyInput) + currency select + optional exchange_rate.
 * Shows exchange_rate field when the selected currency differs from workspace currency.
 * Calculates amount_in_base preview client-side.
 */
export function AmountField({
  amountName = 'amount',
  currencyName = 'currency',
  exchangeRateName = 'exchange_rate',
  workspaceCurrency = 'BRL',
  label = 'Valor',
  required,
  className,
}: AmountFieldProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext()
  const amount: number | null = watch(amountName)
  const currency: string = watch(currencyName) ?? workspaceCurrency
  const exchangeRate: number = watch(exchangeRateName) ?? 1

  const amountError = errors[amountName]?.message as string | undefined
  const rateError = errors[exchangeRateName]?.message as string | undefined

  const showExchangeRate = currency !== workspaceCurrency
  const amountInBase = showExchangeRate && amount && exchangeRate
    ? amount * exchangeRate
    : null

  // Supported currencies (expandable)
  const currencies = ['BRL', 'USD', 'EUR', 'GBP', 'ARS', 'CLP', 'COP', 'MXN']

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-end gap-2">
        {/* Amount */}
        <div className="flex-1">
          <CurrencyInput
            label={label}
            currency={currency}
            value={amount}
            onChange={v => setValue(amountName, v, { shouldValidate: true })}
            error={amountError}
          />
        </div>

        {/* Currency */}
        <div className="w-28">
          <select
            {...register(currencyName)}
            className="h-[38px] w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {currencies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Exchange rate (conditional) */}
      {showExchangeRate && (
        <div className="rounded-md bg-muted/50 p-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Taxa de câmbio {currency} → {workspaceCurrency}
          </p>
          <Input
            {...register(exchangeRateName, { valueAsNumber: true })}
            type="number"
            step="0.0001"
            min="0.0001"
            placeholder="1.00"
            error={rateError}
          />
          {amountInBase != null && (
            <p className="text-xs text-muted-foreground">
              ≈ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: workspaceCurrency }).format(amountInBase)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
