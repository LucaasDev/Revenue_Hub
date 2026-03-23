'use client'

import { useTransition } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { AccountField } from '@/components/forms/AccountField'
import { createCreditCardSchema, type CreateCreditCardInput } from '../schemas'
import { createCreditCard } from '../actions'

const BRAND_OPTIONS = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'elo', label: 'Elo' },
  { value: 'amex', label: 'American Express' },
  { value: 'hipercard', label: 'Hipercard' },
  { value: 'other', label: 'Outro' },
]

interface CardFormProps {
  open: boolean
  onClose: () => void
  workspaceId: string
  workspaceCurrency?: string
  accounts: any[]
}

export function CardForm({ open, onClose, workspaceId, workspaceCurrency = 'BRL', accounts }: CardFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateCreditCardInput>({
    resolver: zodResolver(createCreditCardSchema),
    defaultValues: {
      name: '',
      brand: 'visa',
      last_four: null,
      credit_limit: undefined,
      closing_day: 1,
      due_day: 10,
      account_id: '',
    },
  })

  async function onSubmit(data: CreateCreditCardInput) {
    startTransition(async () => {
      const result = await createCreditCard(workspaceId, data)
      if (!result.ok) {
        form.setError('root', { message: result.error })
        return
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo cartão de crédito</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="card-form" className="space-y-4">
              {form.formState.errors.root && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}

              <Input
                {...form.register('name')}
                label="Nome do cartão *"
                placeholder="Ex: Nubank Roxo, Itaú Gold"
                error={form.formState.errors.name?.message}
              />

              <Select
                {...form.register('brand')}
                label="Bandeira *"
                options={BRAND_OPTIONS}
                error={form.formState.errors.brand?.message}
              />

              <Input
                {...form.register('last_four')}
                label="Últimos 4 dígitos"
                placeholder="0000"
                maxLength={4}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Limite *</label>
                <CurrencyInput
                  currency={workspaceCurrency}
                  value={form.watch('credit_limit')}
                  onChange={v => form.setValue('credit_limit', v ?? 0)}
                  error={form.formState.errors.credit_limit?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  {...form.register('closing_day', { valueAsNumber: true })}
                  label="Dia de fechamento *"
                  type="number"
                  min={1}
                  max={28}
                  placeholder="1"
                  error={form.formState.errors.closing_day?.message}
                />
                <Input
                  {...form.register('due_day', { valueAsNumber: true })}
                  label="Dia de vencimento *"
                  type="number"
                  min={1}
                  max={28}
                  placeholder="10"
                  error={form.formState.errors.due_day?.message}
                />
              </div>

              <AccountField
                name="account_id"
                label="Conta de pagamento *"
                required
                accounts={accounts}
              />
            </form>
          </FormProvider>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="card-form" loading={isPending}>
            Criar cartão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
