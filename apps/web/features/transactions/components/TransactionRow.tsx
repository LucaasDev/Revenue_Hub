'use client'

import { useOptimistic, useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckIcon, Edit2Icon, Trash2Icon, BanIcon, MoreHorizontalIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { Badge } from '@/components/ui/Badge'
import { Tooltip } from '@/components/ui/Tooltip'
import { DynamicIcon } from '@/components/ui/IconPicker'
import { formatCurrency, getAmountColor, getAmountPrefix } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import { deleteTransaction, voidTransaction, confirmTransaction } from '../actions'
import type { Database } from '@revenue-hub/database'

type TxRow = Database['public']['Tables']['transactions']['Row'] & {
  category?: { id: string; name: string; icon: string | null; color: string | null } | null
  account?: { id: string; name: string; icon: string | null; color: string | null } | null
}

interface TransactionRowProps {
  transaction: TxRow
  workspaceId: string
  workspaceSlug: string
  onEdit: (tx: TxRow) => void
  selected: boolean
  onToggleSelect: (id: string) => void
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendente',
  reconciled: 'Conciliada',
  void: 'Estornada',
}

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'default',
  pending: 'outline',
  reconciled: 'income',
  void: 'destructive',
}

export function TransactionRow({
  transaction: tx,
  workspaceId,
  workspaceSlug,
  onEdit,
  selected,
  onToggleSelect,
}: TransactionRowProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return
    startTransition(async () => {
      await deleteTransaction(workspaceId, tx.id)
      router.refresh()
    })
  }

  const handleVoid = () => {
    if (!confirm('Estornar esta transação? O saldo será revertido.')) return
    startTransition(async () => {
      await voidTransaction(workspaceId, tx.id)
      router.refresh()
    })
  }

  const handleConfirm = () => {
    startTransition(async () => {
      await confirmTransaction(workspaceId, tx.id)
      router.refresh()
    })
  }

  const cat = Array.isArray(tx.category) ? tx.category[0] : tx.category
  const acc = Array.isArray(tx.account) ? tx.account[0] : tx.account

  const amountSign = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''
  const amountColor = tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-foreground'

  return (
    <tr
      className={cn(
        'group border-b border-border transition-colors hover:bg-muted/40',
        selected && 'bg-primary/5',
        tx.status === 'void' && 'opacity-50',
        isPending && 'opacity-60',
      )}
    >
      {/* Checkbox */}
      <td className="px-4 py-3 w-8">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(tx.id)}
          className="rounded border-border"
          aria-label={`Selecionar ${tx.description}`}
        />
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(tx.date)}
      </td>

      {/* Description + category */}
      <td className="px-4 py-3">
        <div className="font-medium text-sm text-foreground truncate max-w-[220px]">
          {tx.description}
        </div>
        {cat && (
          <div className="flex items-center gap-1 mt-0.5">
            <DynamicIcon name={cat.icon} className="h-3 w-3" style={{ color: cat.color ?? undefined } as any} />
            <span className="text-xs text-muted-foreground truncate">{cat.name}</span>
          </div>
        )}
      </td>

      {/* Account */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {acc ? (
          <div className="flex items-center gap-1">
            <DynamicIcon name={acc.icon} className="h-3.5 w-3.5" style={{ color: acc.color ?? undefined } as any} />
            <span className="truncate max-w-[100px]">{acc.name}</span>
          </div>
        ) : '—'}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <Badge variant={STATUS_BADGE[tx.status] as any} className="text-xs">
          {STATUS_LABEL[tx.status] ?? tx.status}
        </Badge>
      </td>

      {/* Amount */}
      <td className="px-4 py-3 text-right">
        <span className={cn('text-sm font-semibold tabular-nums', amountColor)}>
          {amountSign}{formatCurrency(tx.amount, tx.currency)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 w-10">
        {tx.status !== 'void' && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-md p-1 opacity-0 group-hover:opacity-100 hover:bg-accent">
              <MoreHorizontalIcon className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEdit(tx as TxRow)}
                icon={<Edit2Icon className="h-4 w-4" />}
              >
                Editar
              </DropdownMenuItem>

              {tx.status === 'pending' && (
                <DropdownMenuItem
                  onClick={handleConfirm}
                  icon={<CheckIcon className="h-4 w-4" />}
                >
                  Confirmar
                </DropdownMenuItem>
              )}

              {tx.status === 'confirmed' && (
                <DropdownMenuItem
                  onClick={handleVoid}
                  icon={<BanIcon className="h-4 w-4" />}
                >
                  Estornar
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleDelete}
                destructive
                icon={<Trash2Icon className="h-4 w-4" />}
              >
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  )
}
