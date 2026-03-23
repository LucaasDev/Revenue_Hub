import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isAfter,
  isBefore,
  differenceInDays,
  differenceInMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Formata uma data ISO para exibição (ex: "20 mar. 2026") */
export function formatDate(date: string | Date, fmt = 'd MMM. yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: ptBR })
}

/** Formata data relativa ao mês/ano (ex: "Março 2026") */
export function formatMonthYear(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMMM yyyy', { locale: ptBR })
}

/** Retorna o primeiro e último dia do mês de uma data */
export function getMonthRange(date: Date = new Date()) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  }
}

/** Navega para o mês anterior/seguinte */
export function navigateMonth(date: Date, direction: 'prev' | 'next'): Date {
  return direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1)
}

/** Calcula quantos dias faltam até uma data alvo */
export function daysUntil(target: string | Date): number {
  const t = typeof target === 'string' ? parseISO(target) : target
  return differenceInDays(t, new Date())
}

/** Calcula quantos meses faltam até uma data alvo */
export function monthsUntil(target: string | Date): number {
  const t = typeof target === 'string' ? parseISO(target) : target
  return differenceInMonths(t, new Date())
}

export { isAfter, isBefore, parseISO, format }
