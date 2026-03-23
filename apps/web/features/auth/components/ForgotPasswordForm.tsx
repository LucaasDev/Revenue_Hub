'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '../actions'

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = Object.fromEntries(new FormData(e.currentTarget))
    const result = await forgotPassword(formData)

    if (!result.ok) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
        <h2 className="text-xl font-semibold mb-2">Email enviado</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Se este email estiver cadastrado, você receberá as instruções de recuperação em breve.
        </p>
        <Link href="/login" className="text-primary hover:underline text-sm">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Recuperar senha</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Informe seu email e enviaremos um link para criar uma nova senha.
      </p>

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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Enviar link de recuperação'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  )
}
