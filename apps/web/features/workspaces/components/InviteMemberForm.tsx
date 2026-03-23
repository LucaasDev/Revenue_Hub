'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { inviteMember } from '../actions'

interface InviteMemberFormProps {
  workspaceId: string
  onSuccess?: () => void
}

const roleOptions = [
  { value: 'member', label: 'Membro — pode criar transações e metas' },
  { value: 'admin', label: 'Admin — pode gerenciar contas, categorias e membros' },
]

export function InviteMemberForm({ workspaceId, onSuccess }: InviteMemberFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = Object.fromEntries(new FormData(e.currentTarget))
    const result = await inviteMember(workspaceId, formData)

    if (!result.ok) {
      setError(result.error)
    } else {
      onSuccess?.()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Input
        name="email"
        type="email"
        label="Email do convidado"
        placeholder="colaborador@exemplo.com"
        required
        autoComplete="off"
      />

      <Select
        name="role"
        label="Permissão"
        options={roleOptions}
        defaultValue="member"
      />

      <Button type="submit" loading={loading} className="self-end">
        Enviar convite
      </Button>
    </form>
  )
}
