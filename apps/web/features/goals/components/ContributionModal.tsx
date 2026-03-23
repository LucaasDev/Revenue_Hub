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
import { addContributionSchema, type AddContributionInput } from '../schemas'
import { addGoalContribution, removeGoalContribution } from '../actions'
import { format } from 'date-fns'

interface ContributionModalProps {
  open: boolean
  onClose: () => void
  workspaceId: string
  goalId: string
  goalName: string
}

export function ContributionModal({
  open,
  onClose,
  workspaceId,
  goalId,
  goalName,
}: ContributionModalProps) {
  const isDesktop = useBreakpoint('md')
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<AddContributionInput>({
    resolver: zodResolver(addContributionSchema),
    defaultValues: {
      goal_id: goalId,
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
    },
  })

  async function onSubmit(data: AddContributionInput) {
    setServerError(null)
    startTransition(async () => {
      const result = await addGoalContribution(workspaceId, data)
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
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Valor
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

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Data
        </label>
        <Input
          type="date"
          {...form.register('date')}
          className="w-full"
        />
        {form.formState.errors.date && (
          <p className="mt-1 text-xs text-red-500">{form.formState.errors.date.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nota <span className="text-gray-400">(opcional)</span>
        </label>
        <Input
          placeholder="Ex: Bônus de março"
          {...form.register('note')}
          className="w-full"
        />
      </div>

      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
      )}
    </form>
  )

  const actions = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={isPending}>
        Cancelar
      </Button>
      <Button
        onClick={form.handleSubmit(onSubmit)}
        disabled={isPending}
        loading={isPending}
      >
        Registrar contribuição
      </Button>
    </>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogHeader>
          <h2 className="text-lg font-semibold">Contribuição — {goalName}</h2>
        </DialogHeader>
        <DialogBody>{content}</DialogBody>
        <DialogFooter>{actions}</DialogFooter>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onClose={onClose} side="bottom">
      <DrawerHeader>
        <h2 className="text-base font-semibold">Contribuição — {goalName}</h2>
      </DrawerHeader>
      <DrawerBody>{content}</DrawerBody>
      <DrawerFooter>{actions}</DrawerFooter>
    </Drawer>
  )
}
