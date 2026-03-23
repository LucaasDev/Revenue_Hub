import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Membros' }

export default async function MembersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Membros</h1>
      {/* TODO Sprint 1 (Epic 4.7): Lista, alterar role, remover, convidar */}
    </div>
  )
}
