import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

interface CardDetailPageProps {
  params: Promise<{ workspace: string; id: string }>
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: card } = await supabase
    .from('credit_cards')
    .select('*, invoices:card_invoices(*)')
    .eq('id', id)
    .single()

  if (!card) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{card.name}</h1>
      {/* TODO Sprint 2: Detalhes do cartão, faturas, transações */}
    </div>
  )
}
