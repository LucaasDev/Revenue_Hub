import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Callback OAuth do Supabase.
 * Troca o `code` por uma sessão e redireciona para o app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Redireciona para login em caso de erro
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
