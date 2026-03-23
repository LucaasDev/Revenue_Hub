import { notFound } from 'next/navigation';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { getWorkspaceBillingInfo } from '@/features/billing/queries';
import { BillingStatusBadge } from '@/features/billing/components/BillingStatusBadge';
import { PricingCard } from '@/features/billing/components/PricingCard';
import { ManageSubscriptionButton } from '@/features/billing/components/ManageSubscriptionButton';
import { createServerClient } from '@/lib/supabase/server';
import { STRIPE_PRICES } from '@/lib/stripe';

interface BillingPageProps {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{
    reason?: string;
    success?: string;
    canceled?: string;
    error?: string;
  }>;
}

const REASON_MESSAGES: Record<string, { title: string; description: string }> = {
  trial_expired: {
    title: 'Seu período gratuito terminou',
    description:
      'Para continuar usando o Revenue Hub, assine o plano Pro. Todos os seus dados estão preservados.',
  },
  past_due: {
    title: 'Pagamento pendente',
    description:
      'Houve um problema com seu último pagamento. Atualize seu método de pagamento para restaurar o acesso.',
  },
  canceled: {
    title: 'Assinatura cancelada',
    description:
      'Sua assinatura foi cancelada. Assine novamente para retomar o acesso.',
  },
};

export default async function BillingPage({
  params,
  searchParams,
}: BillingPageProps) {
  const { workspace: workspaceSlug } = await params;
  const { reason, success, canceled, error } = await searchParams;

  // Buscar workspace ID
  const supabase = await createServerClient();
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', workspaceSlug)
    .single();

  if (!workspace) notFound();

  const billingInfo = await getWorkspaceBillingInfo(workspace.id);
  if (!billingInfo) notFound();

  const reasonInfo = reason ? REASON_MESSAGES[reason] : null;
  const isManageable = billingInfo.isActive || billingInfo.isPastDue;

  // Dias de trial como porcentagem (de 20 dias)
  const trialProgressPct =
    billingInfo.isTrialing && billingInfo.trialDaysLeft !== null
      ? Math.round(((20 - billingInfo.trialDaysLeft) / 20) * 100)
      : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* ── Notificações de contexto ── */}
      {success && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-800">Assinatura ativada!</p>
            <p className="mt-0.5 text-sm text-emerald-700">
              Bem-vindo ao Revenue Hub Pro. Aproveite todos os recursos sem limites.
            </p>
          </div>
        </div>
      )}

      {canceled && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">Checkout cancelado</p>
            <p className="mt-0.5 text-sm text-amber-700">
              Nenhuma cobrança foi realizada. Você pode assinar quando quiser.
            </p>
          </div>
        </div>
      )}

      {reasonInfo && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">{reasonInfo.title}</p>
            <p className="mt-0.5 text-sm text-red-700">{reasonInfo.description}</p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Plano & Cobrança</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie sua assinatura e método de pagamento.
        </p>
      </div>

      {/* ── Status atual ── */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">Status atual</p>
            <BillingStatusBadge
              status={billingInfo.subscriptionStatus}
              plan={billingInfo.plan}
            />
          </div>
          {isManageable && (
            <ManageSubscriptionButton
              workspaceId={workspace.id}
              workspaceSlug={workspaceSlug}
            />
          )}
        </div>

        {/* Trial progress */}
        {billingInfo.isTrialing && trialProgressPct !== null && (
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-gray-600">Período gratuito</span>
              <span className="font-medium text-gray-800">
                {billingInfo.trialDaysLeft === 0
                  ? 'Último dia!'
                  : `${billingInfo.trialDaysLeft} dias restantes`}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${
                  (billingInfo.trialDaysLeft ?? 0) <= 3
                    ? 'bg-red-500'
                    : (billingInfo.trialDaysLeft ?? 0) <= 7
                    ? 'bg-orange-400'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${trialProgressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Pricing Cards (só mostrar se não estiver ativo) ── */}
      {!billingInfo.isActive && (
        <>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Escolha seu plano
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <PricingCard
              workspaceId={workspace.id}
              workspaceSlug={workspaceSlug}
              priceId={STRIPE_PRICES.PRO_MONTHLY}
              interval="month"
              amount={1999}
            />
            <PricingCard
              workspaceId={workspace.id}
              workspaceSlug={workspaceSlug}
              priceId={STRIPE_PRICES.PRO_ANNUAL}
              interval="year"
              amount={20390}
              monthlyEquivalent={1699}
              savings={15}
            />
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            Pagamento seguro via Stripe · Cancele quando quiser · Sem multas
          </p>
        </>
      )}

      {/* ── FAQ simplificado ── */}
      <div className="mt-10 rounded-2xl border border-gray-100 bg-gray-50 p-6">
        <h3 className="mb-4 font-semibold text-gray-800">Perguntas frequentes</h3>
        <dl className="space-y-4 text-sm">
          {[
            {
              q: 'Posso cancelar quando quiser?',
              a: 'Sim, sem fidelidade. Você cancela pelo portal de cobrança e mantém o acesso até o fim do período pago.',
            },
            {
              q: 'O modo família tem custo extra?',
              a: 'Não. Adicionar até 5 membros ao workspace está incluso no plano Pro.',
            },
            {
              q: 'Meus dados ficam seguros após o cancelamento?',
              a: 'Sim. Seus dados são preservados por 30 dias após o cancelamento.',
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <dt className="font-medium text-gray-700">{q}</dt>
              <dd className="mt-1 text-gray-500">{a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
