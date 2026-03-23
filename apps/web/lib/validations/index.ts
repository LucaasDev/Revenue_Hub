import { z } from 'zod'

/** UUID válido */
export const uuidSchema = z.string().uuid('ID inválido')

/** Data no formato ISO 8601 (YYYY-MM-DD) */
export const dateSchema = z.string().date('Data inválida')

/** Código de moeda (3 letras maiúsculas) */
export const currencySchema = z
  .string()
  .length(3, 'Moeda deve ter 3 caracteres')
  .regex(/^[A-Z]{3}$/, 'Moeda deve estar em letras maiúsculas (ex: BRL, USD)')

/** Cor hexadecimal (#RRGGBB) */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato #RRGGBB')
  .nullable()
  .optional()

/** Paginação */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(100).default(20),
})

/** Slug de workspace */
export const slugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens')
