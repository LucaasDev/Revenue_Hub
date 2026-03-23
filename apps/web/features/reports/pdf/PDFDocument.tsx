import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Register no external font — use built-in Helvetica
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: 32,
    color: '#1f2937',
  },
  pageLandscape: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    padding: 24,
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
    paddingBottom: 10,
  },
  brand: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#6366f1',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerMeta: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#111827',
  },
  table: {
    width: '100%',
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRowSubtotal: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginTop: 2,
  },
  tableRowTotal: {
    flexDirection: 'row',
    backgroundColor: '#ede9fe',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  cellLabel: {
    flex: 3,
    fontSize: 8,
  },
  cellLabelBold: {
    flex: 3,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  cellValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 8,
  },
  cellValueBold: {
    flex: 1,
    textAlign: 'right',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  cellHeader: {
    flex: 1,
    textAlign: 'right',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  cellHeaderLabel: {
    flex: 3,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  sectionHeader: {
    backgroundColor: '#ede9fe',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 8,
    marginBottom: 2,
    borderRadius: 3,
  },
  sectionHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6366f1',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: '#9ca3af',
  },
})

function formatCurrencyPDF(value: number): string {
  const abs = Math.abs(value)
  const formatted = `R$ ${abs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return value < 0 ? `-${formatted}` : formatted
}

// ─────────────────────────────────────────────
// Generic table row
// ─────────────────────────────────────────────

interface PDFTableRowProps {
  label: string
  values: number[]
  isTotal?: boolean
  isSubtotal?: boolean
  isHeader?: boolean
  isSectionHeader?: boolean
}

function PDFTableRow({ label, values, isTotal, isSubtotal, isHeader, isSectionHeader }: PDFTableRowProps) {
  if (isSectionHeader) {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{label}</Text>
      </View>
    )
  }

  const rowStyle = isTotal ? styles.tableRowTotal : isSubtotal ? styles.tableRowSubtotal : styles.tableRow
  const labelStyle = isTotal || isSubtotal ? styles.cellLabelBold : styles.cellLabel
  const valueStyle = isTotal || isSubtotal ? styles.cellValueBold : styles.cellValue

  return (
    <View style={rowStyle}>
      <Text style={labelStyle}>{label}</Text>
      {values.map((v, i) => (
        <Text key={i} style={valueStyle}>
          {isHeader ? String(v) : formatCurrencyPDF(v)}
        </Text>
      ))}
    </View>
  )
}

// ─────────────────────────────────────────────
// DRE PDF
// ─────────────────────────────────────────────

export interface DREPDFData {
  workspaceName: string
  from: string
  to: string
  months: string[]
  incomeRows: Array<{ name: string; values: number[] }>
  expenseRows: Array<{ name: string; values: number[] }>
  totalIncome: number[]
  totalExpense: number[]
  netResult: number[]
}

export function DREDocument({ data }: { data: DREPDFData }) {
  const generatedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.pageLandscape}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Revenue Hub</Text>
            <Text style={styles.title}>Demonstrativo de Resultado (DRE)</Text>
            <Text style={styles.headerMeta}>{data.workspaceName} · {data.from} → {data.to}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerMeta}>Gerado em {generatedAt}</Text>
          </View>
        </View>

        {/* Column headers */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellHeaderLabel}>Categoria</Text>
            {data.months.map((m) => (
              <Text key={m} style={styles.cellHeader}>{m.slice(5)}/{m.slice(2, 4)}</Text>
            ))}
          </View>

          {/* Income */}
          <PDFTableRow label="RECEITAS" values={[]} isSectionHeader />
          {data.incomeRows.map((row, i) => (
            <PDFTableRow key={i} label={row.name} values={row.values} />
          ))}
          <PDFTableRow label="Total Receitas" values={data.totalIncome} isSubtotal />

          {/* Expense */}
          <PDFTableRow label="DESPESAS" values={[]} isSectionHeader />
          {data.expenseRows.map((row, i) => (
            <PDFTableRow key={i} label={row.name} values={row.values} />
          ))}
          <PDFTableRow label="Total Despesas" values={data.totalExpense} isSubtotal />

          {/* Net */}
          <PDFTableRow label="RESULTADO LÍQUIDO" values={data.netResult} isTotal />
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Gerado em {generatedAt} · Revenue Hub</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

// ─────────────────────────────────────────────
// Cash Flow PDF
// ─────────────────────────────────────────────

export interface CashFlowPDFData {
  workspaceName: string
  year: number
  months: Array<{ label: string; income: number; expense: number; net: number; cumulative: number }>
  totalIncome: number
  totalExpense: number
  totalNet: number
}

export function CashFlowDocument({ data }: { data: CashFlowPDFData }) {
  const generatedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Revenue Hub</Text>
            <Text style={styles.title}>Fluxo de Caixa — {data.year}</Text>
            <Text style={styles.headerMeta}>{data.workspaceName}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerMeta}>Gerado em {generatedAt}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {['Mês', 'Entradas', 'Saídas', 'Resultado', 'Saldo Acumulado'].map((h) => (
              <Text key={h} style={{ flex: 1, fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#6b7280', textAlign: 'right' }}>
                {h}
              </Text>
            ))}
          </View>

          {data.months.map((m, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ flex: 1, fontSize: 8 }}>{m.label}</Text>
              <Text style={styles.cellValue}>{formatCurrencyPDF(m.income)}</Text>
              <Text style={styles.cellValue}>{formatCurrencyPDF(m.expense)}</Text>
              <Text style={styles.cellValue}>{formatCurrencyPDF(m.net)}</Text>
              <Text style={styles.cellValue}>{formatCurrencyPDF(m.cumulative)}</Text>
            </View>
          ))}

          <View style={styles.tableRowTotal}>
            <Text style={{ flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold' }}>TOTAL</Text>
            <Text style={styles.cellValueBold}>{formatCurrencyPDF(data.totalIncome)}</Text>
            <Text style={styles.cellValueBold}>{formatCurrencyPDF(data.totalExpense)}</Text>
            <Text style={styles.cellValueBold}>{formatCurrencyPDF(data.totalNet)}</Text>
            <Text style={styles.cellValueBold}></Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Gerado em {generatedAt} · Revenue Hub</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
