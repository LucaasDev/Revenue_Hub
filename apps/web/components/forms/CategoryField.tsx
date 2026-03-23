'use client'

import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox'
import { DynamicIcon } from '@/components/ui/IconPicker'

interface CategoryNode {
  id: string
  name: string
  type: 'income' | 'expense'
  parent_id: string | null
  icon: string | null
  color: string | null
}

interface CategoryFieldProps {
  name?: string
  label?: string
  required?: boolean
  type: 'income' | 'expense'
  categories: CategoryNode[]
  disabled?: boolean
}

export function CategoryField({
  name = 'category_id',
  label,
  required,
  type,
  categories,
  disabled,
}: CategoryFieldProps) {
  const { setValue, watch, formState: { errors } } = useFormContext()
  const value: string | null = watch(name)
  const error = errors[name]?.message as string | undefined

  // Build hierarchical combobox options
  const options = useMemo<ComboboxOption[]>(() => {
    const filtered = categories.filter(c => c.type === type)
    const parents = filtered.filter(c => c.parent_id === null)
    const children = filtered.filter(c => c.parent_id !== null)

    const result: ComboboxOption[] = []

    for (const parent of parents) {
      result.push({
        value: parent.id,
        label: parent.name,
        group: undefined,
        icon: parent.icon ? <DynamicIcon name={parent.icon} className="h-4 w-4" style={{ color: parent.color ?? undefined }} /> : undefined,
      })
      const subs = children.filter(c => c.parent_id === parent.id)
      for (const sub of subs) {
        result.push({
          value: sub.id,
          label: `  ${sub.name}`,   // indented
          group: parent.name,
          icon: sub.icon ? <DynamicIcon name={sub.icon} className="h-4 w-4" /> : undefined,
        })
      }
    }

    return result
  }, [categories, type])

  return (
    <Combobox
      options={options}
      value={value}
      onChange={v => setValue(name, v, { shouldValidate: true })}
      label={label ?? (required ? 'Categoria *' : 'Categoria')}
      placeholder="Selecionar categoria..."
      searchPlaceholder="Buscar categoria..."
      error={error}
      disabled={disabled}
      emptyText="Nenhuma categoria encontrada"
    />
  )
}
