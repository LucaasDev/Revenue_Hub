import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock do next/navigation para testes
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/test-workspace/dashboard',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// Mock do next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock dos cookies do Next.js
vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set: vi.fn(),
  }),
}))
