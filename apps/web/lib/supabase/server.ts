import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@revenue-hub/database'

/**
 * Supabase server client — para uso em Server Components, Server Actions e Route Handlers.
 * Lê e escreve cookies automaticamente para manter a sessão.
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // setAll pode falhar em Server Components read-only
            // O middleware trata isso corretamente
          }
        },
      },
    },
  )
}

// Alias para compatibilidade com imports que usam createClient
export const createClient = createServerClient
