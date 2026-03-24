import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Workspaces | Admin' }
export const revalidate = 0

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  pro: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export default async function AdminWorkspacesPage() {
  const supabase = createAdminClient()

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select(`
      id, name, slug, plan, currency_base, created_at, deleted_at,
      owner:profiles!owner_id(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // Get member counts
  const wsIds = (workspaces ?? []).map(w => w.id)
  const { data: memberCounts } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .in('workspace_id', wsIds)

  const countMap = new Map<string, number>()
  for (const row of memberCounts ?? []) {
    countMap.set(row.workspace_id, (countMap.get(row.workspace_id) ?? 0) + 1)
  }

  const active = (workspaces ?? []).filter(w => !w.deleted_at)
  const deleted = (workspaces ?? []).filter(w => w.deleted_at)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workspaces</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {active.length} ativos · {deleted.length} deletados
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Workspace</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Dono</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Plano</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Moeda</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Membros</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Criado em</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {(workspaces ?? []).map((ws) => {
              const plan = ws.plan ?? 'free'
              return (
                <tr key={ws.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${ws.deleted_at ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{ws.name}</p>
                      <p className="text-xs text-gray-400">/{ws.slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {(ws.owner as { full_name: string } | null)?.full_name ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PLAN_COLORS[plan] ?? PLAN_COLORS.free}`}>
                      {PLAN_LABELS[plan] ?? plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                    {ws.currency_base}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {countMap.get(ws.id) ?? 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(ws.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    {ws.deleted_at ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        Deletado
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        Ativo
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
