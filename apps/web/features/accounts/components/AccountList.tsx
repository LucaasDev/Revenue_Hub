'use client'

import { useOptimistic, useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVerticalIcon,
  MoreHorizontalIcon,
  Edit2Icon,
  ArchiveIcon,
  Trash2Icon,
  ExternalLinkIcon,
  ArchiveRestoreIcon,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { Badge } from '@/components/ui/Badge'
import { DynamicIcon } from '@/components/ui/IconPicker'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'
import { reorderAccounts, archiveAccount, deleteAccount, unarchiveAccount } from '../actions'
import type { Database } from '@revenue-hub/database'

type AccountRow = Database['public']['Tables']['accounts']['Row']

interface AccountListProps {
  accounts: AccountRow[]
  workspaceId: string
  workspaceSlug: string
  onEdit: (account: AccountRow) => void
}

function SortableAccountCard({
  account,
  workspaceId,
  workspaceSlug,
  onEdit,
}: {
  account: AccountRow
  workspaceId: string
  workspaceSlug: string
  onEdit: (account: AccountRow) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: account.id,
  })
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleArchive = () => {
    startTransition(async () => {
      if (account.is_active) {
        await archiveAccount(workspaceId, account.id)
      } else {
        await unarchiveAccount(workspaceId, account.id)
      }
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (!confirm(`Excluir a conta "${account.name}"? Esta ação não pode ser desfeita.`)) return
    startTransition(async () => {
      const result = await deleteAccount(workspaceId, account.id)
      if (!result.ok) {
        alert(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-card p-4',
        'transition-shadow',
        isDragging && 'shadow-lg opacity-80 ring-2 ring-primary',
        isPending && 'opacity-60',
        !account.is_active && 'opacity-50',
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Arrastar para reordenar"
      >
        <GripVerticalIcon className="h-4 w-4" />
      </button>

      {/* Icon */}
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: account.color ? `${account.color}20` : undefined }}
      >
        <DynamicIcon
          name={account.icon}
          className="h-5 w-5"
          // @ts-ignore
          style={{ color: account.color ?? undefined }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">{account.name}</p>
          {!account.is_active && (
            <Badge variant="outline" className="text-xs">Arquivada</Badge>
          )}
        </div>
        {account.institution && (
          <p className="text-xs text-muted-foreground">{account.institution}</p>
        )}
      </div>

      {/* Balance */}
      <div className="text-right">
        <p
          className={cn(
            'font-semibold tabular-nums text-sm',
            account.balance >= 0 ? 'text-income' : 'text-expense',
          )}
        >
          {formatCurrency(account.balance ?? 0, account.currency ?? 'BRL')}
        </p>
        <p className="text-xs text-muted-foreground uppercase">{account.currency}</p>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-md p-1 hover:bg-accent">
          <MoreHorizontalIcon className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(account)} icon={<Edit2Icon className="h-4 w-4" />}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/${workspaceSlug}/transactions?account=${account.id}`)}
            icon={<ExternalLinkIcon className="h-4 w-4" />}
          >
            Ver transações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleArchive}
            icon={account.is_active
              ? <ArchiveIcon className="h-4 w-4" />
              : <ArchiveRestoreIcon className="h-4 w-4" />
            }
          >
            {account.is_active ? 'Arquivar' : 'Reativar'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            destructive
            icon={<Trash2Icon className="h-4 w-4" />}
          >
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function AccountList({ accounts, workspaceId, workspaceSlug, onEdit }: AccountListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticAccounts, setOptimisticAccounts] = useOptimistic(accounts)

  const activeAccounts = optimisticAccounts.filter(a => a.is_active)
  const archivedAccounts = optimisticAccounts.filter(a => !a.is_active)
  const [showArchived, setShowArchived] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = activeAccounts.findIndex(a => a.id === active.id)
    const newIndex = activeAccounts.findIndex(a => a.id === over.id)
    const reordered = arrayMove(activeAccounts, oldIndex, newIndex)

    // Optimistic update
    startTransition(async () => {
      setOptimisticAccounts([...reordered, ...archivedAccounts])
      await reorderAccounts(workspaceId, reordered.map(a => a.id))
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Active accounts */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Contas ativas ({activeAccounts.length})
        </h2>
        {activeAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conta ativa.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activeAccounts.map(a => a.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {activeAccounts.map(account => (
                  <SortableAccountCard
                    key={account.id}
                    account={account}
                    workspaceId={workspaceId}
                    workspaceSlug={workspaceSlug}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      {/* Archived accounts */}
      {archivedAccounts.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowArchived(s => !s)}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Contas arquivadas ({archivedAccounts.length})
            <span>{showArchived ? '▲' : '▼'}</span>
          </button>
          {showArchived && (
            <div className="mt-3 space-y-2">
              {archivedAccounts.map(account => (
                <SortableAccountCard
                  key={account.id}
                  account={account}
                  workspaceId={workspaceId}
                  workspaceSlug={workspaceSlug}
                  onEdit={onEdit}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
