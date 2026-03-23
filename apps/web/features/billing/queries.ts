import { createServerClient } from '@/lib/supabase/server';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'paused';

export interface WorkspaceBillingInfo {
  plan: 'free' | 'pro';
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  isTrialing: boolean;
  isActive: boolean;
  isPastDue: boolean;
  hasAccess: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export async function getWorkspaceBillingInfo(
  workspaceId: string
): Promise<WorkspaceBillingInfo | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('workspaces')
    .select(
      'plan, subscription_status, trial_ends_at, stripe_customer_id, stripe_subscription_id'
    )
    .eq('id', workspaceId)
    .single();

  if (error || !data) return null;

  const status = (data.subscription_status ?? 'trialing') as SubscriptionStatus;
  const trialEndsAt = data.trial_ends_at ?? null;
  const now = new Date();

  const isTrialing =
    status === 'trialing' &&
    trialEndsAt !== null &&
    new Date(trialEndsAt) > now;

  const isActive = status === 'active';
  const isPastDue = status === 'past_due';

  // Dias restantes de trial (arredondado para cima)
  let trialDaysLeft: number | null = null;
  if (isTrialing && trialEndsAt) {
    const msLeft = new Date(trialEndsAt).getTime() - now.getTime();
    trialDaysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  }

  const hasAccess = isActive || isTrialing;

  return {
    plan: (data.plan ?? 'free') as 'free' | 'pro',
    subscriptionStatus: status,
    trialEndsAt,
    trialDaysLeft,
    isTrialing,
    isActive,
    isPastDue,
    hasAccess,
    stripeCustomerId: data.stripe_customer_id ?? null,
    stripeSubscriptionId: data.stripe_subscription_id ?? null,
  };
}

/** Versão leve usada no middleware — lê apenas os campos necessários */
export async function getWorkspaceAccessStatus(workspaceSlug: string): Promise<{
  hasAccess: boolean;
  reason: 'trial_expired' | 'past_due' | 'canceled' | null;
  workspaceId: string | null;
}> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('workspaces')
    .select('id, subscription_status, trial_ends_at')
    .eq('slug', workspaceSlug)
    .single();

  if (error || !data) {
    return { hasAccess: false, reason: null, workspaceId: null };
  }

  const status = (data.subscription_status ?? 'trialing') as SubscriptionStatus;
  const trialEndsAt = data.trial_ends_at;
  const now = new Date();

  if (status === 'active') {
    return { hasAccess: true, reason: null, workspaceId: data.id };
  }

  if (
    status === 'trialing' &&
    trialEndsAt &&
    new Date(trialEndsAt) > now
  ) {
    return { hasAccess: true, reason: null, workspaceId: data.id };
  }

  if (status === 'trialing' && (!trialEndsAt || new Date(trialEndsAt) <= now)) {
    return { hasAccess: false, reason: 'trial_expired', workspaceId: data.id };
  }

  if (status === 'past_due') {
    return { hasAccess: false, reason: 'past_due', workspaceId: data.id };
  }

  if (status === 'canceled') {
    return { hasAccess: false, reason: 'canceled', workspaceId: data.id };
  }

  return { hasAccess: false, reason: null, workspaceId: data.id };
}
