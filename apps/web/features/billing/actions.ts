'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// ─── Checkout ────────────────────────────────────────────────────────────────

export async function createCheckoutSession(
  workspaceId: string,
  workspaceSlug: string,
  priceId: string
): Promise<never> {
  const supabase = await createServerClient();

  // Buscar workspace
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('stripe_customer_id, name')
    .eq('id', workspaceId)
    .single();

  if (error || !workspace) {
    redirect(`/${workspaceSlug}/billing?error=workspace_not_found`);
  }

  // Buscar email do usuário autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let customerId = workspace.stripe_customer_id;

  // Criar customer Stripe se ainda não existe
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email,
      name: workspace.name,
      metadata: { workspace_id: workspaceId },
    });
    customerId = customer.id;

    // Salvar customer_id imediatamente
    await supabase
      .from('workspaces')
      .update({ stripe_customer_id: customerId })
      .eq('id', workspaceId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/${workspaceSlug}/billing?success=1`,
    cancel_url: `${APP_URL}/${workspaceSlug}/billing?canceled=1`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { workspace_id: workspaceId },
      trial_period_days: 0, // trial já é gerenciado pelo nosso DB
    },
    billing_address_collection: 'auto',
    locale: 'pt-BR',
  });

  redirect(session.url!);
}

// ─── Billing Portal ───────────────────────────────────────────────────────────

export async function createPortalSession(
  workspaceId: string,
  workspaceSlug: string
): Promise<never> {
  const supabase = await createServerClient();

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('stripe_customer_id')
    .eq('id', workspaceId)
    .single();

  if (error || !workspace?.stripe_customer_id) {
    redirect(`/${workspaceSlug}/billing?error=no_customer`);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripe_customer_id,
    return_url: `${APP_URL}/${workspaceSlug}/billing`,
  });

  redirect(session.url);
}

// ─── Sync de status (usado internamente pelo webhook) ─────────────────────────

export async function syncSubscriptionStatus(
  workspaceId: string,
  updates: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    plan?: 'free' | 'pro';
  }
) {
  const supabase = await createServerClient();

  const payload: Record<string, string> = {};
  if (updates.stripeCustomerId) payload.stripe_customer_id = updates.stripeCustomerId;
  if (updates.stripeSubscriptionId) payload.stripe_subscription_id = updates.stripeSubscriptionId;
  if (updates.subscriptionStatus) payload.subscription_status = updates.subscriptionStatus;
  if (updates.plan) payload.plan = updates.plan;

  await supabase.from('workspaces').update(payload).eq('id', workspaceId);

  revalidatePath(`/[workspace]/billing`, 'page');
}
