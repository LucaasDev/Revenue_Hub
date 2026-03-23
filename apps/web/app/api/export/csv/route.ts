import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getIncomeStatement, getCashFlowStatement } from '@/features/reports/queries'
import { getBudgetSummary } from '@/features/budgets/queries'

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCSV(headers: string[], rows: Array<Array<string | number | null>>): string {
  const lines = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ]
  return lines.join('\n')
}

function formatAmount(amount: number): string {
  return amount.toFixed(2).replace('.', ',')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const workspaceId = searchParams.get('workspace')

  if (!workspaceId || !type) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  // Verify auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify workspace access
  const { data: member } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let csv = ''
  let filename = 'export.csv'

  try {
    if (type === 'transactions') {
      const from = searchParams.get('from') ?? new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
      const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0]

      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          date, description, amount, type, status, notes,
          categories(name),
          accounts(name)
        `)
        .eq('workspace_id', workspaceId)
        .neq('status', 'void')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false })

      const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria', 'Conta', 'Status', 'Notas']
      const rows = (transactions ?? []).map((tx) => {
        const cat = Array.isArray(tx.categories) ? tx.categories[0] : tx.categories
        const acc = Array.isArray(tx.accounts) ? tx.accounts[0] : tx.accounts
        return [
          tx.date,
          tx.description,
          formatAmount(tx.amount),
          tx.type,
          (cat as { name?: string } | null)?.name ?? '',
          (acc as { name?: string } | null)?.name ?? '',
          tx.status,
          tx.notes ?? '',
        ]
      })

      csv = buildCSV(headers, rows)
      filename = `transacoes_${from}_${to}.csv`

    } else if (type === 'income-statement') {
      const from = searchParams.get('from') ?? `${new Date().getFullYear()}-01`
      const to = searchParams.get('to') ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

      const data = await getIncomeStatement(workspaceId, from, to)

      const headers = ['Categoria', 'Tipo', ...data.months]
      const rows: Array<Array<string | number | null>> = []

      for (const row of data.incomeRows) {
        rows.push(['RECEITAS', 'income', ...data.months.map((m) => 0)])
        rows.push([row.category_name, 'income', ...data.months.map((m) => row.values[m] ?? 0)])
      }
      rows.push(['Total Receitas', 'total', ...data.months.map((m) => data.totalIncome[m] ?? 0)])

      for (const row of data.expenseRows) {
        rows.push([row.category_name, 'expense', ...data.months.map((m) => row.values[m] ?? 0)])
      }
      rows.push(['Total Despesas', 'total', ...data.months.map((m) => data.totalExpense[m] ?? 0)])
      rows.push(['Resultado Líquido', 'net', ...data.months.map((m) => data.netResult[m] ?? 0)])

      csv = buildCSV(headers, rows)
      filename = `dre_${from}_${to}.csv`

    } else if (type === 'cash-flow') {
      const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
      const data = await getCashFlowStatement(workspaceId, year)

      const headers = ['Mês', 'Entradas', 'Saídas', 'Resultado', 'Saldo Acumulado']
      const rows = data.months.map((m) => [
        m.month,
        formatAmount(m.income),
        formatAmount(m.expense),
        formatAmount(m.net),
        formatAmount(m.cumulative),
      ])
      rows.push([
        'TOTAL',
        formatAmount(data.totalIncome),
        formatAmount(data.totalExpense),
        formatAmount(data.totalNet),
        '',
      ])

      csv = buildCSV(headers, rows)
      filename = `fluxo_caixa_${year}.csv`

    } else if (type === 'budgets') {
      const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
      const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))

      const data = await getBudgetSummary(workspaceId, year, month)

      const headers = ['Categoria', 'Orçado', 'Gasto', '%', 'Status']
      const rows = data.lines.map((l) => [
        l.category_name,
        formatAmount(l.budgeted),
        formatAmount(l.spent),
        l.budgeted > 0 ? `${Math.round(l.percentage)}%` : '—',
        l.status,
      ])
      rows.push(['TOTAL', formatAmount(data.totalBudgeted), formatAmount(data.totalSpent), '', ''])

      csv = buildCSV(headers, rows)
      filename = `orcamentos_${year}_${String(month).padStart(2, '0')}.csv`

    } else {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (err) {
    console.error('[CSV export error]', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
