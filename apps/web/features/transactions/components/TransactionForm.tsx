'use client'

import { useState, useTransition } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Toggle, ToggleGroup } from '@/components/ui/Toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from '@/components/ui/Drawer'
import { AmountField } from '@/components/forms/AmountField'
import { DateField } from '@/components/forms/DateField'
import { CategoryField } from '@/components/forms/CategoryField'
import { AccountField } from '@/components/forms/AccountField'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { createTransactionSchema, updateTransactionSchema, type CreateTransactionInput, type UpdateTransactionInput } from '../schemas'
import { createTransaction, updateTransaction } from '../actions'
import type { Database } from '@revenue-hub/database'

type TransactionRow = Database['public']['Tables']['transactions']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']
type AccountRow = Database['public']['Tables']['accounts']['Row']

interface TransactionFormProps {
  open: boolean
  onClose: () => void
  transaction?: TransactionRow | null   // null = create, populated = edit
  workspaceId: string
  workspaceSlug: string
  workspaceCurrency?: string
  categories: CategoryRow[]
  accounts: AccountRow[]
}

const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Despesa' },
  { value: 'income', label: 'Receita' },
  { value: 'transfer', label: 'Transferência' },
] as const

type TxType = 'income' | 'expense' | 'transfer'

export function TransactionForm({
  open,
  onClose,
  transaction,
  workspaceId,
  workspaceSlug,
  workspaceCurrency = 'BRL',
  categories,
  accounts,
}: TransactionFormProps) {
  const isDesktop = useBreakpoint('md')
  const isEdit = !!transaction
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Determine if reconciled (limited editing)
  const isReconciled = transaction?.status === 'reconciled'

  const defaultType: TxType = (transaction?.type as TxType) ?? 'expense'

  const form = useForm<CreateTransactionInput>({
    resolver: zodResolver(isEdit ? updateTransactionSchema : createTransactionSchema) as any,
    defaultValues: {
      type: defaultType,
      description: transaction?.description ?? '',
      amount: transaction?.amount ?? undefined,
      currency: transaction?.currency ?? workspaceCurrency,
      account_id: transaction?.account_id ?? null,
      category_id: transaction?.category_id ?? null,
      date: transaction?.date ?? new Date().toISOString().split('T')[0],
      status: transaction?.status ?? 'confirmed',
      notes: transaction?.notes ?? '',
    },
  })

  const watchType = form.watch('type') as TxType
  const watchDate = form.watch('date')

  // Auto-set status to pending if date is in the future
  const isDateFuture = watchDate && watchDate > new Date().toISOString().split('T')[0]

  async function onSubmit(data: CreateTransactionInput) {
    startTransition(async () => {
      // Force pending if future date
      if (isDateFuture) data.status = 'pending'

      const result = isEdit && transaction
        ? await updateTransaction(workspaceId, { ...data, id: transaction.id } as UpdateTransactionInput)
        : await createTransaction(workspaceId, data)

      if (!result.ok) {
        form.setError('root', { message: result.error })
        return
      }

      router.refresh()
      onClose()
    })
  }

  const formBody = (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} id="tx-form" className="space-y-4">
        {/* Root error */}
        {form.formState.errors.root && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        {/* Type toggle (disabled for reconciled) */}
        {!isReconciled && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Tipo</label>
            <ToggleGroup
              options={TRANSACTION_TYPES}
              value={watchType}
              onChange={v => form.setValue('type', v)}
            />
          </div>
        )}

        {/* Description */}
        <Input
          {...form.register('description')}
          label="Descrição *"
          placeholder={
            watchType === 'income' ? 'Ex: Salário de março' :
            watchType === 'expense' ? 'Ex: Supermercado' : 'Ex: TED para conta poupança'
          }
          error={form.formState.errors.description?.message}
          disabled={false}  // always editable
        />

        {/* Amount (disabled for reconciled) */}
        {!isReconciled && (
          <AmountField workspaceCurrency={workspaceCurrency} required />
        )}

        {/* From account (for transfer: source) / Account (income/expense) */}
        {watchType !== 'transfer' ? (
          <AccountField
            label="Conta *"
            required
            accounts={accounts as any}
            disabled={isReconciled}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AccountField
              name="account_id"
              label="Conta origem *"
              required
              accounts={accounts as any}
              disabled={isReconciled}
            />
            <AccountField
              name="to_account_id"
              label="Conta destino *"
              required
              accounts={accounts as any}
              excludeId={form.watch('account_id') ?? undefined}
              disabled={isReconciled}
            />
          </div>
        )}

        {/* Category (income/expense only, required for expense) */}
        {watchType !== 'transfer' && (
          <CategoryField
            label={watchType === 'expense' ? 'Categoria *' : 'Categoria'}
            required={watchType === 'expense'}
            type={watchType as 'income' | 'expense'}
            categories={categories as any}
            disabled={isReconciled}
          />
        )}

        {/* Date (disabled for reconciled) */}
        <DateField
          label="Data *"
          required
          disabled={isReconciled}
        />

        {/* Status (disabled for reconciled, auto-pending for future dates) */}
        {!isReconciled && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Status</label>
            <ToggleGroup
              options={[
                { value: 'confirmed', label: 'Confirmada' },
                { value: 'pending', label: 'Pendente' },
              ]}
              value={isDateFuture ? 'pending' : (form.watch('status') ?? 'confirmed')}
              onChange={v => form.setValue('status', v as any)}
            />
            {isDateFuture && (
              <p className="text-xs text-muted-foreground">
                Data futura — status definido como Pendente automaticamente.
              </p>
            )}
          </div>
        )}

        {/* Notes (always editable) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Observações</label>
          <textarea
            {...form.register('notes')}
            rows={2}
            placeholder="Notas opcionais..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      </form>
    </FormProvider>
  )

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
        Cancelar
      </Button>
      <Button type="submit" form="tx-form" loading={isPending}>
        {isEdit ? 'Salvar alterações' : 'Criar transação'}
      </Button>
    </>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar transação' : 'Nova transação'}</DialogTitle>
          </DialogHeader>
          <DialogBody>{formBody}</DialogBody>
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerHeader onClose={onClose}>
        {isEdit ? 'Editar transação' : 'Nova transação'}
      </DrawerHeader>
      <DrawerBody>{formBody}</DrawerBody>
      <DrawerFooter>{footer}</DrawerFooter>
    </Drawer>
  )
}
