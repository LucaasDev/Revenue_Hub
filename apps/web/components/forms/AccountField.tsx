'use client'

import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox'
import { formatCurrency } from '@/lib/utils/currency'
import { DynamicIcon } from '@/components/ui/IconPicker'

interface AccountOption {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  icon: string | null
  color: string | null
  is_active: boolean
}

interface AccountFieldProps {
  name?: string
  label?: string
  required?: boolean
  accounts: AccountOption[]
  disabled?: boolean
  excludeId?: string   // exclude account from list (e.g. source account in transfer)
}

export function AccountField({
  name = 'account_id',
  label,
  required,
  accounts,
  disabled,
  excludeId,
}: AccountFieldProps) {
  const { setValue, watch, formState: { errors } } = useFormContext()
  const value: string | null = watch(name)
  const error = errors[name]?.message as string | undefined

  const options = useMemo<ComboboxOption[]>(() =>
    accounts
      .filter(a => a.is_active && a.id !== excludeId)
      .map(a => ({
        value: a.id,
        label: a.name,
        description: formatCurrency(a.balance, a.currency),
        icon: a.icon
          ? <DynamicIcon name={a.icon} className="h-4 w-4" style={{ color: a.color ?? undefined }} />
          : undefined,
      })),
    [accounts, excludeId],
  )

  return (
    <Combobox
      options={options}
      value={value}
      onChange={v => setValue(name, v, { shouldValidate: true })}
      label={label ?? (required ? 'Conta *' : 'Conta')}
      placeholder="Selecionar conta..."
      searchPlaceholder="Buscar conta..."
      error={error}
      disabled={disabled}
      emptyText="Nenhuma conta ativa encontrada"
    />
  )
}
