import type { NextConfig } from 'next'
// withSentryConfig é importado mas só ativado quando SENTRY_CONFIGURED=true estiver setado no Vercel
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  // Habilita React strict mode para detectar problemas em dev
  reactStrictMode: true,

  // Transpila pacotes do monorepo
  transpilePackages: ['@revenue-hub/database'],

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Imagens permitidas (avatars do Supabase Storage)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth avatars
      },
    ],
  },
}

// Ativa o plugin webpack do Sentry somente quando SENTRY_CONFIGURED=true estiver setado no Vercel
// (após configurar org/project/authToken corretos no painel do Sentry)
export default process.env.SENTRY_CONFIGURED === 'true'
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      disableLogger: true,
      sourcemaps: { disable: false },
    })
  : nextConfig
