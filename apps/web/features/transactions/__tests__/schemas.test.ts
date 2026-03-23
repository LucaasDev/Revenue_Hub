import { describe, it, expect } from 'vitest'
import { createTransactionSchema, listTransactionsSchema } from '../schemas'

const baseValid = {
  account_id: '00000000-0000-0000-0000-000000000001',
  type: 'expense' as const,
  amount: 150.0,
  description: 'Almoço',
  date: '2026-03-20',
  status: 'confirmed' as const,
  category_id: '00000000-0000-0000-0000-000000000002',
}

describe('createTransactionSchema', () => {
  it('aceita despesa válida com categoria', () => {
    expect(createTransactionSchema.safeParse(baseValid).success).toBe(true)
  })

  it('aceita receita sem categoria', () => {
    const result = createTransactionSchema.safeParse({
      ...baseValid,
      type: 'income',
      category_id: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita amount negativo', () => {
    const result = createTransactionSchema.safeParse({ ...baseValid, amount: -10 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path[0]).toBe('amount')
  })

  it('rejeita amount zero', () => {
    const result = createTransactionSchema.safeParse({ ...baseValid, amount: 0 })
    expect(result.success).toBe(false)
  })

  it('rejeita amount acima do máximo', () => {
    const result = createTransactionSchema.safeParse({ ...baseValid, amount: 1_000_000_000 })
    expect(result.success).toBe(false)
  })

  it('rejeita data inválida', () => {
    const result = createTransactionSchema.safeParse({ ...baseValid, date: '20-03-2026' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path[0]).toBe('date')
  })

  it('rejeita account_id inválido (não é UUID)', () => {
    const result = createTransactionSchema.safeParse({ ...baseValid, account_id: 'nao-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejeita transferência sem account destino', () => {
    const result = createTransactionSchema.safeParse({
      ...baseValid,
      type: 'transfer',
      transfer_to_account_id: undefined,
    })
    expect(result.success).toBe(false)
    const paths = result.error?.issues.map((i) => i.path[0])
    expect(paths).toContain('transfer_to_account_id')
  })

  it('aceita transferência com account destino válido', () => {
    const result = createTransactionSchema.safeParse({
      ...baseValid,
      type: 'transfer',
      category_id: null,
      transfer_to_account_id: '00000000-0000-0000-0000-000000000003',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita descrição vazia', () => {
    const result = createTransactionSchema.safeParse({ ...baseValid, description: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita descrição com mais de 255 caracteres', () => {
    const result = createTransactionSchema.safeParse({ ...baseValid, description: 'A'.repeat(256) })
    expect(result.success).toBe(false)
  })

  it('aceita status pending', () => {
    const result = createTransactionSchema.safeParse({ ...baseValid, status: 'pending' })
    expect(result.success).toBe(true)
  })

  it('rejeita status inválido', () => {
    const result = createTransactionSchema.safeParse({ ...baseValid, status: 'invalid_status' })
    expect(result.success).toBe(false)
  })
})

describe('listTransactionsSchema', () => {
  it('aplica defaults quando nenhum filtro é passado', () => {
    const result = listTransactionsSchema.safeParse({})
    expect(result.success).toBe(true)
    expect(result.data?.page).toBe(1)
    expect(result.data?.perPage).toBe(20)
  })

  it('rejeita perPage acima de 100', () => {
    const result = listTransactionsSchema.safeParse({ perPage: 101 })
    expect(result.success).toBe(false)
  })
})
