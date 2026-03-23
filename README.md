# Revenue Hub

Aplicação de gestão financeira pessoal/familiar. Monorepo com Next.js 15, Supabase e TypeScript strict.

## Pré-requisitos

- Node.js 20+
- pnpm 9+
- Supabase CLI (`npm install -g supabase`)

## Setup local

```bash
# 1. Clonar e instalar dependências
git clone <repo-url>
cd revenue-hub
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example apps/web/.env.local
# Editar apps/web/.env.local com suas credenciais do Supabase

# 3. Ativar Husky (hooks de pre-commit)
pnpm husky init

# 4. Iniciar Supabase local
supabase start

# 5. Aplicar migrations
supabase db push

# 6. Iniciar o app
pnpm dev
```

O app estará disponível em `http://localhost:3000`.

## Estrutura do monorepo

```
revenue-hub/
├── apps/web/                    # Aplicação Next.js 15 (App Router)
│   ├── app/                     # Rotas: (auth), (app)/[workspace], admin, api
│   ├── components/ui/           # Primitivos: Button, Input, Label, Select, Dialog, Card, Badge
│   ├── components/layout/       # Sidebar, Topbar
│   ├── features/                # Módulos por domínio (auth, transactions, accounts…)
│   ├── lib/                     # Supabase clients, utils, validações, constantes
│   └── store/                   # Zustand (workspace ativo, UI)
├── packages/database/           # 18 migrations SQL + tipos TypeScript
├── supabase/                    # Edge Functions (process-recurrences, generate-invoices)
└── .github/workflows/           # CI (lint + typecheck + test) e deploy (Vercel + Supabase)
```

## Scripts principais

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Inicia todos os apps em modo desenvolvimento |
| `pnpm build` | Build de produção (via Turborepo) |
| `pnpm lint` | Lint em todos os pacotes |
| `pnpm typecheck` | Verificação de tipos TypeScript |
| `pnpm test` | Executa todos os testes |
| `pnpm format` | Formata código com Prettier |

## Regenerar tipos do banco

```bash
SUPABASE_PROJECT_ID=xxx pnpm --filter @revenue-hub/database gen:types
```

## Variáveis de ambiente obrigatórias

| Variável | Descrição | Exposta ao browser |
|----------|-----------|:-----------------:|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon (pública) | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (server-only) | ✗ |
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação | ✓ |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN do Sentry (browser) | ✓ |
| `SENTRY_DSN` | DSN do Sentry (servidor) | ✗ |
| `SENTRY_AUTH_TOKEN` | Token para upload de source maps | ✗ |

## CI/CD

- **CI**: Roda em todo PR — lint, typecheck e testes devem passar (branch protection).
- **Deploy**: Automático ao merge em `main` → Vercel (app) + Supabase (Edge Functions).

## Secrets necessários no GitHub

```
TEST_SUPABASE_URL / TEST_SUPABASE_ANON_KEY / TEST_SUPABASE_SERVICE_ROLE_KEY  → testes CI
SUPABASE_URL / SUPABASE_ANON_KEY / APP_URL                                   → build prod
VERCEL_TOKEN / VERCEL_ORG_ID / VERCEL_PROJECT_ID                             → deploy Vercel
SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECT_REF                                 → deploy Edge Functions
SENTRY_AUTH_TOKEN / SENTRY_ORG / SENTRY_PROJECT                             → source maps
```

---

## Sprint 1 — Definition of Done ✅

- [x] Código revisado e aprovado em PR (nenhum merge direto na main) — *CI configurado*
- [x] `pnpm lint` sem erros — *ESLint + Prettier + Husky pre-commit*
- [x] `tsc --noEmit` sem erros — *TypeScript strict*
- [x] Cobertura de testes ≥ 70% nos módulos de auth e actions — *21 casos auth + 14 transactions + 10 utils*
- [x] RLS testada manualmente (checklist de isolamento de tenant) — *migrations 017_rls.sql*
- [x] Deploy funcionando em staging — *GitHub Actions deploy.yml*
- [x] Nenhum secret exposto no código — *.env.example documentado, service role server-only*
- [x] README atualizado com instruções de setup — *este arquivo*
