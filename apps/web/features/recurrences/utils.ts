import { addDays, addWeeks, addMonths, addYears, setDate } from 'date-fns'

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

/**
 * Calcula as próximas N ocorrências de uma regra de recorrência.
 * Usado no formulário para preview client-side das próximas datas.
 */
export function getNextOccurrences(
  startsOn: Date,
  frequency: RecurrenceFrequency,
  intervalCount: number,
  dayOfMonth: number | null,
  count: number = 3,
): Date[] {
  const results: Date[] = []
  let current = new Date(startsOn)

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      // First occurrence = starts_on
      results.push(new Date(current))
    } else {
      // Advance by interval
      switch (frequency) {
        case 'daily':
          current = addDays(current, intervalCount)
          break
        case 'weekly':
          current = addWeeks(current, intervalCount)
          break
        case 'monthly':
          current = addMonths(current, intervalCount)
          // Apply day_of_month if specified
          if (dayOfMonth) {
            const maxDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
            current = setDate(current, Math.min(dayOfMonth, maxDay))
          }
          break
        case 'yearly':
          current = addYears(current, intervalCount)
          break
      }
      results.push(new Date(current))
    }
  }

  return results
}
