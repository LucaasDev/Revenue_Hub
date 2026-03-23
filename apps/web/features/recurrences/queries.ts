import { createClient } from '@/lib/supabase/server'

export async function getRecurrenceRules(workspaceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recurrence_rules')
    .select(`
      *,
      account:accounts(id, name, icon, color),
      category:categories(id, name, icon, color)
    `)
    .eq('workspace_id', workspaceId)
    .order('next_occurrence', { ascending: true })

  return { data, error: error?.message }
}
