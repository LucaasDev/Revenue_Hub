/**
 * Next.js Instrumentation Hook
 * Inicializa o Sentry no servidor antes de qualquer request.
 * Referência: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.server.config')
  }
}

/**
 * Hook de erro do Next.js — captura erros não tratados no servidor.
 */
export const onRequestError = async (
  err: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string },
) => {
  const { captureRequestError } = await import('@sentry/nextjs')
  captureRequestError(err, request, context)
}
