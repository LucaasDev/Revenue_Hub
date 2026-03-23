import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getIncomeStatement, getCashFlowStatement, getNetWorthEvolution } from '@/features/reports/queries'
import { renderToBuffer } from '@react-pdf/renderer'
import { DREDocument, CashFlowDocument } from '@/features/reports/pdf/PDFDocument'
import React from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function monthLabel(month: string): string {
  return format(parseISO(`${month}-01`), 'MMM/yy', { locale: ptBR })
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

  // Get workspace name
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('name')
    .eq('id', workspaceId)
    .single()

  const workspaceName = workspace?.name ?? 'Revenue Hub'

  try {
    let pdfBuffer: Buffer
    let filename: string

    if (type === 'income-statement') {
      const from = searchParams.get('from') ?? `${new Date().getFullYear()}-01`
      const to = searchParams.get('to') ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

      const data = await getIncomeStatement(workspaceId, from, to)

      const dreData = {
        workspaceName,
        from,
        to,
        months: data.months,
        incomeRows: data.incomeRows.map((r) => ({
          name: r.category_name,
          values: data.months.map((m) => r.values[m] ?? 0),
        })),
        expenseRows: data.expenseRows.map((r) => ({
          name: r.category_name,
          values: data.months.map((m) => r.values[m] ?? 0),
        })),
        totalIncome: data.months.map((m) => data.totalIncome[m] ?? 0),
        totalExpense: data.months.map((m) => data.totalExpense[m] ?? 0),
        netResult: data.months.map((m) => data.netResult[m] ?? 0),
      }

      pdfBuffer = Buffer.from(
        await renderToBuffer(React.createElement(DREDocument, { data: dreData }))
      )
      filename = `dre_${from}_${to}.pdf`

    } else if (type === 'cash-flow') {
      const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
      const data = await getCashFlowStatement(workspaceId, year)

      const cashFlowData = {
        workspaceName,
        year,
        months: data.months.map((m) => ({
          label: monthLabel(m.month),
          income: m.income,
          expense: m.expense,
          net: m.net,
          cumulative: m.cumulative,
        })),
        totalIncome: data.totalIncome,
        totalExpense: data.totalExpense,
        totalNet: data.totalNet,
      }

      pdfBuffer = Buffer.from(
        await renderToBuffer(React.createElement(CashFlowDocument, { data: cashFlowData }))
      )
      filename = `fluxo_caixa_${year}.pdf`

    } else {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    })

  } catch (err) {
    console.error('[PDF export error]', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
