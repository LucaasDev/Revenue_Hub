/**
 * Utilitários de formatação
 */

/**
 * Formata um valor numérico como moeda BRL
 * Ex: 1999.9 → "R$ 1.999,90"
 */
export function formatCurrency(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value)
}

/**
 * Formata um número como percentual
 * Ex: 0.75 → "75%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Formata uma data como string legível
 * Ex: new Date() → "22/03/2026"
 */
export function formatDate(date: Date | string, style: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (style === 'long') {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d)
  }
  return new Intl.DateTimeFormat('pt-BR').format(d)
}

/**
 * Formata um número compacto (ex: 1.500 → "1,5 mil")
 */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value)
}
