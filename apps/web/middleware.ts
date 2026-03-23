import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          ),
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Rotas públicas — redireciona usuário logado para home
  const publicRoutes = ['/login', '/signup', '/forgot-password']
  if (publicRoutes.includes(pathname)) {
    if (user) return NextResponse.redirect(new URL('/', request.url))
    return supabaseResponse
  }

  // Proteção geral: requer autenticação
  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Proteção do painel admin — verifica is_super_admin via service role
  if (pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_super_admin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // ── Enforcement de trial/assinatura ─────────────────────────────────────────
  // Pattern: /<workspace-slug>/<subpath> — ex: /lucas-oliveira/dashboard
  // Não bloquear a rota /billing para evitar loop infinito
  const workspaceAppMatch = pathname.match(/^\/([a-z0-9-]+)\/(?!billing|api)(.*)$/)

  if (workspaceAppMatch && user) {
    const workspaceSlug = workspaceAppMatch[1]

    // Segmentos reservados que não são workspace slugs
    const reservedSegments = ['login', 'signup', 'forgot-password', 'reset-password', 'api', '_next', 'admin']
    if (!reservedSegments.includes(workspaceSlug)) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('subscription_status, trial_ends_at')
        .eq('slug', workspaceSlug)
        .single()

      if (workspace) {
        const status = workspace.subscription_status ?? 'trialing'
        const trialEndsAt = workspace.trial_ends_at
        const now = new Date()

        const isActive = status === 'active'
        const isValidTrial =
          status === 'trialing' &&
          trialEndsAt &&
          new Date(trialEndsAt) > now

        const hasAccess = isActive || isValidTrial

        if (!hasAccess) {
          let reason = 'trial_expired'
          if (status === 'past_due') reason = 'past_due'
          if (status === 'canceled') reason = 'canceled'

          const billingUrl = new URL(`/${workspaceSlug}/billing`, request.url)
          billingUrl.searchParams.set('reason', reason)
          return NextResponse.redirect(billingUrl)
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Executa em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - api/auth (callbacks OAuth do Supabase)
     * - api/health (health check — público)
     * - api/webhooks (webhook do Stripe — sem auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|api/health|api/webhooks).*)',
  ],
}
