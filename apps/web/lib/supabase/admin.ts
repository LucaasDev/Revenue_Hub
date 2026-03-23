import { createClient } from '@supabase/supabase-js'
import type { Database } from '@revenue-hub/database'

/**
 * Supabase admin client com service_role key.
 * IMPORTANTE:
 * - Bypassa RLS completamente — use com EXTREMO cuidado.
 * - Nunca exportar para client-side (sem prefixo NEXT_PUBLIC_).
 * - Usar apenas em: Route Handlers protegidos, Server Actions de admin, Edge Functions.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para o admin client',
    )
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
