import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceBySlug } from '@/features/workspaces/queries'
import { CategoryTree } from '@/features/categories/components/CategoryTree'
import { CategoriesPageClient } from '@/features/categories/components/CategoriesPageClient'

export const metadata: Metadata = { title: 'Categorias' }

interface CategoriesPageProps {
  params: Promise<{ workspace: string }>
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { workspace: workspaceSlug } = await params

  const ws = await getWorkspaceBySlug(workspaceSlug)
  if (!ws) return null

  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, type, parent_id, icon, color, is_system')
    .eq('workspace_id', ws.id)
    .order('name')

  return (
    <CategoriesPageClient
      categories={(categories as any) ?? []}
      workspaceId={ws.id}
    />
  )
}
