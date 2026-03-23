import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Entrar',
}

/**
 * Layout minimalista para rotas de autenticação.
 * Sem sidebar/topbar — apenas conteúdo centralizado.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary">Revenue Hub</h1>
          <p className="text-muted-foreground text-sm">Gestão financeira inteligente</p>
        </div>
        {children}
      </div>
    </div>
  )
}
