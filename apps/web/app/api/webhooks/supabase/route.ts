import { NextResponse } from 'next/server'

/**
 * Webhook receiver para eventos do Supabase.
 * Configurar no painel do Supabase: Database → Webhooks.
 * Verificar assinatura HMAC antes de processar.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const { type, table, record, old_record } = payload

    // TODO: Verificar assinatura HMAC do Supabase
    // const signature = request.headers.get('x-supabase-webhook-signature')
    // if (!verifySignature(signature, await request.text())) return new Response('Unauthorized', { status: 401 })

    console.log(`[Webhook] ${type} on ${table}`, { record, old_record })

    // Processar eventos conforme necessário
    // Ex: enviar notificações, sincronizar dados externos, etc.

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
