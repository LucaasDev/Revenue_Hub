import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Recuperar senha | Revenue Hub',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
