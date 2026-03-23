'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog'
import { Combobox } from '@/components/ui/Combobox'
import { CategoryBadge } from './CategoryBadge'
import { mergeAndDeleteCategory } from '../actions'

interface CategoryNode {
  id: string
  name: string
  type: 'income' | 'expense'
  parent_id: string | null
  icon: string | null
  color: string | null
  is_system: boolean
}

interface CategoryMergeDialogProps {
  open: boolean
  onClose: () => void
  sourceCategory: CategoryNode
  categories: CategoryNode[]
  workspaceId: string
}

export function CategoryMergeDialog({
  open,
  onClose,
  sourceCategory,
  categories,
  workspaceId,
}: CategoryMergeDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [targetId, setTargetId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Options: same type, not source, not children of source
  const options = categories
    .filter(c =>
      c.type === sourceCategory.type &&
      c.id !== sourceCategory.id &&
      c.parent_id !== sourceCategory.id,
    )
    .map(c => ({
      value: c.id,
      label: c.parent_id
        ? `  ${c.name}` // indent subcategories
        : c.name,
    }))

  const handleMerge = () => {
    if (!targetId) {
      setError('Selecione uma categoria destino')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await mergeAndDeleteCategory(workspaceId, {
        sourceCategoryId: sourceCategory.id,
        targetCategoryId: targetId,
      })

      if (!result.ok) {
        setError(result.error)
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
          <DialogTitle>Mesclar categoria</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Todas as transações de{' '}
            <CategoryBadge
              name={sourceCategory.name}
              icon={sourceCategory.icon}
              color={sourceCategory.color}
              className="mx-1"
            />
            serão movidas para a categoria selecionada abaixo.
            {!sourceCategory.is_system && ' Em seguida, a categoria original será excluída.'}
          </p>

          <Combobox
            options={options}
            value={targetId}
            onChange={setTargetId}
            label="Categoria destino *"
            placeholder="Selecionar..."
            error={error ?? undefined}
          />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleMerge} loading={isPending} disabled={!targetId}>
            Mesclar e excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
