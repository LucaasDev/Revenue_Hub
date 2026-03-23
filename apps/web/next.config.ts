import type { NextConfig } from 'next'
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

export default withSentryConfig(nextConfig, {
  // Organização e projeto do Sentry (configurar nas env vars do Vercel)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload de source maps somente em produção
  silent: !process.env.CI,

  // Tree-shaking do SDK no browser
  disableLogger: true,

  // Esconde source maps do bundle final (servidos via Sentry)
  hideSourceMaps: true,

  // Não bloqueia o build se o upload de source maps falhar
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
})
