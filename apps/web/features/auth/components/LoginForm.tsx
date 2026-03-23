'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login, loginWithGoogle } from '../actions'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = Object.fromEntries(new FormData(e.currentTarget))
    const result = await login(formData)

    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  async function handleGoogle() {
    setLoading(true)
    const result = await loginWithGoogle()
    if (result.ok) {
      window.location.href = result.data.url
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Entrar na sua conta</h2>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Esqueci a senha
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <div className="my-4 flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
      >
        Continuar com Google
      </button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link href="/signup" className="text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}
