import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'

export interface ReportTableColumn {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  bold?: boolean
  format?: (value: number | string) => string
}

export interface ReportTableRow {
  label: string
  values: Record<string, number | string>
  isSubtotal?: boolean
  isTotal?: boolean
  isHeader?: boolean
  indent?: boolean
}

interface ReportTableProps {
  columns: ReportTableColumn[]
  rows: ReportTableRow[]
  className?: string
}

export function ReportTable({ columns, rows, className }: ReportTableProps) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
              Categoria
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 font-semibold text-gray-700 dark:text-gray-300',
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={cn(
                'border-b border-gray-100 dark:border-gray-800',
                row.isHeader && 'bg-gray-50 dark:bg-gray-800/50',
                row.isTotal && 'bg-indigo-50 dark:bg-indigo-900/20',
                row.isSubtotal && 'bg-gray-50/70 dark:bg-gray-800/30',
                !row.isHeader && !row.isTotal && 'hover:bg-gray-50 dark:hover:bg-gray-800/20'
              )}
            >
              <td
                className={cn(
                  'px-4 py-2.5',
                  row.indent && 'pl-8',
                  (row.isTotal || row.isHeader) && 'font-semibold text-gray-900 dark:text-white',
                  row.isSubtotal && 'font-medium',
                  !row.isTotal && !row.isHeader && 'text-gray-700 dark:text-gray-300'
                )}
              >
                {row.label}
              </td>
              {columns.map((col) => {
                const val = row.values[col.key]
                const formatted = col.format
                  ? col.format(val ?? 0)
                  : typeof val === 'number'
                  ? formatCurrency(val)
                  : (val ?? '—')

                return (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-2.5 tabular-nums',
                      col.align === 'right' || typeof val === 'number' ? 'text-right' : 'text-left',
                      (row.isTotal || col.bold) && 'font-semibold',
                      typeof val === 'number' && val < 0 && 'text-red-600 dark:text-red-400',
                      typeof val === 'number' && val > 0 && row.isTotal && 'text-green-600 dark:text-green-400'
                    )}
                  >
                    {formatted}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
