import { describe, it, expect } from 'vitest'
import { loginSchema, signupSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas'

// ============================================================
// loginSchema — 6 casos
// ============================================================
describe('loginSchema', () => {
  it('aceita email e senha válidos', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'abc123' })
    expect(result.success).toBe(true)
  })

  it('rejeita email inválido', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'abc123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path[0]).toBe('email')
  })

  it('rejeita email vazio', () => {
    const result = loginSchema.safeParse({ email: '', password: 'abc123' })
    expect(result.success).toBe(false)
  })

  it('rejeita senha com menos de 6 caracteres', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '12345' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path[0]).toBe('password')
  })

  it('rejeita quando faltam campos', () => {
    const result = loginSchema.safeParse({})
    expect(result.success).toBe(false)
    expect(result.error?.issues.length).toBeGreaterThanOrEqual(2)
  })

  it('aceita senha com exatamente 6 caracteres', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '123456' })
    expect(result.success).toBe(true)
  })
})

// ============================================================
// signupSchema — 8 casos
// ============================================================
describe('signupSchema', () => {
  const validData = {
    fullName: 'Lucas Oliveira',
    email: 'lucas@example.com',
    password: 'Senha123',
    confirmPassword: 'Senha123',
  }

  it('aceita dados válidos completos', () => {
    const result = signupSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejeita nome com menos de 2 caracteres', () => {
    const result = signupSchema.safeParse({ ...validData, fullName: 'A' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path[0]).toBe('fullName')
  })

  it('rejeita senha sem letra maiúscula', () => {
    const result = signupSchema.safeParse({ ...validData, password: 'senha123', confirmPassword: 'senha123' })
    expect(result.success).toBe(false)
    const paths = result.error?.issues.map((i) => i.path[0])
    expect(paths).toContain('password')
  })

  it('rejeita senha sem número', () => {
    const result = signupSchema.safeParse({ ...validData, password: 'SenhaSemNumero', confirmPassword: 'SenhaSemNumero' })
    expect(result.success).toBe(false)
    const paths = result.error?.issues.map((i) => i.path[0])
    expect(paths).toContain('password')
  })

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = signupSchema.safeParse({ ...validData, password: 'Ab1234', confirmPassword: 'Ab1234' })
    expect(result.success).toBe(false)
  })

  it('rejeita quando confirmPassword não bate com password', () => {
    const result = signupSchema.safeParse({ ...validData, confirmPassword: 'SenhaErrada1' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path[0]).toBe('confirmPassword')
  })

  it('rejeita email inválido no signup', () => {
    const result = signupSchema.safeParse({ ...validData, email: 'invalido' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path[0]).toBe('email')
  })

  it('rejeita nome com mais de 100 caracteres', () => {
    const result = signupSchema.safeParse({ ...validData, fullName: 'A'.repeat(101) })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// forgotPasswordSchema — 3 casos
// ============================================================
describe('forgotPasswordSchema', () => {
  it('aceita email válido', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejeita email inválido', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'nao-e-email' })
    expect(result.success).toBe(false)
  })

  it('rejeita campo ausente', () => {
    const result = forgotPasswordSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

// ============================================================
// resetPasswordSchema — 4 casos
// ============================================================
describe('resetPasswordSchema', () => {
  it('aceita senhas válidas que coincidem', () => {
    const result = resetPasswordSchema.safeParse({ password: 'NovaSenha1', confirmPassword: 'NovaSenha1' })
    expect(result.success).toBe(true)
  })

  it('rejeita quando senhas não coincidem', () => {
    const result = resetPasswordSchema.safeParse({ password: 'NovaSenha1', confirmPassword: 'Diferente1' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path[0]).toBe('confirmPassword')
  })

  it('rejeita senha fraca (sem maiúscula)', () => {
    const result = resetPasswordSchema.safeParse({ password: 'novasenha1', confirmPassword: 'novasenha1' })
    expect(result.success).toBe(false)
  })

  it('rejeita senha fraca (sem número)', () => {
    const result = resetPasswordSchema.safeParse({ password: 'NovaSenhaSemNumero', confirmPassword: 'NovaSenhaSemNumero' })
    expect(result.success).toBe(false)
  })
})
