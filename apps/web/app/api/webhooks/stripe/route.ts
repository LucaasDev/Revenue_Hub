import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs'; // webhook precisa de raw body — não usar edge

async function getWorkspaceIdFromMetadata(
  metadata: Record<string, string | null>
): Promise<string | null> {
  return metadata?.workspace_id ?? null;
}

async function updateWorkspace(
  workspaceId: string,
  data: Record<string, string | null>
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('workspaces')
    .update(data)
    .eq('id', workspaceId);
  if (error) {
    console.error('[webhook] updateWorkspace error:', error);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text(); // IMPORTANTE: raw text para verificar assinatura
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Checkout concluído ─────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = await getWorkspaceIdFromMetadata(
          session.metadata as Record<string, string>
        );
        if (!workspaceId) break;

        // Buscar subscription para obter status atual
        let subscriptionId: string | null = null;
        if (typeof session.subscription === 'string') {
          subscriptionId = session.subscription;
        }

        await updateWorkspace(workspaceId, {
          stripe_customer_id: (session.customer as string) ?? null,
          stripe_subscription_id: subscriptionId,
          subscription_status: 'active',
          plan: 'pro',
        });
        break;
      }

      // ── Subscription atualizada ────────────────────────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = await getWorkspaceIdFromMetadata(
          sub.metadata as Record<string, string>
        );
        if (!workspaceId) break;

        const status = sub.status; // active | past_due | canceled | ...
        const plan = status === 'active' || status === 'past_due' ? 'pro' : 'free';

        await updateWorkspace(workspaceId, {
          subscription_status: status,
          plan,
          stripe_subscription_id: sub.id,
        });
        break;
      }

      // ── Subscription deletada / cancelada ──────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = await getWorkspaceIdFromMetadata(
          sub.metadata as Record<string, string>
        );
        if (!workspaceId) break;

        await updateWorkspace(workspaceId, {
          subscription_status: 'canceled',
          plan: 'free',
        });
        break;
      }

      // ── Pagamento de invoice bem-sucedido ──────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Buscar workspace_id via subscription metadata
        if (typeof invoice.subscription === 'string') {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          const workspaceId = await getWorkspaceIdFromMetadata(
            sub.metadata as Record<string, string>
          );
          if (workspaceId) {
            await updateWorkspace(workspaceId, {
              subscription_status: 'active',
              plan: 'pro',
            });
          }
        }
        break;
      }

      // ── Pagamento de invoice falhou ────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (typeof invoice.subscription === 'string') {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          const workspaceId = await getWorkspaceIdFromMetadata(
            sub.metadata as Record<string, string>
          );
          if (workspaceId) {
            await updateWorkspace(workspaceId, {
              subscription_status: 'past_due',
            });
          }
        }
        break;
      }

      default:
        // Evento não tratado — ignorar silenciosamente
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error processing event ${event.type}:`, err);
    // Retornar 200 mesmo em erros de negócio para evitar retentativas do Stripe
  }

  return NextResponse.json({ received: true });
}
