import * as Sentry from '@sentry/nextjs'

/**
 * Sentry — configuração do lado do servidor (Node.js / Edge Runtime).
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,

  enabled: process.env.NODE_ENV === 'production',

  // Amostragem maior no servidor para capturar mais erros
  tracesSampleRate: 0.2,
})
