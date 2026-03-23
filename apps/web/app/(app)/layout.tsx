import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Layout raiz do app autenticado.
 * Verifica autenticação e redireciona para /login se necessário.
 * O middleware também faz essa verificação — esta é uma camada adicional (defense-in-depth).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
