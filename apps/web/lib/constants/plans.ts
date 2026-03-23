/**
 * Limites por plano — deve espelhar as regras de negócio da spec.
 * Usados para validação server-side antes de criar recursos.
 */
export const PLAN_LIMITS = {
  free: {
    accounts: 3,
    workspaces: 1,
    members: 1,
    creditCards: 1,
  },
  pro: {
    accounts: 10,
    workspaces: 3,
    members: 5,
    creditCards: 5,
  },
  family: {
    accounts: Infinity,
    workspaces: 10,
    members: 10,
    creditCards: Infinity,
  },
} as const

export type WorkspacePlan = keyof typeof PLAN_LIMITS

export function getPlanLimit(
  plan: WorkspacePlan,
  resource: keyof (typeof PLAN_LIMITS)[WorkspacePlan],
): number {
  return PLAN_LIMITS[plan][resource]
}
