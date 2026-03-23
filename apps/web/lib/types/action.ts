/**
 * Tipo de retorno padrão para todas as Server Actions do Revenue Hub.
 * Garante consistência no tratamento de erros no cliente.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }

/**
 * Códigos de erro comuns
 */
export const ErrorCodes = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  PLAN_LIMIT_REACHED: 'PLAN_LIMIT_REACHED',
  DB_ERROR: 'DB_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]
