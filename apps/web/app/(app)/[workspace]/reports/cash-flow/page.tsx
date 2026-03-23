import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWorkspaceBySlug } from '@/features/workspaces/queries'
import { getCashFlowStatement } from '@/features/reports/queries'
import { ReportTable, type ReportTableColumn, type ReportTableRow } from '@/features/reports/components/ReportTable'
import { CashFlowLineChart } from '@/features/reports/components/CashFlowLineChart'
import { ExportButton } from '@/features/reports/components/ExportButton'
import { formatCurrency } from '@/lib/format'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata: Metadata = { title: 'Fluxo de Caixa' }
export const revalidate = 300

interface CashFlowPageProps {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{ year?: string }>
}

export default async function CashFlowPage({ params, searchParams }: CashFlowPageProps) {
  const { workspace: slug } = await params
  const search = await searchParams

  const ws = await getWorkspaceBySlug(slug)
  if (!ws) notFound()

  const year = search.year ? parseInt(search.year) : new Date().getFullYear()
  const data = await getCashFlowStatement(ws.id, year)

  const columns: ReportTableColumn[] = data.months.map((m) => ({
    key: m.month,
    label: format(parseISO(`${m.month}-01`), 'MMM/yy', { locale: ptBR }),
    align: 'right',
  }))

  // Add Total column
  columns.push({ key: 'total', label: 'Total', align: 'right', bold: true })

  function buildValues(key: keyof typeof data.months[0]) {
    const v: Record<string, number> = {}
    for (const m of data.months) v[m.month] = m[key] as number
    return v
  }

  const rows: ReportTableRow[] = [
    {
      label: 'Entradas',
      values: { ...buildValues('income'), total: data.totalIncome },
    },
    {
      label: 'Saídas',
      values: { ...buildValues('expense'), total: data.totalExpense },
    },
    {
      label: 'Resultado Mensal',
      values: { ...buildValues('net'), total: data.totalNet },
      isSubtotal: true,
    },
    {
      label: 'Saldo Acumulado',
      values: { ...buildValues('cumulative'), total: data.months.at(-1)?.cumulative ?? 0 },
      isTotal: true,
    },
  ]

  const exportParams = { workspace: ws.id, year: String(year) }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fluxo de Caixa — {year}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Resultado mensal e saldo acumulado</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Year selector */}
          <form className="flex items-center gap-2">
            <select
              name="year"
              defaultValue={year}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
              onChange={(e) => {
                // will be handled via form submit
              }}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Ir
            </button>
          </form>
          <ExportButton type="cash-flow" params={exportParams} format="csv" />
          <ExportButton type="cash-flow" params={exportParams} format="pdf" />
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Evolução do saldo acumulado
        </p>
        <CashFlowLineChart months={data.months} />
      </div>

      {/* Table */}
      <ReportTable columns={columns} rows={rows} />
    </div>
  )
}
