import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin | Revenue Hub' }

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Painel de Administração</h1>
      <p className="text-muted-foreground">
        Acesso restrito a super_admins.
      </p>
    </div>
  )
}
