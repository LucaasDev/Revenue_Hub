# SPEC — Fase 4: Monetização & Landing Page
**Revenue Hub** | Status: planejamento → implementação

---

## 0. Contexto e Decisões de Produto

### Plano único
- **Revenue Hub Pro** — único plano pago
  - Mensal: **R$ 19,99/mês**
  - Anual: **R$ 203,90/ano** (equivale a R$ 16,99/mês — 15% de desconto)
- Modo **Family** (até 5 membros no workspace) é **feature inclusa no Pro**, não um plano separado
- Plano **Free** = trial de 20 dias com acesso total; após vencimento, acesso bloqueado até inserir pagamento

### Stripe IDs (livemode — conta "Revenue")
| Recurso | ID |
|---|---|
| Produto | `prod_UCKk4hgGgFQwN3` |
| Price Mensal | `price_1TDwF2KnoHqEIp5vUMQHzkZ5` |
| Price Anual | `price_1TDwF5KnoHqEIp5vi3ZJwWjk` |

### Trial
- **20 dias** contados a partir da criação do workspace
- Campo `trial_ends_at` em `workspaces` (já existe na migration 003)
- Acesso completo durante o trial; sem necessidade de cartão para começar
- Ao expirar → middleware redireciona para `/billing`

---

## 1. Scope da Fase 4

| Sprint | Módulo | Descrição |
|---|---|---|
| 4.1 | **Trial & Enforcement** | Middleware que bloqueia acesso após trial; TrialBanner no app |
| 4.2 | **Checkout Flow** | Stripe Checkout Session server action; página `/billing` |
| 4.3 | **Webhooks** | Handler `/api/webhooks/stripe`; sincroniza status no DB |
| 4.4 | **Billing Portal** | Portal Stripe para gerenciar assinatura; página de conta |
| 4.5 | **Landing Page** | One-page pública em `/` (fora do app router group) |

---

## 2. Banco de Dados (Supabase)

### 2.1 Nenhuma nova tabela necessária
A tabela `workspaces` já possui todos os campos necessários (migration 003):

```sql
stripe_customer_id       TEXT,
stripe_subscription_id   TEXT,
subscription_status      TEXT DEFAULT 'trialing',
trial_ends_at            TIMESTAMPTZ DEFAULT (now() + interval '20 days'),
plan                     workspace_plan DEFAULT 'free'
```

### 2.2 Migration 023 — índices e helper function

```sql
-- 023_billing_helpers.sql
CREATE INDEX IF NOT EXISTS idx_workspaces_trial_ends_at
  ON workspaces(trial_ends_at)
  WHERE subscription_status = 'trialing';

CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_customer
  ON workspaces(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Função helper: retorna true se workspace tem acesso ativo
CREATE OR REPLACE FUNCTION workspace_has_access(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ws workspaces%ROWTYPE;
BEGIN
  SELECT * INTO ws FROM workspaces WHERE id = ws_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  -- Assinatura ativa ou em trial válido
  IF ws.subscription_status = 'active' THEN RETURN TRUE; END IF;
  IF ws.subscription_status = 'trialing'
     AND ws.trial_ends_at > now() THEN RETURN TRUE; END IF;
  RETURN FALSE;
END;
$$;
```

---

## 3. Tipos TypeScript

### `packages/database/src/types.ts` (adições)
```ts
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
  trialEndsAt: string | null;       // ISO string
  trialDaysLeft: number | null;     // null se não em trial
  isTrialing: boolean;
  isActive: boolean;
  isPastDue: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}
```

---

## 4. Sprint 4.1 — Trial & Enforcement

### 4.1.1 `features/billing/queries.ts`

```ts
// getWorkspaceBillingInfo(workspaceId: string): Promise<WorkspaceBillingInfo>
// — lê workspaces.subscription_status, trial_ends_at, plan
// — calcula trialDaysLeft = ceil((trial_ends_at - now()) / 86400000)
// — isTrialing = status === 'trialing' && trial_ends_at > now()
// — isActive = status === 'active'
// — isPastDue = status === 'past_due'
```

### 4.1.2 Middleware `apps/web/middleware.ts`

Lógica de acesso:
```
request → matcher: /(app)/[workspace]/**

1. Checar auth (session Supabase) → se ausente → /login
2. Checar rota: se /billing → deixar passar (evita loop)
3. Ler workspaces WHERE slug = params.workspace
4. workspace_has_access(id)?
   → true  → next()
   → false → redirect /[workspace]/billing?reason=trial_expired
              ou /[workspace]/billing?reason=past_due
```

> **Nota**: o middleware não deve fazer chamadas pesadas ao DB em cada request. Usar cookie de sessão com claims ou cache de 60s no edge.
>
> Implementação leve: ler `subscription_status` e `trial_ends_at` da tabela `workspaces` via service role (edge-safe) + cache com `revalidate`.

### 4.1.3 `TrialBanner` component

```
apps/web/features/billing/components/TrialBanner.tsx
```

- Server Component (recebe `billingInfo` como prop)
- Mostra apenas se `isTrialing === true`
- Copy: `"Seu período gratuito termina em {N} dias. Assine o Pro para continuar."`
- CTA: `"Assinar agora →"` → `/[workspace]/billing`
- Cores: amber (>7 dias), orange (3–7 dias), red (<3 dias)
- Renderizado no `apps/web/app/(app)/[workspace]/layout.tsx` (acima do conteúdo)

---

## 5. Sprint 4.2 — Checkout Flow

### 5.1 Server Action `createCheckoutSession`

```ts
// features/billing/actions.ts
'use server'

export async function createCheckoutSession(
  workspaceId: string,
  priceId: string,           // monthly or annual
  returnPath: string         // ex: '/dashboard'
): Promise<{ url: string } | { error: string }>
```

Fluxo:
1. Buscar `stripe_customer_id` do workspace
2. Se não existe → `stripe.customers.create({ email, metadata: { workspace_id } })`
3. `stripe.checkout.sessions.create`:
   - `mode: 'subscription'`
   - `customer`: ID acima
   - `line_items`: `[{ price: priceId, quantity: 1 }]`
   - `success_url`: `${APP_URL}/[workspace]/billing?success=1`
   - `cancel_url`: `${APP_URL}/[workspace]/billing?canceled=1`
   - `subscription_data.metadata`: `{ workspace_id }`
   - `allow_promotion_codes: true`
4. Retornar `{ url: session.url }`

### 5.2 Página `/[workspace]/billing`

```
apps/web/app/(app)/[workspace]/billing/page.tsx
```

**Seções:**
1. **Status atual** — badge colorido (Trial / Ativo / Vencido / Cancelado)
2. **Trial countdown** — progress bar + dias restantes (só no trial)
3. **Pricing Cards** — dois cards lado a lado:
   - Card Mensal: R$ 19,99/mês — botão "Assinar Mensal"
   - Card Anual: R$ 203,90/ano · ~R$ 16,99/mês — badge "Economize 15%" — botão "Assinar Anual"
4. **Gerenciar assinatura** — botão "Acessar Portal de Cobrança" (visível só se `isActive || isPastDue`)
5. **Alerta past_due** — banner vermelho + CTA para resolver pagamento

**Props necessárias:**
- `searchParams.reason` → mostra mensagem contextual (trial_expired, past_due)
- `searchParams.success` → toast de sucesso
- `searchParams.canceled` → toast de cancelamento

### 5.3 `PricingCard` component

```
features/billing/components/PricingCard.tsx
```

- Client Component (precisa do form action para redirect)
- Props: `priceId`, `interval`, `amount`, `savings?`, `isCurrentPlan`
- Botão dispara `createCheckoutSession` → redirect para Stripe

---

## 6. Sprint 4.3 — Webhooks

### 6.1 Route Handler `apps/web/app/api/webhooks/stripe/route.ts`

```ts
// POST /api/webhooks/stripe
// Headers: stripe-signature
// Body: raw text (IMPORTANTE: não parsear com JSON.parse antes de verificar)
```

**Eventos tratados:**

| Evento Stripe | Ação no DB |
|---|---|
| `checkout.session.completed` | Salvar `stripe_customer_id`, `stripe_subscription_id`; `plan = 'pro'`; `subscription_status = 'active'` |
| `customer.subscription.updated` | Atualizar `subscription_status`, `plan` conforme `status` e `items.data[0].price.id` |
| `customer.subscription.deleted` | `subscription_status = 'canceled'`; `plan = 'free'` |
| `invoice.payment_succeeded` | `subscription_status = 'active'` (garante past_due → active) |
| `invoice.payment_failed` | `subscription_status = 'past_due'` |

**Identificação do workspace:**
- `checkout.session.completed` → `metadata.workspace_id`
- `customer.subscription.*` → `metadata.workspace_id` (passado em `subscription_data.metadata`)
- `invoice.*` → `subscription.metadata.workspace_id` (via expand)

**Verificação de assinatura:**
```ts
const sig = request.headers.get('stripe-signature')!;
const body = await request.text();  // IMPORTANTE: raw body
const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
```

**Resposta:** sempre `200 OK` com `{ received: true }` (mesmo em erros de negócio — evitar retentativas desnecessárias do Stripe).

### 6.2 Stripe client singleton

```ts
// packages/database/src/stripe.ts (ou apps/web/lib/stripe.ts)
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});
```

---

## 7. Sprint 4.4 — Billing Portal

### 7.1 Server Action `createPortalSession`

```ts
// features/billing/actions.ts
export async function createPortalSession(
  workspaceId: string,
  returnPath: string
): Promise<{ url: string } | { error: string }>
```

- Busca `stripe_customer_id` do workspace
- `stripe.billingPortal.sessions.create({ customer, return_url })`
- Retorna URL → redirect no client

### 7.2 Botão "Gerenciar Assinatura"

```
features/billing/components/ManageSubscriptionButton.tsx
```

- Client Component
- Chama `createPortalSession` → redirect para portal Stripe
- Loading state durante a chamada

---

## 8. Sprint 4.5 — Landing Page

### 8.1 Rota

```
apps/web/app/(marketing)/page.tsx           ← homepage pública "/"
apps/web/app/(marketing)/layout.tsx         ← layout marketing (sem sidebar)
```

O grupo `(marketing)` coexiste com o grupo `(app)` no App Router.

### 8.2 Estrutura da página (one-page)

```
<LandingPage>
  <Navbar />          ← logo + "Entrar" + "Começar grátis"
  <HeroSection />     ← headline + subheadline + CTA + mockup/screenshot
  <FeaturesSection /> ← 6 feature cards (ícones + título + descrição)
  <HowItWorksSection />  ← 3 passos numerados
  <PricingSection />  ← card mensal + card anual com toggle + FAQ
  <TestimonialsSection /> ← 3 depoimentos placeholder
  <CtaSection />      ← CTA final "Comece seu trial de 20 dias grátis"
  <Footer />          ← links + copyright
</LandingPage>
```

### 8.3 Conteúdo — Copy

**Headline:** `Controle financeiro que você vai usar de verdade.`
**Subheadline:** `Revenue Hub reúne contas, cartões, metas e orçamentos em um só lugar. Simples, visual e feito para o Brasil.`
**CTA primário:** `Começar grátis por 20 dias →`
**CTA secundário:** `Ver demonstração`

**Features (6 cards):**
1. 💳 **Cartões de crédito** — Gerencie faturas, parcelas e limites com clareza total
2. 📊 **Orçamentos inteligentes** — Defina limites por categoria e receba alertas em tempo real
3. 🎯 **Metas financeiras** — Acompanhe seu progresso com visualizações motivadoras
4. 📈 **Relatórios profissionais** — DRE, fluxo de caixa e patrimônio líquido exportáveis
5. 👨‍👩‍👧 **Modo família** — Compartilhe o workspace com até 5 pessoas (incluso no Pro)
6. 🔒 **Seus dados, só seus** — Infraestrutura Supabase com RLS — zero acesso não autorizado

**How it works (3 passos):**
1. **Crie sua conta** — Cadastro em 30 segundos, sem cartão de crédito
2. **Conecte suas contas** — Adicione bancos, carteiras e cartões manualmente ou por importação
3. **Tome o controle** — Visualize, categorize, planeje e exporte seus dados financeiros

**Pricing toggle:** Mensal / Anual (com badge "Economize 15%")

**FAQ (5 perguntas):**
- O trial realmente é gratuito? Sim, 20 dias com acesso completo, sem cartão.
- Posso cancelar quando quiser? Sim, sem multas e sem burocracia.
- O modo família tem custo extra? Não, está incluso no plano Pro.
- Meus dados ficam seguros? Sim — cada usuário vê apenas seus próprios dados (RLS).
- Há suporte disponível? Sim, por e-mail com resposta em até 24h úteis.

### 8.4 Design

- **Paleta:** indigo-600 como cor primária (consistente com o app)
- **Tipografia:** Inter (já carregada via next/font)
- **Componentes:** Tailwind CSS puro (sem dependência extra de UI)
- **Animações:** `@keyframes fadeInUp` CSS puro — sem Framer Motion
- **Imagens:** SVG inline ou `next/image` com screenshots do app (placeholder inicialmente)
- **Dark mode:** não (landing é sempre light)
- **Mobile:** totalmente responsivo (stacks em 1 coluna no mobile)

---

## 9. Fluxo Completo do Usuário

```
[Landing Page /]
     ↓ "Começar grátis"
[/register] → cria user + workspace (trial_ends_at = now+20d)
     ↓
[/[workspace]/dashboard] ← TrialBanner aparece
     ↓ (20 dias depois)
[Middleware bloqueia] → redirect /[workspace]/billing?reason=trial_expired
     ↓ usuário escolhe plano
[Stripe Checkout]
     ↓ sucesso
[/[workspace]/billing?success=1] ← webhook já atualizou DB
     ↓
[/[workspace]/dashboard] ← TrialBanner desaparece, status = Pro ativo
```

---

## 10. Variáveis de Ambiente

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...            # configurar após criar endpoint no Dashboard
STRIPE_PRO_MONTHLY_PRICE_ID=price_1TDwF2KnoHqEIp5vUMQHzkZ5
STRIPE_PRO_ANNUAL_PRICE_ID=price_1TDwF5KnoHqEIp5vi3ZJwWjk

# App URL (necessário para success_url / cancel_url do Checkout)
NEXT_PUBLIC_APP_URL=https://app.revenuehub.com.br   # ou http://localhost:3000 em dev
```

---

## 11. Dependências a Instalar

```bash
# apps/web
pnpm add stripe                # Stripe SDK server-side
pnpm add @stripe/stripe-js     # Stripe.js client (se usar Elements futuramente)
```

---

## 12. Estrutura de Arquivos — Fase 4

```
apps/web/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx              ← layout público (sem sidebar)
│   │   └── page.tsx                ← Landing Page completa
│   ├── (app)/
│   │   └── [workspace]/
│   │       └── billing/
│   │           └── page.tsx        ← página de billing no app
│   └── api/
│       └── webhooks/
│           └── stripe/
│               └── route.ts        ← webhook handler
├── features/
│   └── billing/
│       ├── queries.ts              ← getWorkspaceBillingInfo
│       ├── actions.ts              ← createCheckoutSession, createPortalSession
│       └── components/
│           ├── TrialBanner.tsx     ← banner de trial no layout do app
│           ├── PricingCard.tsx     ← card de plano (billing page)
│           ├── ManageSubscriptionButton.tsx
│           └── BillingStatusBadge.tsx
├── lib/
│   └── stripe.ts                   ← singleton do Stripe SDK
└── middleware.ts                   ← enforcement de acesso
```

---

## 13. Sprint Backlog

### Sprint 4.1 — Base (2 dias)
- [ ] Instalar `stripe` via pnpm
- [ ] `lib/stripe.ts` — singleton
- [ ] `023_billing_helpers.sql` — migration (índices + função helper)
- [ ] `features/billing/queries.ts` — `getWorkspaceBillingInfo`
- [ ] `middleware.ts` — enforcement trial/subscription
- [ ] `TrialBanner.tsx` — banner contextual no layout
- [ ] Integrar TrialBanner no `[workspace]/layout.tsx`

### Sprint 4.2 — Checkout (1 dia)
- [ ] `features/billing/actions.ts` — `createCheckoutSession`
- [ ] `features/billing/components/PricingCard.tsx`
- [ ] `app/(app)/[workspace]/billing/page.tsx`

### Sprint 4.3 — Webhooks (1 dia)
- [ ] `app/api/webhooks/stripe/route.ts` — handler completo
- [ ] Registrar endpoint no Dashboard Stripe
- [ ] Testar localmente via `stripe listen`

### Sprint 4.4 — Portal (0,5 dia)
- [ ] `createPortalSession` action
- [ ] `ManageSubscriptionButton.tsx`
- [ ] Integrar na página de billing

### Sprint 4.5 — Landing Page (2 dias)
- [ ] `app/(marketing)/layout.tsx`
- [ ] `app/(marketing)/page.tsx` — all sections
- [ ] SEO: `metadata` (title, description, og:image)
- [ ] Responsivo mobile
- [ ] Teste visual nas principais resoluções
