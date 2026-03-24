import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  CreditCard,
  Target,
  PieChart,
  BarChart3,
  Users,
  ShieldCheck,
  Check,
  ArrowRight,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';

// ─── Dados ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: CreditCard,
    title: 'Cartões de crédito',
    description:
      'Gerencie faturas, parcelas e limites de todos os seus cartões com clareza total. Nunca mais seja surpreendido na fatura.',
  },
  {
    icon: PieChart,
    title: 'Orçamentos inteligentes',
    description:
      'Defina limites por categoria e receba alertas visuais em tempo real quando estiver se aproximando do limite.',
  },
  {
    icon: Target,
    title: 'Metas financeiras',
    description:
      'Crie metas para reserva de emergência, viagens, imóveis. Visualize seu progresso e saiba exatamente quando vai chegar lá.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios profissionais',
    description:
      'DRE, Fluxo de Caixa e Evolução do Patrimônio Líquido. Exporte em PDF ou CSV para usar onde quiser.',
  },
  {
    icon: Users,
    title: 'Modo família',
    description:
      'Compartilhe o workspace com até 5 pessoas. Cada membro vê apenas o que é seu, com controle de permissões.',
  },
  {
    icon: ShieldCheck,
    title: 'Seus dados, só seus',
    description:
      'Infraestrutura Supabase com Row Level Security. Nenhum outro usuário tem acesso aos seus dados — garantido a nível de banco.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Crie sua conta',
    description:
      'Cadastro em menos de 30 segundos. Sem cartão de crédito, sem compromisso.',
  },
  {
    number: '02',
    title: 'Conecte suas contas',
    description:
      'Adicione bancos, carteiras digitais e cartões. Importe transações ou registre manualmente.',
  },
  {
    number: '03',
    title: 'Tome o controle',
    description:
      'Categorize, planeje e acompanhe suas finanças com dashboards e relatórios em tempo real.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Ana Carolina M.',
    role: 'Desenvolvedora, São Paulo',
    text: 'Finalmente um app de finanças que não parece um sistema de contabilidade corporativo. Simples, bonito e funciona.',
  },
  {
    name: 'Roberto F.',
    role: 'Empreendedor, Belo Horizonte',
    text: 'Uso com toda a família. Cada um controla o próprio, mas eu tenho uma visão consolidada. Economizamos 20% no primeiro mês.',
  },
  {
    name: 'Mariana T.',
    role: 'Professora, Porto Alegre',
    text: 'Os relatórios de DRE me ajudaram a entender de verdade para onde vai meu dinheiro todo mês. Recomendo muito.',
  },
];

const FAQ = [
  {
    q: 'O trial realmente é gratuito?',
    a: 'Sim. 20 dias com acesso completo a todos os recursos, sem solicitar cartão de crédito. Se não gostar, é só não assinar.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim, sem multas e sem burocracia. Você cancela pelo portal de cobrança com um clique e mantém o acesso até o fim do período pago.',
  },
  {
    q: 'O modo família tem custo extra?',
    a: 'Não. Adicionar até 5 membros ao seu workspace está incluso no plano Pro, sem custo adicional.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Sim. Usamos Row Level Security (RLS) no banco de dados — nenhum outro usuário consegue acessar seus dados, mesmo que queira.',
  },
  {
    q: 'Há suporte disponível?',
    a: 'Sim, por e-mail com resposta em até 24h úteis. Para assinantes Pro, priorizamos o atendimento.',
  },
];

// ─── Componentes ────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">Revenue Hub</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
            Recursos
          </a>
          <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">
            Como funciona
          </a>
          <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">
            Preços
          </a>
          <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-gray-700 hover:text-gray-900 sm:block"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white pt-16 pb-24 sm:pt-24 sm:pb-32">
      {/* Background decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-100 opacity-50 blur-3xl" />
        <div className="absolute top-20 -left-20 h-64 w-64 rounded-full bg-purple-100 opacity-40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
          <span className="text-sm font-medium text-indigo-700">
            20 dias grátis · Sem cartão de crédito
          </span>
        </div>

        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Controle financeiro que você{' '}
          <span className="text-indigo-600">vai usar de verdade.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 sm:text-xl">
          Revenue Hub reúne contas, cartões, metas e orçamentos em um só lugar.
          Simples, visual e feito para o Brasil.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 sm:w-auto"
          >
            Começar grátis por 20 dias
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#how-it-works"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
          >
            Ver como funciona
          </a>
        </div>

        <p className="mt-4 text-sm text-gray-400">
          Sem cartão · Cancele quando quiser · Dados protegidos por RLS
        </p>

        {/* Dashboard mockup placeholder */}
        <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200">
          <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="ml-2 text-xs text-gray-400">Revenue Hub — Dashboard</span>
          </div>
          <div className="grid grid-cols-3 gap-4 p-6">
            {[
              { label: 'Saldo total', value: 'R$ 18.450', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Receitas (mês)', value: 'R$ 8.200', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Gastos (mês)', value: 'R$ 4.680', color: 'text-red-500', bg: 'bg-red-50' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-xl ${bg} p-4 text-left`}>
                <p className="mb-1 text-xs text-gray-500">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="mx-6 mb-6 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
            <div className="border-b border-gray-100 px-4 py-2.5">
              <span className="text-sm font-medium text-gray-700">Transações recentes</span>
            </div>
            {[
              { desc: 'Supermercado Extra', cat: 'Alimentação', value: '- R$ 312,50', color: 'text-red-500' },
              { desc: 'Salário', cat: 'Renda', value: '+ R$ 6.800,00', color: 'text-emerald-600' },
              { desc: 'Netflix', cat: 'Assinatura', value: '- R$ 44,90', color: 'text-red-500' },
            ].map(({ desc, cat, value, color }) => (
              <div key={desc} className="flex items-center justify-between px-4 py-2.5 text-sm odd:bg-white">
                <div>
                  <p className="font-medium text-gray-800">{desc}</p>
                  <p className="text-xs text-gray-400">{cat}</p>
                </div>
                <span className={`font-semibold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Tudo que você precisa, nada que você não precisa.
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-500">
            Construído para quem quer controle real sobre as próprias finanças,
            sem a complexidade de um ERP.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Comece em minutos, não em horas.
          </h2>
          <p className="text-lg text-gray-500">
            Sem configurações complexas. Sem planilhas para importar.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Linha conectora (desktop) */}
          <div
            aria-hidden
            className="absolute top-12 left-1/3 right-1/3 hidden h-0.5 bg-gradient-to-r from-indigo-200 to-indigo-300 md:block"
          />

          {STEPS.map(({ number, title, description }) => (
            <div key={number} className="relative text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
                <span className="text-2xl font-extrabold text-white">{number}</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="bg-white py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Um plano. Tudo incluso.
          </h2>
          <p className="text-lg text-gray-500">
            Sem surpresas. Sem funcionalidades bloqueadas. Sem planos "básico" que não servem para nada.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          {/* Card Mensal */}
          <div className="rounded-2xl border-2 border-gray-200 bg-white p-8">
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500">Pro Mensal</p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-5xl font-extrabold text-gray-900">R$&nbsp;19</span>
                <span className="mb-2 text-2xl font-bold text-gray-900">,99</span>
                <span className="mb-1 text-sm text-gray-500">/mês</span>
              </div>
            </div>

            <ul className="mb-8 space-y-3">
              {[
                'Contas e carteiras ilimitadas',
                'Cartões de crédito e faturas',
                'Orçamentos por categoria',
                'Metas financeiras',
                'Relatórios e exportações',
                'Modo família (5 membros)',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="block w-full rounded-xl border-2 border-indigo-600 py-3 text-center text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              Começar grátis
            </Link>
          </div>

          {/* Card Anual — destaque */}
          <div className="relative rounded-2xl border-2 border-indigo-500 bg-indigo-50 p-8 shadow-lg">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow">
                ⭐ Mais popular — 15% off
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-600">Pro Anual</p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-5xl font-extrabold text-gray-900">R$&nbsp;203</span>
                <span className="mb-2 text-2xl font-bold text-gray-900">,90</span>
                <span className="mb-1 text-sm text-gray-500">/ano</span>
              </div>
              <p className="mt-1 text-sm text-indigo-600 font-medium">
                Equivale a R$ 16,99/mês · Economize R$ 36/ano
              </p>
            </div>

            <ul className="mb-8 space-y-3">
              {[
                'Contas e carteiras ilimitadas',
                'Cartões de crédito e faturas',
                'Orçamentos por categoria',
                'Metas financeiras',
                'Relatórios e exportações',
                'Modo família (5 membros)',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Check className="h-4 w-4 flex-shrink-0 text-indigo-600" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="block w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
            >
              Começar grátis
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          20 dias de trial gratuito · Sem cartão · Cancele quando quiser
        </p>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
          Quem usa, recomenda.
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map(({ name, role, text }) => (
            <div
              key={name}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-amber-400">★</span>
                ))}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-gray-600">"{text}"</p>
              <div>
                <p className="font-semibold text-gray-900">{name}</p>
                <p className="text-xs text-gray-400">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="bg-white py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
          Perguntas frequentes
        </h2>

        <div className="divide-y divide-gray-100">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-gray-900 list-none">
                {q}
                <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="bg-indigo-600 py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
          Pronto para assumir o controle?
        </h2>
        <p className="mb-10 text-lg text-indigo-200">
          Comece seu trial gratuito de 20 dias hoje. Sem cartão, sem compromisso.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-10 py-4 text-base font-bold text-indigo-600 shadow-xl hover:bg-indigo-50"
        >
          Criar conta grátis
          <ArrowRight className="h-5 w-5" />
        </Link>
        <p className="mt-4 text-sm text-indigo-300">
          Já tem uma conta?{' '}
          <Link href="/login" className="underline hover:text-white">
            Entrar
          </Link>
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold text-gray-800">Revenue Hub</span>
        </div>

        <div className="flex gap-6 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-gray-900">
            Privacidade
          </Link>
          <Link href="/terms" className="hover:text-gray-900">
            Termos de uso
          </Link>
          <a href="mailto:suporte@revenuehub.com.br" className="hover:text-gray-900">
            Suporte
          </a>
        </div>

        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} Revenue Hub · Feito no Brasil
        </p>
      </div>
    </footer>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  // Redireciona usuários autenticados para o dashboard do workspace
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspaces(slug)')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle()

    const ws = membership?.workspaces as { slug: string } | null
    if (ws?.slug) redirect(`/${ws.slug}/dashboard`)
  }
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
