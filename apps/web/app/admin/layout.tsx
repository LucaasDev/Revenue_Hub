import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Layout do painel admin global.
 * Verificação via service role — não usa RLS.
 * Apenas super_admins chegam aqui (middleware também verifica).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_super_admin) redirect('/')

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 border-r bg-card p-4 flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Admin Global
        </p>
        {/* TODO: NavLinks para workspaces e users */}
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
