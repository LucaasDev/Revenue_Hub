'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CategoryTree } from './CategoryTree'
import { CategoryForm } from './CategoryForm'

interface CategoryNode {
  id: string
  name: string
  type: 'income' | 'expense'
  parent_id: string | null
  icon: string | null
  color: string | null
  is_system: boolean
}

interface CategoriesPageClientProps {
  categories: CategoryNode[]
  workspaceId: string
}

export function CategoriesPageClient({ categories, workspaceId }: CategoriesPageClientProps) {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Categorias</h1>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <PlusIcon className="mr-1.5 h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      <CategoryTree categories={categories} workspaceId={workspaceId} />

      <CategoryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        workspaceId={workspaceId}
        categories={categories}
      />
    </div>
  )
}
