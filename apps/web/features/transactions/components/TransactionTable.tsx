'use client'

import Link from 'next/link'
import { formatCurrency, getAmountColor, getAmountPrefix } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import type { Tables } from '@revenue-hub/database'

type TransactionWithRelations = Tables<'transactions'> & {
  account: { id: string; name: string; icon: string | null; color: string | null; currency: string } | null
  category: { id: string; name: string; icon: string | null; color: string | null; type: string } | null
}

interface TransactionTableProps {
  transactions: TransactionWithRelations[]
  workspaceSlug: string
}

export function TransactionTable({ transactions, workspaceSlug }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Nenhuma transação encontrada.</p>
        <p className="text-sm text-muted-foreground mt-1">Adicione sua primeira transação para começar.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descrição</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Conta</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {formatDate(tx.date)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/${workspaceSlug}/transactions/${tx.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {tx.description}
                </Link>
              </td>
              <td className="px-4 py-3">
                {tx.category ? (
                  <span className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 bg-muted">
                    {tx.category.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {tx.account?.name ?? '—'}
              </td>
              <td className={`px-4 py-3 text-right font-mono font-medium ${getAmountColor(tx.type)}`}>
                {getAmountPrefix(tx.type)}{' '}
                {formatCurrency(tx.amount, tx.currency)}
              </td>
              <td className="px-4 py-3 text-center">
                <StatusBadge status={tx.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    reconciled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    void:       'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }
  const labels: Record<string, string> = {
    pending:    'Pendente',
    confirmed:  'Confirmada',
    reconciled: 'Conciliada',
    void:       'Cancelada',
  }
  return (
    <span className={`inline-block text-xs rounded-full px-2 py-0.5 font-medium ${styles[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  )
}
