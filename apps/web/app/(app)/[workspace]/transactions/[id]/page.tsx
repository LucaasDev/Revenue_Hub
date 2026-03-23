import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'

interface TransactionDetailPageProps {
  params: Promise<{ workspace: string; id: string }>
}

export async function generateMetadata({
  params,
}: TransactionDetailPageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Transação ${id.slice(0, 8)}…` }
}

export default async function TransactionDetailPage({
  params,
}: TransactionDetailPageProps) {
  const { workspace, id } = await params
  const supabase = await createServerClient()

  const { data: transaction } = await supabase
    .from('transactions')
    .select('*, account:accounts(name), category:categories(name, color, icon)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!transaction) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{transaction.description}</h1>
      {/* TODO Sprint 2: Detalhes completos da transação + ações (editar, estornar, etc.) */}
      <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
        {JSON.stringify(transaction, null, 2)}
      </pre>
    </div>
  )
}
