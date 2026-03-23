import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { PlusIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { MonthNavigator } from '@/features/dashboard/components/MonthNavigator'
import { CashFlowChart } from '@/features/dashboard/components/CashFlowChart'
import { ExpensesByCategoryChart } from '@/features/dashboard/components/ExpensesByCategoryChart'
import { AccountsWidget } from '@/features/dashboard/components/AccountsWidget'
import { PendingRecurrenceBanner } from '@/features/dashboard/components/PendingRecurrenceBanner'
import { TransactionTable } from '@/features/transactions/components/TransactionTable'
import {
  getDashboardKPIs,
  getCashFlowByDay,
  getExpensesByCategory,
  getAccountsBalances,
  getRecentTransactions,
  getOpenInvoices,
  getPendingRecurrenceCount,
} from '@/features/dashboard/queries'
import { getWorkspaceBySlug } from '@/features/workspaces/queries'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'

export const metadata: Metadata = { title: 'Dashboard' }

interface DashboardPageProps {
  params: Promise<{ workspace: string }>
}

// Revalidate every 60s to pick up trigger-based balance updates
export const revalidate = 60

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { workspace: workspaceSlug } = await params

  const ws = await getWorkspaceBySlug(workspaceSlug)
  if (!ws) return null

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // Load all data in parallel
  const [kpis, cashFlow, expensesByCategory, accounts, recentTx, openInvoices, pendingCount] =
    await Promise.all([
      getDashboardKPIs(ws.id, year, month),
      getCashFlowByDay(ws.id, dateFrom, dateTo),
      getExpensesByCategory(ws.id, year, month),
      getAccountsBalances(ws.id),
      getRecentTransactions(ws.id, 5),
      getOpenInvoices(ws.id),
      getPendingRecurrenceCount(ws.id),
    ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthNavigator />
        <Link href={`/${workspaceSlug}/transactions?modal=new`}>
          <Button size="sm">
            <PlusIcon className="mr-1.5 h-4 w-4" />
            Nova transação
          </Button>
        </Link>
      </div>

      {/* Pending recurrence banner */}
      <PendingRecurrenceBanner count={pendingCount} workspaceSlug={workspaceSlug} />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Receitas"
          value={kpis.totalIncome}
          currency={ws.currency_base}
          trend={kpis.incomeVsPrev}
          variant="income"
        />
        <StatCard
          title="Despesas"
          value={kpis.totalExpense}
          currency={ws.currency_base}
          trend={kpis.expenseVsPrev}
          variant="expense"
        />
        <StatCard
          title="Saldo do mês"
          value={kpis.balance}
          currency={ws.currency_base}
          variant={kpis.balance >= 0 ? 'income' : 'expense'}
        />
        <StatCard
          title="Patrimônio líquido"
          value={kpis.netWorth}
          currency={ws.currency_base}
          variant="neutral"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Cash flow chart — 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fluxo de caixa — {format(now, 'MMMM yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={cashFlow} currency={ws.currency_base} />
          </CardContent>
        </Card>

        {/* Expenses by category — 1/3 width */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas por categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExpensesByCategoryChart data={expensesByCategory} currency={ws.currency_base} />
          </CardContent>
        </Card>
      </div>

      {/* Accounts + Recent transactions + Open invoices */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas
            </CardTitle>
            <Link
              href={`/${workspaceSlug}/accounts`}
              className="text-xs text-primary hover:underline"
            >
              Gerenciar →
            </Link>
          </CardHeader>
          <CardContent>
            <AccountsWidget accounts={accounts} workspaceSlug={workspaceSlug} />
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Últimas transações
            </CardTitle>
            <Link
              href={`/${workspaceSlug}/transactions`}
              className="text-xs text-primary hover:underline"
            >
              Ver todas →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentTx.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">
                Nenhuma transação ainda.
              </p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {recentTx.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-2.5">
                        <div className="font-medium truncate max-w-[180px]">{tx.description}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(tx.date)}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={cn(
                            'font-semibold tabular-nums',
                            tx.type === 'income' ? 'text-income' : 'text-expense',
                          )}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount, tx.currency)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Open invoices */}
      {openInvoices.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturas abertas
            </CardTitle>
            <Link
              href={`/${workspaceSlug}/cards`}
              className="text-xs text-primary hover:underline"
            >
              Gerenciar →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {openInvoices.map((invoice: any) => {
                const card = Array.isArray(invoice.card) ? invoice.card[0] : invoice.card
                return (
                  <div key={invoice.id} className="flex items-center justify-between rounded-md p-2 hover:bg-muted/40">
                    <div>
                      <p className="text-sm font-medium">{card?.name ?? 'Cartão'}</p>
                      <p className="text-xs text-muted-foreground">Vence em {formatDate(invoice.due_date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums text-expense">
                        {formatCurrency(invoice.total_amount, ws.currency_base)}
                      </span>
                      <Badge
                        variant={
                          invoice.status === 'overdue' ? 'destructive' :
                          invoice.status === 'closed' ? 'outline' : 'default'
                        }
                        className="text-xs"
                      >
                        {invoice.status === 'overdue' ? 'Vencida' :
                         invoice.status === 'closed' ? 'Fechada' : 'Aberta'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
