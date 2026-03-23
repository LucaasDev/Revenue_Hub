import type { Metadata } from 'next'
import { SignupForm } from '@/features/auth/components/SignupForm'

export const metadata: Metadata = {
  title: 'Criar conta | Revenue Hub',
}

export default function SignupPage() {
  return <SignupForm />
}
