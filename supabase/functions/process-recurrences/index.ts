/**
 * Edge Function: process-recurrences
 *
 * Cron: todos os dias às 06:00 UTC
 * Configurar em supabase/config.toml:
 *   [functions.process-recurrences]
 *   schedule = "0 6 * * *"
 *
 * Responsabilidade:
 * 1. Buscar todas as recurrence_rules com next_occurrence <= hoje e is_active = true
 * 2. Para cada regra, inserir uma transação com status = 'pending'
 * 3. Atualizar next_occurrence para a próxima data
 * 4. Se next_occurrence ultrapassar ends_on, setar is_active = false
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

interface RecurrenceRule {
  id: string
  workspace_id: string
  account_id: string
  category_id: string | null
  created_by: string
  description: string
  type: 'income' | 'expense'
  amount: number
  currency: string
  frequency: string
  interval: number
  day_of_month: number | null
  next_occurrence: string
  ends_on: string | null
}

function addInterval(date: Date, frequency: string, interval: number): Date {
  const d = new Date(date)
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + interval)
      break
    case 'weekly':
      d.setDate(d.getDate() + 7 * interval)
      break
    case 'biweekly':
      d.setDate(d.getDate() + 14 * interval)
      break
    case 'monthly':
      d.setMonth(d.getMonth() + interval)
      break
    case 'bimonthly':
      d.setMonth(d.getMonth() + 2 * interval)
      break
    case 'quarterly':
      d.setMonth(d.getMonth() + 3 * interval)
      break
    case 'yearly':
      d.setFullYear(d.getFullYear() + interval)
      break
  }
  return d
}

Deno.serve(async (_req) => {
  const today = new Date().toISOString().split('T')[0]
  let processed = 0
  let errors = 0

  console.log(`[process-recurrences] Iniciando para data: ${today}`)

  // Buscar regras ativas com next_occurrence <= hoje
  const { data: rules, error: fetchError } = await supabase
    .from('recurrence_rules')
    .select('*')
    .lte('next_occurrence', today)
    .eq('is_active', true)

  if (fetchError) {
    console.error('[process-recurrences] Erro ao buscar regras:', fetchError)
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
  }

  console.log(`[process-recurrences] ${rules?.length ?? 0} regras encontradas`)

  for (const rule of (rules as RecurrenceRule[]) ?? []) {
    try {
      // Inserir transação pendente
      const { error: insertError } = await supabase.from('transactions').insert({
        workspace_id: rule.workspace_id,
        account_id: rule.account_id,
        category_id: rule.category_id,
        created_by: rule.created_by,
        recurrence_id: rule.id,
        type: rule.type,
        amount: rule.amount,
        currency: rule.currency,
        amount_in_base: rule.amount, // TODO: converter pela taxa do dia
        exchange_rate: 1,
        description: rule.description,
        date: rule.next_occurrence,
        status: 'pending',
      })

      if (insertError) {
        console.error(`[process-recurrences] Erro ao inserir transação para regra ${rule.id}:`, insertError)
        errors++
        continue
      }

      // Calcular próxima ocorrência
      const nextDate = addInterval(
        new Date(rule.next_occurrence),
        rule.frequency,
        rule.interval,
      )

      // Se tiver day_of_month configurado, ajustar o dia (máx 28)
      if (rule.day_of_month) {
        nextDate.setDate(Math.min(rule.day_of_month, 28))
      }

      const nextOccurrence = nextDate.toISOString().split('T')[0]
      const isExpired = rule.ends_on && nextOccurrence > rule.ends_on

      await supabase
        .from('recurrence_rules')
        .update({
          next_occurrence: nextOccurrence,
          last_generated: rule.next_occurrence,
          is_active: !isExpired,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rule.id)

      processed++
    } catch (err) {
      console.error(`[process-recurrences] Erro inesperado para regra ${rule.id}:`, err)
      errors++
    }
  }

  const result = { date: today, processed, errors }
  console.log('[process-recurrences] Concluído:', result)

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
