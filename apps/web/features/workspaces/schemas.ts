import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  currency_base: z.string().length(3, 'Moeda inválida').default('BRL'),
})

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currency_base: z.string().length(3).optional(),
  // slug e owner_id são imutáveis — não incluídos
})

export const inviteMemberSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'member']).default('member'),
})

export const updateMemberRoleSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(['admin', 'member']), // owner não pode ser atribuído via update
})

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
