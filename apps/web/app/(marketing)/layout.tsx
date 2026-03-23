import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Revenue Hub — Controle financeiro que você vai usar de verdade',
  description:
    'Revenue Hub reúne contas, cartões, metas e orçamentos em um só lugar. Simples, visual e feito para o Brasil. Comece grátis por 20 dias.',
  openGraph: {
    title: 'Revenue Hub — Controle financeiro pessoal',
    description:
      'Gerencie suas finanças com clareza. Trial gratuito de 20 dias, sem cartão de crédito.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
