'use client'

import { useState, useTransition } from 'react'
import { updateWorkspace } from '../actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const CURRENCIES = [
  { value: 'BRL', label: 'Real Brasileiro (BRL)' },
  { value: 'USD', label: 'Dólar Americano (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'Libra Esterlina (GBP)' },
  { value: 'ARS', label: 'Peso Argentino (ARS)' },
]

interface WorkspaceSettingsFormProps {
  workspaceId: string
  defaultValues: {
    name: string
    currency_base: string
    slug: string
  }
}

export function WorkspaceSettingsForm({ workspaceId, defaultValues }: WorkspaceSettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(defaultValues.name)
  const [currency, setCurrency] = useState(defaultValues.currency_base)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSuccess(false)
    setError(null)

    startTransition(async () => {
      const result = await updateWorkspace(workspaceId, { name, currency_base: currency })
      if (!result.ok) {
        setError(result.error ?? 'Erro ao salvar')
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
    >
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Informações gerais</h2>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Atualize o nome e a moeda principal do workspace.
        </p>
      </div>

      <div className="space-y-4">
        {/* Workspace name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome do workspace
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Meu workspace"
            className="w-full"
            required
          />
        </div>

        {/* Slug (readonly) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            URL do workspace{' '}
            <span className="text-xs font-normal text-gray-400">(não editável)</span>
          </label>
          <Input
            value={defaultValues.slug}
            readOnly
            className="w-full cursor-not-allowed opacity-60"
          />
        </div>

        {/* Currency */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Moeda principal
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
          Configurações salvas com sucesso!
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={isPending} disabled={isPending}>
          Salvar alterações
        </Button>
      </div>
    </form>
  )
}
