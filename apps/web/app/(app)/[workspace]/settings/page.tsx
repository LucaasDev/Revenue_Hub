import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getWorkspaceBySlug } from '@/features/workspaces/queries'
import { WorkspaceSettingsForm } from '@/features/workspaces/components/WorkspaceSettingsForm'

export const metadata: Metadata = { title: 'Configurações' }

interface SettingsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspace: slug } = await params
  const ws = await getWorkspaceBySlug(slug)
  if (!ws) notFound()

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações do workspace</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gerencie as informações e preferências do seu workspace.
        </p>
      </div>
      <WorkspaceSettingsForm
        workspaceId={ws.id}
        defaultValues={{
          name: ws.name,
          currency_base: ws.currency_base,
          slug: ws.slug,
        }}
      />
    </div>
  )
}
