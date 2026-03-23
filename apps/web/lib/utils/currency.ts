/**
 * Utilitários de formatação e conversão de moeda.
 */

/** Formata um valor numérico como moeda (padrão: BRL) */
export function formatCurrency(
  amount: number,
  currency = 'BRL',
  locale = 'pt-BR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Formata valor compacto (ex: R$ 1,2 mil, R$ 3,4 mi) */
export function formatCurrencyCompact(
  amount: number,
  currency = 'BRL',
  locale = 'pt-BR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

/** Converte string de moeda ("R$ 1.234,56") para número (1234.56) */
export function parseCurrencyInput(value: string): number {
  // Remove símbolo, espaços e pontos de milhar, troca vírgula por ponto
  const cleaned = value
    .replace(/[^0-9,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  return parseFloat(cleaned) || 0
}

/**
 * Converte valor de uma moeda para outra usando a taxa fornecida.
 * @param amount - valor na moeda de origem
 * @param rate - taxa de câmbio (1 unidade da moeda de origem = `rate` unidades da moeda destino)
 */
export function convertCurrency(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100
}

/** Cores semânticas por tipo de transação */
export function getAmountColor(type: 'income' | 'expense' | 'transfer' | 'opening_balance') {
  switch (type) {
    case 'income':
    case 'opening_balance':
      return 'text-income'
    case 'expense':
      return 'text-expense'
    case 'transfer':
      return 'text-transfer'
    default:
      return 'text-foreground'
  }
}

/** Prefixo de sinal por tipo */
export function getAmountPrefix(type: 'income' | 'expense' | 'transfer' | 'opening_balance') {
  return type === 'income' || type === 'opening_balance' ? '+' : type === 'expense' ? '−' : '↔'
}
