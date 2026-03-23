import type { SubscriptionStatus } from '../queries';

interface BillingStatusBadgeProps {
  status: SubscriptionStatus;
  plan: 'free' | 'pro';
}

const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { label: string; className: string }
> = {
  trialing: {
    label: 'Trial gratuito',
    className: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  },
  active: {
    label: 'Pro ativo',
    className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  },
  past_due: {
    label: 'Pagamento pendente',
    className: 'bg-red-100 text-red-700 border border-red-200',
  },
  canceled: {
    label: 'Cancelado',
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
  incomplete: {
    label: 'Incompleto',
    className: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
  paused: {
    label: 'Pausado',
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
};

export function BillingStatusBadge({ status }: BillingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.canceled;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${config.className}`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          status === 'active'
            ? 'bg-emerald-500'
            : status === 'trialing'
            ? 'bg-indigo-500'
            : status === 'past_due'
            ? 'bg-red-500'
            : 'bg-gray-400'
        }`}
      />
      {config.label}
    </span>
  );
}
