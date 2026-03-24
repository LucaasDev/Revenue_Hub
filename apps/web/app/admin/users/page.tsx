import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { ToggleAdminButton } from './_components/ToggleAdminButton'

export const metadata: Metadata = { title: 'Usuários | Admin' }
export const revalidate = 0

export default async function AdminUsersPage() {
  const supabase = createAdminClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, is_super_admin, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  // Get auth users to get emails
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 100 })
  const emailMap = new Map(authUsers?.map(u => [u.id, u.email]) ?? [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {users?.length ?? 0} usuários cadastrados na plataforma.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Cadastro</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Papel</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {(users ?? []).map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                      {(user.full_name ?? 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.full_name ?? '—'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {emailMap.get(user.id) ?? '—'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4">
                  {user.is_super_admin ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Super Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      Usuário
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <ToggleAdminButton userId={user.id} isAdmin={user.is_super_admin ?? false} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
