'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema, forgotPasswordSchema } from './schemas'
import type { ActionResult } from '@/lib/types/action'

/** Login com email e senha */
export async function login(formData: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return {
      ok: false,
      error:
        error.message === 'Invalid login credentials'
          ? 'Email ou senha inválidos'
          : error.message,
      code: 'UNAUTHENTICATED',
    }
  }

  return { ok: true, data: undefined }
}

/** Cadastro com email e senha */
export async function signup(formData: unknown): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })

  if (error) {
    return {
      ok: false,
      error:
        error.message.includes('already registered')
          ? 'Este email já está cadastrado'
          : error.message,
    }
  }

  return { ok: true, data: undefined }
}

/** Login via OAuth Google */
export async function loginWithGoogle(): Promise<ActionResult<{ url: string }>> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })

  if (error) return { ok: false, error: error.message }
  if (!data.url) return { ok: false, error: 'URL de redirecionamento não gerada' }

  return { ok: true, data: { url: data.url } }
}

/** Enviar email de recuperação de senha */
export async function forgotPassword(formData: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/reset-password`,
  })

  if (error) return { ok: false, error: error.message }

  return { ok: true, data: undefined }
}

/** Logout */
export async function logout(): Promise<void> {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
