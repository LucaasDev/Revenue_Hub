'use client'

import { useTransition } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from '@/components/ui/Drawer'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { IconPicker } from '@/components/ui/IconPicker'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { createAccountSchema, updateAccountSchema, type CreateAccountInput, type UpdateAccountInput } from '../schemas'
import { createAccount, updateAccount } from '../actions'
import type { Database } from '@revenue-hub/database'

type AccountRow = Database['public']['Tables']['accounts']['Row']

interface AccountFormProps {
  open: boolean
  onClose: () => void
  account?: AccountRow | null
  workspaceId: string
  workspaceCurrency?: string
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'checking', label: 'Conta corrente' },
  { value: 'savings', label: 'Poupança' },
  { value: 'wallet', label: 'Carteira' },
  { value: 'investment', label: 'Investimentos' },
  { value: 'other', label: 'Outro' },
]

const CURRENCY_OPTIONS = [
  { value: 'BRL', label: 'BRL — Real Brasileiro' },
  { value: 'USD', label: 'USD — Dólar Americano' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — Libra Esterlina' },
]

export function AccountForm({
  open,
  onClose,
  account,
  workspaceId,
  workspaceCurrency = 'BRL',
}: AccountFormProps) {
  const isDesktop = useBreakpoint('md')
  const isEdit = !!account
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(isEdit ? updateAccountSchema : createAccountSchema) as any,
    defaultValues: {
      name: account?.name ?? '',
      type: (account?.type as any) ?? 'checking',
      institution: account?.institution ?? '',
      currency: account?.currency ?? workspaceCurrency,
      opening_balance: 0,
      color: account?.color ?? '#3b82f6',
      icon: account?.icon ?? 'wallet',
      include_in_net_worth: account?.include_in_net_worth ?? true,
    },
  })

  async function onSubmit(data: CreateAccountInput) {
    startTransition(async () => {
      const result = isEdit && account
        ? await updateAccount(workspaceId, { ...data, id: account.id } as UpdateAccountInput)
        : await createAccount(workspaceId, data)

      if (!result.ok) {
        form.setError('root', { message: result.error })
        return
      }

      router.refresh()
      onClose()
    })
  }

  const body = (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} id="account-form" className="space-y-4">
        {form.formState.errors.root && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Input
          {...form.register('name')}
          label="Nome da conta *"
          placeholder="Ex: Nubank, Itaú, Carteira"
          error={form.formState.errors.name?.message}
        />

        <Select
          {...form.register('type')}
          label="Tipo"
          options={ACCOUNT_TYPE_OPTIONS}
          error={form.formState.errors.type?.message}
        />

        <Input
          {...form.register('institution')}
          label="Instituição"
          placeholder="Ex: Nubank, Itaú, XP"
        />

        <Select
          {...form.register('currency')}
          label="Moeda"
          options={CURRENCY_OPTIONS}
        />

        {!isEdit && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Saldo inicial</label>
            <CurrencyInput
              currency={form.watch('currency') ?? workspaceCurrency}
              value={form.watch('opening_balance') ?? 0}
              onChange={v => form.setValue('opening_balance', v ?? 0)}
            />
          </div>
        )}

        <ColorPicker
          label="Cor"
          value={form.watch('color')}
          onChange={v => form.setValue('color', v)}
        />

        <IconPicker
          label="Ícone"
          value={form.watch('icon')}
          onChange={v => form.setValue('icon', v)}
        />

        <Toggle
          checked={form.watch('include_in_net_worth') ?? true}
          onChange={v => form.setValue('include_in_net_worth', v)}
          label="Incluir no patrimônio líquido"
          description="Considera o saldo desta conta no cálculo do patrimônio"
        />
      </form>
    </FormProvider>
  )

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
        Cancelar
      </Button>
      <Button type="submit" form="account-form" loading={isPending}>
        {isEdit ? 'Salvar' : 'Criar conta'}
      </Button>
    </>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar conta' : 'Nova conta'}</DialogTitle>
          </DialogHeader>
          <DialogBody>{body}</DialogBody>
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerHeader onClose={onClose}>{isEdit ? 'Editar conta' : 'Nova conta'}</DrawerHeader>
      <DrawerBody>{body}</DrawerBody>
      <DrawerFooter>{footer}</DrawerFooter>
    </Drawer>
  )
}
