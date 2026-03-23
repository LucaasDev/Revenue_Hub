/**
 * Next.js Instrumentation Hook
 * Inicializa o Sentry no servidor antes de qualquer request.
 * Só ativa quando SENTRY_DSN está configurado (evita incluir binários
 * nativos do OpenTelemetry no bundle serverless da Vercel).
 */
export async function register() {
  if (!process.env.SENTRY_DSN) return

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
}

/**
 * Hook de erro do Next.js — captura erros não tratados no servidor.
 * Condicional ao SENTRY_DSN para evitar import desnecessário em produção
 * sem Sentry configurado.
 */
export const onRequestError = async (
  err: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string },
) => {
  if (!process.env.SENTRY_DSN) return
  const { captureRequestError } = await import('@sentry/nextjs')
  captureRequestError(err, request, context)
}
