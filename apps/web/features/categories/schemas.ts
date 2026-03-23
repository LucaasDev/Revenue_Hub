import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(60, 'Máximo 60 caracteres'),
  type: z.enum(['income', 'expense']),
  parent_id: z.string().uuid().nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{3,6}$/, 'Cor inválida').nullable().optional(),
  icon: z.string().max(30).nullable().optional(),
})

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid(),
})

export const mergeCategorySchema = z.object({
  sourceCategoryId: z.string().uuid(),
  targetCategoryId: z.string().uuid(),
}).refine(d => d.sourceCategoryId !== d.targetCategoryId, {
  message: 'Categorias de origem e destino devem ser diferentes',
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type MergeCategoryInput = z.infer<typeof mergeCategorySchema>
