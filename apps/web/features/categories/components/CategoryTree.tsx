'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  Edit2Icon,
  GitMergeIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { Badge } from '@/components/ui/Badge'
import { DynamicIcon } from '@/components/ui/IconPicker'
import { cn } from '@/lib/utils/cn'
import { deleteCategory } from '../actions'
import { CategoryMergeDialog } from './CategoryMergeDialog'
import { CategoryForm } from './CategoryForm'

interface CategoryNode {
  id: string
  name: string
  type: 'income' | 'expense'
  parent_id: string | null
  icon: string | null
  color: string | null
  is_system: boolean
  children?: CategoryNode[]
}

interface CategoryTreeProps {
  categories: CategoryNode[]
  workspaceId: string
}

function CategoryItem({
  category,
  allCategories,
  workspaceId,
  depth = 0,
}: {
  category: CategoryNode
  allCategories: CategoryNode[]
  workspaceId: string
  depth?: number
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [addChildOpen, setAddChildOpen] = useState(false)

  const hasChildren = (category.children?.length ?? 0) > 0

  const handleDelete = () => {
    if (!confirm(`Excluir "${category.name}"?`)) return
    startTransition(async () => {
      const result = await deleteCategory(workspaceId, category.id)
      if (!result.ok) { alert(result.error); return }
      router.refresh()
    })
  }

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-2 rounded-md px-2 py-1.5',
          'hover:bg-muted/40 transition-colors',
          depth > 0 && 'ml-6',
        )}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded
              ? <ChevronDownIcon className="h-4 w-4" />
              : <ChevronRightIcon className="h-4 w-4" />
            }
          </button>
        ) : (
          <span className="h-4 w-4" />
        )}

        {/* Icon */}
        <DynamicIcon
          name={category.icon}
          className="h-4 w-4 flex-shrink-0"
          // @ts-ignore
          style={{ color: category.color ?? undefined }}
        />

        {/* Name */}
        <span className="flex-1 text-sm font-medium text-foreground">{category.name}</span>

        {/* System badge */}
        {category.is_system && (
          <Badge variant="outline" className="text-xs">sistema</Badge>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-accent">
            <span className="sr-only">Opções</span>
            <span className="text-muted-foreground">···</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)} icon={<Edit2Icon className="h-4 w-4" />}>
              Editar
            </DropdownMenuItem>
            {depth === 0 && (
              <DropdownMenuItem
                onClick={() => setAddChildOpen(true)}
                icon={<PlusIcon className="h-4 w-4" />}
              >
                Adicionar subcategoria
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setMergeOpen(true)} icon={<GitMergeIcon className="h-4 w-4" />}>
              Mesclar...
            </DropdownMenuItem>
            {!category.is_system && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  destructive
                  icon={<Trash2Icon className="h-4 w-4" />}
                >
                  Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {hasChildren && expanded && category.children!.map(child => (
        <CategoryItem
          key={child.id}
          category={child}
          allCategories={allCategories}
          workspaceId={workspaceId}
          depth={depth + 1}
        />
      ))}

      {/* Forms */}
      {editOpen && (
        <CategoryForm
          open={editOpen}
          onClose={() => setEditOpen(false)}
          category={category}
          workspaceId={workspaceId}
          categories={allCategories}
        />
      )}
      {addChildOpen && (
        <CategoryForm
          open={addChildOpen}
          onClose={() => setAddChildOpen(false)}
          category={{ ...category, id: '', parent_id: category.id, name: '' }}
          workspaceId={workspaceId}
          categories={allCategories}
        />
      )}
      {mergeOpen && (
        <CategoryMergeDialog
          open={mergeOpen}
          onClose={() => setMergeOpen(false)}
          sourceCategory={category}
          categories={allCategories}
          workspaceId={workspaceId}
        />
      )}
    </>
  )
}

export function CategoryTree({ categories, workspaceId }: CategoryTreeProps) {
  // Build tree structure
  const rootCategories = categories.filter(c => c.parent_id === null)
  const childrenMap = new Map<string, CategoryNode[]>()

  for (const cat of categories.filter(c => c.parent_id !== null)) {
    const list = childrenMap.get(cat.parent_id!) ?? []
    list.push(cat)
    childrenMap.set(cat.parent_id!, list)
  }

  const tree: CategoryNode[] = rootCategories.map(root => ({
    ...root,
    children: childrenMap.get(root.id) ?? [],
  }))

  const expenseTree = tree.filter(c => c.type === 'expense')
  const incomeTree = tree.filter(c => c.type === 'income')

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Expenses */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Despesas ({expenseTree.length})
        </h3>
        <div className="rounded-lg border border-border py-1">
          {expenseTree.map(cat => (
            <CategoryItem
              key={cat.id}
              category={cat}
              allCategories={categories}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      </div>

      {/* Income */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Receitas ({incomeTree.length})
        </h3>
        <div className="rounded-lg border border-border py-1">
          {incomeTree.map(cat => (
            <CategoryItem
              key={cat.id}
              category={cat}
              allCategories={categories}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
