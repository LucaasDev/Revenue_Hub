import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWorkspaceBySlug } from '@/features/workspaces/queries'
import { getNetWorthEvolution } from '@/features/reports/queries'
import { NetWorthChart } from '@/features/reports/components/NetWorthChart'
import { ExportButton } from '@/features/reports/components/ExportButton'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatCurrency } from '@/lib/format'

export const metadata: Metadata = { title: 'Patrimônio Líquido' }
export const revalidate = 300

interface NetWorthPageProps {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{ months?: string }>
}

export default async function NetWorthPage({ params, searchParams }: NetWorthPageProps) {
  const { workspace: slug } = await params
  const search = await searchParams

  const ws = await getWorkspaceBySlug(slug)
  if (!ws) notFound()

  const monthCount = Math.min(24, Math.max(6, parseInt(search.months ?? '12')))
  const data = await getNetWorthEvolution(ws.id, monthCount)

  const exportParams = { workspace: ws.id, months: String(monthCount) }

  const changePositive = data.changeAmount >= 0

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Patrimônio Líquido
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Evolução dos últimos {monthCount} meses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <form className="flex items-center gap-2">
            <select
              name="months"
              defaultValue={monthCount}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="6">6 meses</option>
              <option value="12">12 meses</option>
              <option value="24">24 meses</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Ir
            </button>
          </form>
          <ExportButton type="net-worth" params={exportParams} format="pdf" />
        </div>
      </div>

      {/* KPI card */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-1 text-sm text-gray-500">Patrimônio atual</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(data.current)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-1 text-sm text-gray-500">Variação ({monthCount} meses)</p>
          <p className={`text-3xl font-bold ${changePositive ? 'text-green-600' : 'text-red-600'}`}>
            {changePositive ? '+' : ''}{formatCurrency(data.changeAmount)}
          </p>
          {data.changePercent !== null && (
            <p className={`text-sm ${changePositive ? 'text-green-500' : 'text-red-500'}`}>
              {changePositive ? '+' : ''}{data.changePercent.toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <NetWorthChart points={data.points} />
      </div>

      {/* Account breakdown */}
      {data.accounts.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            Por conta
          </h2>
          <div className="space-y-3">
            {data.accounts
              .sort((a, b) => b.balance - a.balance)
              .map((account) => {
                const pct = data.current > 0 ? (account.balance / data.current) * 100 : 0
                return (
                  <div key={account.id}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{account.name}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(account.balance)}
                      </span>
                    </div>
                    <ProgressBar
                      value={Math.max(0, pct)}
                      size="sm"
                      showLabel={false}
                      variant="default"
                    />
                    <p className="mt-0.5 text-right text-xs text-gray-400">
                      {pct.toFixed(1)}%
                    </p>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
