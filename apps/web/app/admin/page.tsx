import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Admin | Revenue Hub' }
export const revalidate = 60

async function getStats() {
  const supabase = createAdminClient()
  const [
    { count: totalUsers },
    { count: totalWorkspaces },
    { count: totalTransactions },
    { count: totalAdmins },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('workspaces').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('transactions').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_super_admin', true),
  ])
  return { totalUsers, totalWorkspaces, totalTransactions, totalAdmins }
}

export default async function AdminPage() {
  const { totalUsers, totalWorkspaces, totalTransactions, totalAdmins } = await getStats()

  const cards = [
    { label: 'Usuários', value: totalUsers ?? 0, icon: '👥', color: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    { label: 'Workspaces', value: totalWorkspaces ?? 0, icon: '🏢', color: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Transações', value: totalTransactions ?? 0, icon: '💳', color: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Super Admins', value: totalAdmins ?? 0, icon: '🔑', color: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visão Geral</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Estatísticas globais da plataforma Revenue Hub.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900`}
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${card.color} text-xl mb-3`}>
              {card.icon}
            </div>
            <p className={`text-3xl font-bold ${card.text}`}>{card.value.toLocaleString('pt-BR')}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/admin/users"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Gerenciar usuários
          </a>
          <a
            href="/admin/workspaces"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 transition-colors"
          >
            Ver workspaces
          </a>
        </div>
      </div>
    </div>
  )
}
