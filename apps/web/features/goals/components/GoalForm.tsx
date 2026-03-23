'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { createGoalSchema, updateGoalSchema, GOAL_TYPES, GOAL_TYPE_LABELS, type CreateGoalInput, type UpdateGoalInput } from '../schemas'
import { createGoal, updateGoal } from '../actions'
import type { Goal } from '../queries'

interface GoalFormProps {
  open: boolean
  onClose: () => void
  workspaceId: string
  goal?: Goal  // if provided → edit mode
}

const GOAL_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']

export function GoalForm({ open, onClose, workspaceId, goal }: GoalFormProps) {
  const isDesktop = useBreakpoint('md')
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = Boolean(goal)

  const form = useForm<CreateGoalInput>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: goal
      ? {
          name: goal.name,
          description: goal.description ?? '',
          type: goal.type as CreateGoalInput['type'],
          target_amount: goal.target_amount,
          target_date: goal.target_date ?? '',
          account_id: goal.account_id ?? undefined,
          color: goal.color ?? '#6366f1',
          icon: goal.icon ?? undefined,
        }
      : {
          name: '',
          description: '',
          type: 'savings',
          target_amount: 0,
          target_date: '',
          color: '#6366f1',
        },
  })

  async function onSubmit(data: CreateGoalInput) {
    setServerError(null)
    startTransition(async () => {
      let result
      if (isEdit && goal) {
        result = await updateGoal(workspaceId, { ...data, id: goal.id })
      } else {
        result = await createGoal(workspaceId, data)
      }

      if (!result.ok) {
        setServerError(result.error)
        return
      }
      form.reset()
      onClose()
    })
  }

  const content = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nome <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="Ex: Viagem para Europa"
          {...form.register('name')}
          className="w-full"
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Type */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tipo <span className="text-red-500">*</span>
        </label>
        <select
          {...form.register('type')}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          {GOAL_TYPES.map((t) => (
            <option key={t} value={t}>{GOAL_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {/* Target amount */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Valor alvo <span className="text-red-500">*</span>
        </label>
        <CurrencyInput
          value={form.watch('target_amount')}
          onChange={(val) => form.setValue('target_amount', val)}
          currency="BRL"
        />
        {form.formState.errors.target_amount && (
          <p className="mt-1 text-xs text-red-500">{form.formState.errors.target_amount.message}</p>
        )}
      </div>

      {/* Target date */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Data limite <span className="text-gray-400">(opcional)</span>
        </label>
        <Input
          type="date"
          {...form.register('target_date')}
          className="w-full"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Descrição <span className="text-gray-400">(opcional)</span>
        </label>
        <textarea
          {...form.register('description')}
          rows={2}
          placeholder="Detalhe o objetivo desta meta..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      {/* Color */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Cor</label>
        <ColorPicker
          value={form.watch('color') ?? '#6366f1'}
          onChange={(c) => form.setValue('color', c)}
          presets={GOAL_COLORS}
        />
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
        {isEdit ? 'Salvar alterações' : 'Criar meta'}
      </Button>
    </>
  )

  const title = isEdit ? 'Editar meta' : 'Nova meta financeira'

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
