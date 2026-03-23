import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Configurações' }

export default async function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configurações do workspace</h1>
      {/* TODO Sprint 1 (Epic 4.5): Nome, moeda base, slug (readonly) */}
    </div>
  )
}
