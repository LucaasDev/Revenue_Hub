import { createClient } from '@/lib/supabase/server'

export async function getCreditCards(workspaceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('credit_cards')
    .select(`
      *,
      open_invoices:card_invoices(
        id, status, total_amount, paid_amount, due_date, period_start, period_end
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('name')

  return { data, error: error?.message }
}

export async function getCreditCardById(workspaceId: string, cardId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('credit_cards')
    .select(`
      *,
      invoices:card_invoices(
        id, status, total_amount, paid_amount, due_date, period_start, period_end, paid_at
      )
    `)
    .eq('id', cardId)
    .eq('workspace_id', workspaceId)
    .single()

  return { data, error: error?.message }
}

export async function getInvoiceTransactions(workspaceId: string, invoiceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('card_transactions')
    .select(`
      *,
      transaction:transactions(
        id, description, amount, currency, date, status, category_id,
        category:categories(id, name, icon, color)
      )
    `)
    .eq('invoice_id', invoiceId)
    .eq('workspace_id', workspaceId)

  return { data, error: error?.message }
}
