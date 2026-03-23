'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Reportar para Sentry em produção
    if (process.env.NODE_ENV === 'production') {
      console.error('[Error Boundary]', error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h2 className="text-xl font-semibold">Algo deu errado</h2>
      <p className="text-muted-foreground text-sm">
        {error.message || 'Ocorreu um erro inesperado.'}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
      >
        Tentar novamente
      </button>
    </div>
  )
}
