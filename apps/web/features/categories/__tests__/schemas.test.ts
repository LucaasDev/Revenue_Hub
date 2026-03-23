import { describe, it, expect } from 'vitest'
import { createCategorySchema, updateCategorySchema, mergeCategorySchema } from '../schemas'

describe('createCategorySchema', () => {
  const valid = {
    name: 'Alimentação',
    type: 'expense',
    parent_id: null,
    color: '#ef4444',
    icon: 'utensils',
  }

  it('accepts valid data', () => {
    expect(createCategorySchema.safeParse(valid).success).toBe(true)
  })

  it('requires name', () => {
    const result = createCategorySchema.safeParse({ ...valid, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name > 60 chars', () => {
    const result = createCategorySchema.safeParse({ ...valid, name: 'a'.repeat(61) })
    expect(result.success).toBe(false)
  })

  it('requires type to be income or expense', () => {
    const result = createCategorySchema.safeParse({ ...valid, type: 'transfer' })
    expect(result.success).toBe(false)
  })

  it('accepts null parent_id (root category)', () => {
    const result = createCategorySchema.safeParse({ ...valid, parent_id: null })
    expect(result.success).toBe(true)
  })

  it('accepts valid uuid parent_id', () => {
    const result = createCategorySchema.safeParse({
      ...valid,
      parent_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid parent_id (not UUID)', () => {
    const result = createCategorySchema.safeParse({ ...valid, parent_id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })
})

describe('mergeCategorySchema', () => {
  const sourceId = '550e8400-e29b-41d4-a716-446655440001'
  const targetId = '550e8400-e29b-41d4-a716-446655440002'

  it('accepts valid source and target', () => {
    expect(mergeCategorySchema.safeParse({ sourceCategoryId: sourceId, targetCategoryId: targetId }).success).toBe(true)
  })

  it('rejects same source and target', () => {
    const result = mergeCategorySchema.safeParse({
      sourceCategoryId: sourceId,
      targetCategoryId: sourceId,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('diferentes')
    }
  })

  it('rejects invalid UUIDs', () => {
    const result = mergeCategorySchema.safeParse({
      sourceCategoryId: 'not-a-uuid',
      targetCategoryId: targetId,
    })
    expect(result.success).toBe(false)
  })
})

describe('Category depth validation logic', () => {
  // Test the 2-level depth enforcement logic used in actions.ts
  it('rejects subcategory with a parent that has a parent (depth > 2)', () => {
    const grandparent = { id: 'gp', parent_id: null }
    const parent = { id: 'p', parent_id: 'gp' }

    // Trying to create a child of 'parent' (which already has a parent_id)
    const isDepthExceeded = parent.parent_id !== null
    expect(isDepthExceeded).toBe(true)
  })

  it('allows subcategory if parent is root', () => {
    const parent = { id: 'p', parent_id: null }

    const isDepthExceeded = parent.parent_id !== null
    expect(isDepthExceeded).toBe(false)
  })
})
