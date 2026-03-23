'use client';

import { useState } from 'react';
import { Check, Loader2, Star } from 'lucide-react';
import { createCheckoutSession } from '../actions';

interface PricingCardProps {
  workspaceId: string;
  workspaceSlug: string;
  priceId: string;
  interval: 'month' | 'year';
  amount: number;           // em centavos
  monthlyEquivalent?: number; // em centavos, para exibição
  savings?: number;          // percentual de desconto (ex: 15)
  isCurrentPlan?: boolean;
}

const FEATURES = [
  'Contas e carteiras ilimitadas',
  'Cartões de crédito e faturas',
  'Orçamentos por categoria',
  'Metas financeiras',
  'Relatórios: DRE, Fluxo e Patrimônio',
  'Exportação PDF e CSV',
  'Modo família (até 5 membros)',
  'Suporte por e-mail',
];

export function PricingCard({
  workspaceId,
  workspaceSlug,
  priceId,
  interval,
  amount,
  monthlyEquivalent,
  savings,
  isCurrentPlan = false,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);

  const formattedAmount = (amount / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const formattedMonthly =
    monthlyEquivalent !== undefined
      ? (monthlyEquivalent / 100).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })
      : null;

  async function handleSubscribe() {
    setLoading(true);
    await createCheckoutSession(workspaceId, workspaceSlug, priceId);
    // redirect acontece dentro da action — loader persiste até navegação
  }

  const isAnnual = interval === 'year';

  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 p-6 ${
        isAnnual
          ? 'border-indigo-500 bg-indigo-50 shadow-lg'
          : 'border-gray-200 bg-white'
      }`}
    >
      {isAnnual && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
            <Star className="h-3 w-3 fill-current" />
            Mais popular
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Revenue Hub Pro
          {isAnnual ? ' — Anual' : ' — Mensal'}
        </h3>
        {savings && (
          <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            Economize {savings}%
          </span>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-extrabold text-gray-900">
            {formattedAmount}
          </span>
          <span className="mb-1 text-sm text-gray-500">
            /{interval === 'month' ? 'mês' : 'ano'}
          </span>
        </div>
        {formattedMonthly && (
          <p className="mt-1 text-sm text-gray-500">
            equivale a {formattedMonthly}/mês
          </p>
        )}
      </div>

      <ul className="mb-8 flex-1 space-y-2.5">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check
              className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                isAnnual ? 'text-indigo-600' : 'text-emerald-500'
              }`}
            />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {isCurrentPlan ? (
        <button
          disabled
          className="w-full cursor-default rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-400"
        >
          Plano atual
        </button>
      ) : (
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
            isAnnual
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70'
              : 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 disabled:opacity-70'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecionando…
            </>
          ) : (
            `Assinar ${isAnnual ? 'anual' : 'mensal'}`
          )}
        </button>
      )}
    </div>
  );
}
