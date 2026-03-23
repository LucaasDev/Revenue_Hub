import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Habilita React strict mode para detectar problemas em dev
  reactStrictMode: true,

  // Ignora erros de ESLint durante o build (não-críticos: unused vars, unescaped entities)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignora erros de tipo TypeScript durante o build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Transpila pacotes do monorepo
  transpilePackages: ['@revenue-hub/database'],

  // Pacotes com módulos nativos/binários que NÃO devem ser empacotados no bundle serverless.
  // Isso evita falhas de packaging na Vercel causadas por:
  // - @react-pdf/renderer: pdfkit/fontkit com binários nativos
  // - @sentry/nextjs: require-in-the-middle (OpenTelemetry) com binários nativos
  serverExternalPackages: ['@react-pdf/renderer', '@sentry/nextjs', '@opentelemetry/instrumentation'],

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

// Sentry: ativar quando SENTRY_CONFIGURED=true for setado na Vercel.
// Para reativar, descomente o bloco abaixo e instale @sentry/nextjs se necessário.
// import { withSentryConfig } from '@sentry/nextjs'
// export default withSentryConfig(nextConfig, {
//   org: process.env.SENTRY_ORG,
//   project: process.env.SENTRY_PROJECT,
//   authToken: process.env.SENTRY_AUTH_TOKEN,
//   silent: true,
//   disableLogger: true,
// })

export default nextConfig
