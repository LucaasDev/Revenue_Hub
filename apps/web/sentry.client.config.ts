import * as Sentry from '@sentry/nextjs'

/**
 * Sentry — configuração do lado do cliente (browser).
 * Executado automaticamente pelo Next.js via instrumentation hook.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Captura erros somente em produção
  enabled: process.env.NODE_ENV === 'production',

  // Amostragem de performance (10% das transações)
  tracesSampleRate: 0.1,

  // Amostragem de replay de sessão
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,      // Oculta texto sensível nos replays
      blockAllMedia: true,    // Bloqueia imagens nos replays
    }),
  ],
})
