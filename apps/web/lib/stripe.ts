import Stripe from 'stripe';

// Lazy singleton — não lança erro em build time, só em runtime quando usado
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });
  }
  return _stripe;
}

// Alias para compatibilidade com imports existentes
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string, unknown>)[prop as string];
  },
});

// Price IDs — livemode, conta "Revenue"
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
  PRO_ANNUAL: process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? '',
} as const;
