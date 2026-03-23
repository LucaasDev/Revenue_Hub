import { formatCurrency } from '@/lib/format'
import { ReportTable, type ReportTableColumn, type ReportTableRow } from './ReportTable'
import type { IncomeStatementData } from '../queries'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function monthLabel(month: string): string {
  return format(parseISO(`${month}-01`), 'MMM/yy', { locale: ptBR })
}

interface IncomeStatementTableProps {
  data: IncomeStatementData
}

export function IncomeStatementTable({ data }: IncomeStatementTableProps) {
  const { months, incomeRows, expenseRows, totalIncome, totalExpense, netResult } = data

  const columns: ReportTableColumn[] = months.map((m) => ({
    key: m,
    label: monthLabel(m),
    align: 'right' as const,
  }))

  // Build rows
  const rows: ReportTableRow[] = []

  // INCOME SECTION
  rows.push({
    label: '▸ RECEITAS',
    values: {},
    isHeader: true,
  })

  for (const row of incomeRows) {
    rows.push({
      label: row.category_name,
      values: row.values,
      indent: Boolean(row.parent_id),
    })
  }

  rows.push({
    label: 'Total Receitas',
    values: totalIncome,
    isSubtotal: true,
  })

  // EXPENSE SECTION
  rows.push({
    label: '▸ DESPESAS',
    values: {},
    isHeader: true,
  })

  for (const row of expenseRows) {
    rows.push({
      label: row.category_name,
      values: row.values,
      indent: Boolean(row.parent_id),
    })
  }

  rows.push({
    label: 'Total Despesas',
    values: totalExpense,
    isSubtotal: true,
  })

  // RESULT
  rows.push({
    label: 'RESULTADO LÍQUIDO',
    values: netResult,
    isTotal: true,
  })

  return <ReportTable columns={columns} rows={rows} />
}
