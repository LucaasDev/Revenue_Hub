import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Workspaces | Admin' }

export default async function AdminWorkspacesPage() {
  const supabase = createAdminClient()
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('*, owner:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Workspaces</h1>
      <p className="text-muted-foreground text-sm">{workspaces?.length ?? 0} workspaces encontrados</p>
      {/* TODO: Tabela paginada com ações de admin */}
    </div>
  )
}
