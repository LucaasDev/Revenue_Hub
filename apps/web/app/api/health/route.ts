import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Health check endpoint — público, sem autenticação.
 * Usado pelo Vercel, uptime monitors, etc.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: process.env.npm_package_version ?? '0.1.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
}
