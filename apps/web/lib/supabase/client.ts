import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@revenue-hub/database'

/**
 * Supabase browser client — singleton para uso em Client Components.
 * Nunca usar server-side (use server.ts para isso).
 */
let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (client) return client

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  return client
}
