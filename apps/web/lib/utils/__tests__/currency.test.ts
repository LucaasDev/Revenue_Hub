import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatCurrencyCompact,
  parseCurrencyInput,
  convertCurrency,
  getAmountColor,
  getAmountPrefix,
} from '../currency'

describe('formatCurrency', () => {
  it('formata BRL corretamente', () => {
    const result = formatCurrency(1234.56, 'BRL', 'pt-BR')
    expect(result).toContain('1.234,56')
  })

  it('formata zero', () => {
    const result = formatCurrency(0, 'BRL', 'pt-BR')
    expect(result).toContain('0,00')
  })

  it('formata valores negativos', () => {
    const result = formatCurrency(-500, 'BRL', 'pt-BR')
    expect(result).toContain('500,00')
  })
})

describe('parseCurrencyInput', () => {
  it('converte string BRL para número', () => {
    expect(parseCurrencyInput('R$ 1.234,56')).toBeCloseTo(1234.56)
  })

  it('retorna 0 para string vazia', () => {
    expect(parseCurrencyInput('')).toBe(0)
  })

  it('converte valor simples', () => {
    expect(parseCurrencyInput('150,00')).toBeCloseTo(150)
  })
})

describe('convertCurrency', () => {
  it('aplica a taxa corretamente', () => {
    expect(convertCurrency(100, 5.5)).toBeCloseTo(550)
  })

  it('retorna o mesmo valor com taxa 1', () => {
    expect(convertCurrency(250, 1)).toBe(250)
  })
})

describe('getAmountColor', () => {
  it('retorna cor verde para income', () => {
    expect(getAmountColor('income')).toContain('income')
  })

  it('retorna cor vermelha para expense', () => {
    expect(getAmountColor('expense')).toContain('expense')
  })

  it('retorna cor azul para transfer', () => {
    expect(getAmountColor('transfer')).toContain('transfer')
  })
})

describe('getAmountPrefix', () => {
  it('retorna + para income', () => {
    expect(getAmountPrefix('income')).toBe('+')
  })

  it('retorna − para expense', () => {
    expect(getAmountPrefix('expense')).toBe('−')
  })

  it('retorna ↔ para transfer', () => {
    expect(getAmountPrefix('transfer')).toBe('↔')
  })
})
