import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import type { WorkspaceBillingInfo } from '../queries';

interface TrialBannerProps {
  billingInfo: WorkspaceBillingInfo;
  workspaceSlug: string;
}

export function TrialBanner({ billingInfo, workspaceSlug }: TrialBannerProps) {
  if (!billingInfo.isTrialing) return null;

  const days = billingInfo.trialDaysLeft ?? 0;

  // Cor muda conforme urgência
  const colorClass =
    days <= 3
      ? 'bg-red-50 border-red-200 text-red-800'
      : days <= 7
      ? 'bg-orange-50 border-orange-200 text-orange-800'
      : 'bg-amber-50 border-amber-200 text-amber-800';

  const iconClass =
    days <= 3
      ? 'text-red-500'
      : days <= 7
      ? 'text-orange-500'
      : 'text-amber-500';

  const message =
    days === 0
      ? 'Seu período gratuito termina hoje!'
      : days === 1
      ? 'Seu período gratuito termina amanhã.'
      : `Seu período gratuito termina em ${days} dias.`;

  return (
    <div className={`border-b ${colorClass}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${iconClass}`} />
          <span className="text-sm font-medium">
            {message}{' '}
            <Link
              href={`/${workspaceSlug}/billing`}
              className="underline underline-offset-2 hover:opacity-80"
            >
              Assine o Pro para continuar →
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
