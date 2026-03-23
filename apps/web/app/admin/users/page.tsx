import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Usuários | Admin' }

export default async function AdminUsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Usuários</h1>
      {/* TODO: Lista de usuários, impersonar, promover super_admin */}
    </div>
  )
}
