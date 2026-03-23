'use client'

import { useTransition } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { IconPicker } from '@/components/ui/IconPicker'
import { Combobox } from '@/components/ui/Combobox'
import { ToggleGroup } from '@/components/ui/Toggle'
import { createCategorySchema, updateCategorySchema, type CreateCategoryInput, type UpdateCategoryInput } from '../schemas'
import { createCategory, updateCategory } from '../actions'

interface CategoryNode {
  id: string
  name: string
  type: 'income' | 'expense'
  parent_id: string | null
}

interface CategoryFormProps {
  open: boolean
  onClose: () => void
  category?: CategoryNode | null
  workspaceId: string
  categories: CategoryNode[]   // for parent select
}

export function CategoryForm({
  open,
  onClose,
  category,
  workspaceId,
  categories,
}: CategoryFormProps) {
  const isEdit = !!category
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(isEdit ? updateCategorySchema : createCategorySchema) as any,
    defaultValues: {
      name: category?.name ?? '',
      type: (category?.type as any) ?? 'expense',
      parent_id: category?.parent_id ?? null,
      color: null,
      icon: null,
    },
  })

  const watchType = form.watch('type') as 'income' | 'expense'

  // Parent options: only root categories of same type
  const parentOptions = categories
    .filter(c => c.type === watchType && c.parent_id === null && c.id !== category?.id)
    .map(c => ({ value: c.id, label: c.name }))

  async function onSubmit(data: CreateCategoryInput) {
    startTransition(async () => {
      const result = isEdit && category
        ? await updateCategory(workspaceId, { ...data, id: category.id } as UpdateCategoryInput)
        : await createCategory(workspaceId, data)

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
          <DialogTitle>{isEdit ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="cat-form" className="space-y-4">
              {form.formState.errors.root && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}

              {/* Type */}
              {!isEdit && (
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
              )}

              <Input
                {...form.register('name')}
                label="Nome *"
                placeholder="Ex: Alimentação"
                error={form.formState.errors.name?.message}
              />

              {/* Parent (subcategory) */}
              <Combobox
                options={[{ value: '', label: 'Nenhuma (categoria raiz)' }, ...parentOptions]}
                value={form.watch('parent_id') ?? ''}
                onChange={v => form.setValue('parent_id', v || null)}
                label="Subcategoria de"
                placeholder="Nenhuma (categoria raiz)"
                clearable={false}
              />

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
            </form>
          </FormProvider>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="cat-form" loading={isPending}>
            {isEdit ? 'Salvar' : 'Criar categoria'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
