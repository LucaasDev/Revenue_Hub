'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { createBudgetRuleSchema, type CreateBudgetRuleInput } from '../schemas'
import { upsertBudgetRule, updateBudgetRule } from '../actions'
import type { BudgetLine } from '../queries'

interface BudgetRuleModalProps {
  open: boolean
  onClose: () => void
  workspaceId: string
  line?: BudgetLine  // editing mode
  categories: Array<{ id: string; name: string; icon: string | null }>
}

export function BudgetRuleModal({
  open,
  onClose,
  workspaceId,
  line,
  categories,
}: BudgetRuleModalProps) {
  const isDesktop = useBreakpoint('md')
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = Boolean(line?.rule_id)

  const form = useForm<CreateBudgetRuleInput>({
    resolver: zodResolver(createBudgetRuleSchema),
    defaultValues: {
      category_id: line?.category_id ?? '',
      period_type: 'monthly',
      amount: line?.budgeted ?? 0,
      alert_threshold: line?.alert_threshold ?? 80,
    },
  })

  async function onSubmit(data: CreateBudgetRuleInput) {
    setServerError(null)
    startTransition(async () => {
      let result
      if (isEdit && line?.rule_id) {
        result = await updateBudgetRule(workspaceId, { ...data, id: line.rule_id })
      } else {
        result = await upsertBudgetRule(workspaceId, data)
      }
      if (!result.ok) {
        setServerError(result.error)
        return
      }
      onClose()
    })
  }

  const content = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Category selector (disabled in edit mode) */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Categoria <span className="text-red-500">*</span>
        </label>
        <select
          {...form.register('category_id')}
          disabled={isEdit}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">Selecione uma categoria</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon ? `${cat.icon} ` : ''}{cat.name}
            </option>
          ))}
        </select>
        {form.formState.errors.category_id && (
          <p className="mt-1 text-xs text-red-500">{form.formState.errors.category_id.message}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Valor do orçamento <span className="text-red-500">*</span>
        </label>
        <CurrencyInput
          value={form.watch('amount')}
          onChange={(val) => form.setValue('amount', val)}
          currency="BRL"
        />
        {form.formState.errors.amount && (
          <p className="mt-1 text-xs text-red-500">{form.formState.errors.amount.message}</p>
        )}
      </div>

      {/* Period type */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Período
        </label>
        <select
          {...form.register('period_type')}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="monthly">Mensal</option>
          <option value="yearly">Anual (dividido por 12)</option>
        </select>
      </div>

      {/* Alert threshold */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Alertar ao atingir{' '}
          <span className="font-semibold text-amber-600">{form.watch('alert_threshold')}%</span>
        </label>
        <input
          type="range"
          min={50}
          max={95}
          step={5}
          {...form.register('alert_threshold', { valueAsNumber: true })}
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>50%</span>
          <span>95%</span>
        </div>
      </div>

      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
      )}
    </form>
  )

  const actions = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
      <Button onClick={form.handleSubmit(onSubmit)} loading={isPending} disabled={isPending}>
        {isEdit ? 'Salvar' : 'Criar orçamento'}
      </Button>
    </>
  )

  const title = isEdit ? 'Editar orçamento' : 'Novo orçamento'

  if (isDesktop) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogHeader><h2 className="text-lg font-semibold">{title}</h2></DialogHeader>
        <DialogBody>{content}</DialogBody>
        <DialogFooter>{actions}</DialogFooter>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onClose={onClose} side="bottom">
      <DrawerHeader><h2 className="text-base font-semibold">{title}</h2></DrawerHeader>
      <DrawerBody>{content}</DrawerBody>
      <DrawerFooter>{actions}</DrawerFooter>
    </Drawer>
  )
}
