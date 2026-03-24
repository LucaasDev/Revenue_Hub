'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'

export async function toggleSuperAdmin(targetUserId: string, makeAdmin: boolean) {
  // Verify caller is super_admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_super_admin) throw new Error('Sem permissão')

  // Use admin client to bypass RLS
  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('profiles')
    .update({ is_super_admin: makeAdmin })
    .eq('id', targetUserId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/users')
}
