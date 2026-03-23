import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWorkspaceBySlug } from '@/features/workspaces/queries'
import { getIncomeStatement } from '@/features/reports/queries'
import { IncomeStatementTable } from '@/features/reports/components/IncomeStatementTable'
import { ExportButton } from '@/features/reports/components/ExportButton'

export const metadata: Metadata = { title: 'DRE — Demonstrativo de Resultado' }
export const revalidate = 300

interface ISPageProps {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{ from?: string; to?: string }>
}

function getDefaultRange() {
  const now = new Date()
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const from3 = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const from = `${from3.getFullYear()}-${String(from3.getMonth() + 1).padStart(2, '0')}`
  return { from, to }
}

export default async function IncomeStatementPage({ params, searchParams }: ISPageProps) {
  const { workspace: slug } = await params
  const search = await searchParams

  const ws = await getWorkspaceBySlug(slug)
  if (!ws) notFound()

  const defaults = getDefaultRange()
  const from = search.from ?? defaults.from
  const to = search.to ?? defaults.to

  const data = await getIncomeStatement(ws.id, from, to)

  const exportParams = { workspace: ws.id, from, to }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Demonstrativo de Resultado (DRE)
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Período: {from} → {to}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton type="income-statement" params={exportParams} format="csv" />
          <ExportButton type="income-statement" params={exportParams} format="pdf" />
        </div>
      </div>

      {/* Period filter */}
      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">De (YYYY-MM)</label>
          <input
            type="month"
            name="from"
            defaultValue={from}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Até (YYYY-MM)</label>
          <input
            type="month"
            name="to"
            defaultValue={to}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Filtrar
        </button>
      </form>

      {/* Table */}
      {data.months.length === 0 ? (
        <p className="text-center text-gray-500 py-12">Nenhum dado no período selecionado.</p>
      ) : (
        <IncomeStatementTable data={data} />
      )}
    </div>
  )
}
