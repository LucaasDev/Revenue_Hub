'use client'

import { useMemo, useState, useTransition } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Toggle, ToggleGroup } from '@/components/ui/Toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { AmountField } from '@/components/forms/AmountField'
import { DateField } from '@/components/forms/DateField'
import { CategoryField } from '@/components/forms/CategoryField'
import { AccountField } from '@/components/forms/AccountField'
import { createRecurrenceSchema, type CreateRecurrenceInput } from '../schemas'
import { createRecurrenceRule } from '../actions'
import { getNextOccurrences } from '../utils'
import { isBefore } from 'date-fns'

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Diária' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
]

interface RecurrenceFormProps {
  open: boolean
  onClose: () => void
  workspaceId: string
  workspaceCurrency?: string
  accounts: any[]
  categories: any[]
}

export function RecurrenceForm({
  open,
  onClose,
  workspaceId,
  workspaceCurrency = 'BRL',
  accounts,
  categories,
}: RecurrenceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [generateRetroactive, setGenerateRetroactive] = useState(false)

  const form = useForm<CreateRecurrenceInput>({
    resolver: zodResolver(createRecurrenceSchema),
    defaultValues: {
      type: 'expense',
      description: '',
      currency: workspaceCurrency,
      frequency: 'monthly',
      interval_count: 1,
      starts_on: new Date().toISOString().split('T')[0],
    },
  })

  const watchStarts = form.watch('starts_on')
  const watchFreq = form.watch('frequency') as any
  const watchInterval = form.watch('interval_count') ?? 1
  const watchDayOfMonth = form.watch('day_of_month')

  // Preview next occurrences
  const nextOccurrences = useMemo(() => {
    if (!watchStarts) return []
    try {
      return getNextOccurrences(
        new Date(watchStarts + 'T00:00:00'),
        watchFreq,
        watchInterval,
        watchDayOfMonth ?? null,
        3,
      )
    } catch {
      return []
    }
  }, [watchStarts, watchFreq, watchInterval, watchDayOfMonth])

  const showRetroactive = watchStarts && isBefore(new Date(watchStarts + 'T00:00:00'), new Date())

  async function onSubmit(data: CreateRecurrenceInput) {
    startTransition(async () => {
      const result = await createRecurrenceRule(workspaceId, data, generateRetroactive)
      if (!result.ok) {
        form.setError('root', { message: result.error })
        return
      }
      router.refresh()
      onClose()
    })
  }

  const watchType = form.watch('type') as 'income' | 'expense'

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova recorrência</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="rec-form" className="space-y-4">
              {form.formState.errors.root && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}

              {/* Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <ToggleGroup
                  options={[
                    { value: 'expense', label: 'Despesa' },
                    { value: 'income', label: 'Receita' },
                  ]}
                  value={watchType}
                  onChange={v => form.setValue('type', v as any)}
                />
              </div>

              <Input
                {...form.register('description')}
                label="Descrição *"
                placeholder="Ex: Aluguel, Salário, Netflix"
                error={form.formState.errors.description?.message}
              />

              <AmountField workspaceCurrency={workspaceCurrency} required />

              <AccountField label="Conta *" required accounts={accounts} />

              <CategoryField
                label={watchType === 'expense' ? 'Categoria *' : 'Categoria'}
                required={watchType === 'expense'}
                type={watchType}
                categories={categories}
              />

              {/* Frequency */}
              <div className="grid grid-cols-2 gap-3">
                <Select
                  {...form.register('frequency')}
                  label="Frequência"
                  options={FREQUENCY_OPTIONS}
                />
                <Input
                  {...form.register('interval_count', { valueAsNumber: true })}
                  label="Intervalo"
                  type="number"
                  min={1}
                  max={12}
                  placeholder="1"
                />
              </div>

              {/* Day of month (monthly only) */}
              {watchFreq === 'monthly' && (
                <Input
                  {...form.register('day_of_month', { valueAsNumber: true })}
                  label="Dia do mês"
                  type="number"
                  min={1}
                  max={28}
                  placeholder="Ex: 5 (todo dia 5)"
                />
              )}

              {/* Start/end dates */}
              <div className="grid grid-cols-2 gap-3">
                <DateField name="starts_on" label="Início *" required />
                <DateField name="ends_on" label="Termina em" />
              </div>

              {/* Preview */}
              {nextOccurrences.length > 0 && (
                <div className="rounded-md bg-muted/50 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Próximas ocorrências:</p>
                  {nextOccurrences.map((d, i) => (
                    <p key={i} className="text-xs text-foreground">
                      {format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  ))}
                </div>
              )}

              {/* Retroactive option */}
              {showRetroactive && (
                <Toggle
                  checked={generateRetroactive}
                  onChange={setGenerateRetroactive}
                  label="Gerar transações retroativas"
                  description="Cria as ocorrências passadas como pendentes para revisão"
                />
              )}
            </form>
          </FormProvider>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="rec-form" loading={isPending}>
            Criar recorrência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
