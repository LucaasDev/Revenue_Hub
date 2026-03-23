# Revenue Hub — Especificação Técnica Fase 3

> Versão: 1.0 | Status: Para validação | Data: 2026-03-22
> Pré-requisito: Fase 2 concluída (Dashboard, Transações, Contas, Categorias, Cartões, Recorrências)

---

## Índice

1. [Escopo e Objetivos](#1-escopo-e-objetivos)
2. [Metas Financeiras (Goals)](#2-metas-financeiras-goals)
3. [Orçamentos por Categoria (Budgets)](#3-orçamentos-por-categoria-budgets)
4. [Relatórios (Reports)](#4-relatórios-reports)
5. [Exportação (Export)](#5-exportação-export)
6. [Migrations Fase 3](#6-migrations-fase-3)
7. [Arquitetura de Componentes](#7-arquitetura-de-componentes)
8. [Server Actions — Contratos Completos](#8-server-actions--contratos-completos)
9. [Estrutura de Pastas — Adições](#9-estrutura-de-pastas--adições)
10. [Backlog Técnico — Sprint 4](#10-backlog-técnico--sprint-4)

---

## 1. Escopo e Objetivos

A Fase 3 entrega as **features de planejamento e análise** do Revenue Hub. Ao final, o usuário consegue:

- Criar metas financeiras (poupança, quitação de dívida, viagem etc.) com acompanhamento visual de progresso
- Definir orçamentos mensais por categoria e ver o quanto já foi gasto vs. planejado
- Visualizar relatórios gerenciais: DRE mensal/anual, Fluxo de Caixa, Evolução do Patrimônio Líquido
- Exportar qualquer relatório em PDF formatado ou CSV bruto

### O que **não** é Fase 3

| Feature | Fase prevista |
|---------|:---:|
| Integração Open Finance / OFX import | Fase 4 |
| Multi-moeda automático (cotação em tempo real) | Fase 4 |
| App mobile (React Native) | Fase 5 |
| Planejamento de aposentadoria / projeções longas | Fase 5 |

### Princípios arquiteturais mantidos

- **Server-first**: queries em Server Components; mutações em Server Actions
- **RLS como última linha de defesa**: validações business-rule antes do banco
- **Zero client bundle desnecessário**: somente componentes interativos são Client Components
- **Geração de PDF no servidor**: usa `@react-pdf/renderer` em Route Handler (não no browser)

---

## 2. Metas Financeiras (Goals)

### 2.1 Modelo de dados

```
goals
  id               uuid PK default gen_random_uuid()
  workspace_id     uuid FK → workspaces.id
  name             text NOT NULL
  description      text
  type             text CHECK IN ('savings','debt_payoff','purchase','investment','emergency_fund','other')
  target_amount    numeric(15,2) NOT NULL CHECK > 0
  current_amount   numeric(15,2) NOT NULL DEFAULT 0
  target_date      date
  account_id       uuid FK → accounts.id nullable    -- conta vinculada (leitura de saldo)
  color            text
  icon             text
  is_completed     boolean DEFAULT false
  is_archived      boolean DEFAULT false
  sort_order       int DEFAULT 0
  created_at       timestamptz DEFAULT now()
  updated_at       timestamptz DEFAULT now()

goal_contributions
  id               uuid PK
  goal_id          uuid FK → goals.id
  workspace_id     uuid FK → workspaces.id
  amount           numeric(15,2) NOT NULL CHECK > 0
  note             text
  date             date NOT NULL DEFAULT current_date
  created_at       timestamptz DEFAULT now()
```

**RLS**: workspace_id deve pertencer ao workspace do usuário. Deleção de contributions é permitida apenas se a meta não estiver completed.

### 2.2 Layout da página

```
/[workspace]/goals

┌────────────────────────────────────────────────────────────┐
│  Metas Financeiras                              [+ Nova Meta]│
├─────────────────────┬──────────────────────────────────────┤
│  [Ativas] [Concl.]  │  Ordenar: Prazo | Progresso | Nome   │
├─────────────────────┴──────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🏖️ Viagem Europa         Prazo: Dez/2026            │   │
│  │  R$ 8.400 / R$ 15.000   ████████░░░░░░  56%         │   │
│  │  Faltam: R$ 6.600 · ~3 contribuições/mês para bater │   │
│  │                              [+ Contribuição] [···]  │   │
│  └──────────────────────────────────────────────────────┘   │
│  (cards repetidos para cada meta)                           │
└────────────────────────────────────────────────────────────┘
```

### 2.3 GoalCard — dados calculados no servidor

```typescript
// queries.ts
type GoalWithStats = Goal & {
  percentage: number           // current_amount / target_amount * 100
  remaining: number            // target_amount - current_amount
  monthsLeft: number | null    // diff em meses até target_date
  requiredMonthly: number | null // remaining / monthsLeft
  recentContributions: GoalContribution[]  // últimas 3
}
```

### 2.4 Fluxo de contribuição

1. Usuário clica em **+ Contribuição** no GoalCard
2. Abre `ContributionModal` (Dialog em md+, Drawer em mobile) com campos:
   - **Valor** (CurrencyInput, obrigatório > 0)
   - **Data** (DatePicker, default hoje)
   - **Nota** (texto livre, opcional)
3. Server Action `addGoalContribution`:
   - Insere em `goal_contributions`
   - Incrementa `goals.current_amount` atomicamente via `UPDATE goals SET current_amount = current_amount + :amount`
   - Se `current_amount >= target_amount`: SET `is_completed = true`
   - Revalida `/[workspace]/goals`
4. Remoção de contribuição: decrementa `current_amount`, desmarca `is_completed` se voltou abaixo

### 2.5 Vinculação com conta

Se `account_id` estiver preenchido, o GoalCard exibe o saldo atual da conta como **informação de contexto** (não sincroniza automaticamente — o usuário decide quando registrar contribuições). Isso serve para metas do tipo "Reserva de emergência = saldo da minha conta poupança".

### 2.6 Schemas Zod

```typescript
// features/goals/schemas.ts

export const createGoalSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(['savings','debt_payoff','purchase','investment','emergency_fund','other']),
  target_amount: z.number().positive(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  account_id: z.string().uuid().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{3,6}$/).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
})

export const updateGoalSchema = createGoalSchema.partial().extend({
  id: z.string().uuid(),
  sort_order: z.number().int().optional(),
})

export const addContributionSchema = z.object({
  goal_id: z.string().uuid(),
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(200).optional().nullable(),
})
```

---

## 3. Orçamentos por Categoria (Budgets)

### 3.1 Modelo de dados

```
budget_rules
  id               uuid PK
  workspace_id     uuid FK
  category_id      uuid FK → categories.id
  period_type      text CHECK IN ('monthly','yearly')  -- 'monthly' = regra se repete todo mês
  amount           numeric(15,2) NOT NULL CHECK > 0
  alert_threshold  int DEFAULT 80   -- % de uso que dispara alerta (amarelo)
  is_active        boolean DEFAULT true
  created_at       timestamptz DEFAULT now()
  UNIQUE(workspace_id, category_id, period_type)

-- VIEW materializada (atualizada via trigger ou via query dinâmica)
-- Para evitar complexidade de trigger, usamos query dinâmica no queries.ts
```

**Nota de design**: Não há tabela `budget_periods` — os valores reais vêm de uma query que agrupa `transactions` pelo mês atual. Isso mantém o modelo simples.

### 3.2 Layout da página

```
/[workspace]/budgets

┌────────────────────────────────────────────────────────────┐
│  Orçamentos — Março 2026          ◀  ▶     [+ Orçamento]   │
├────────────────────────────────────────────────────────────┤
│  Gasto total: R$ 2.840 / R$ 4.500 planejado  (63%)        │
│  ████████████████░░░░░░░░░░░░░░░░░░  63%                   │
├────────────────────────────────────────────────────────────┤
│  Categoria          Gasto    Orçado   %      Status         │
│  ─────────────────────────────────────────────────────────  │
│  🍔 Alimentação     R$780   R$1.000  78%  ⚠️ Atenção       │
│  🏠 Moradia         R$1.800  R$1.800  100% 🔴 Estourado    │
│  🚗 Transporte      R$260   R$500    52%  ✅ OK             │
│  💊 Saúde           R$0     R$200    0%   ✅ OK             │
└────────────────────────────────────────────────────────────┘
```

### 3.3 BudgetStatus logic

```typescript
type BudgetStatus = 'ok' | 'warning' | 'exceeded' | 'no_budget'

function getBudgetStatus(spent: number, budgeted: number, threshold: number): BudgetStatus {
  if (budgeted === 0) return 'no_budget'
  const pct = (spent / budgeted) * 100
  if (pct >= 100) return 'exceeded'
  if (pct >= threshold) return 'warning'
  return 'ok'
}
```

**Cores**: ok = verde, warning = amarelo, exceeded = vermelho, no_budget = cinza

### 3.4 Query principal

```typescript
// features/budgets/queries.ts

export async function getBudgetSummary(workspaceId: string, year: number, month: number) {
  // 1. Busca todas as budget_rules ativas do workspace
  // 2. Para cada categoria com orçamento, soma as despesas do mês
  //    (transactions WHERE type='expense' AND date BETWEEN first e last day)
  // 3. Inclui categorias sem orçamento que tiveram gasto (para mostrar 'no_budget')
  // 4. Retorna array de BudgetLine ordenado por: exceeded → warning → ok → no_budget
  return lines: BudgetLine[]
}

type BudgetLine = {
  category_id: string
  category_name: string
  category_icon: string | null
  category_color: string | null
  budgeted: number         // 0 se sem orçamento
  spent: number
  percentage: number
  status: BudgetStatus
  alert_threshold: number
  rule_id: string | null   // null se sem orçamento
}
```

### 3.5 Schemas Zod

```typescript
// features/budgets/schemas.ts

export const createBudgetRuleSchema = z.object({
  category_id: z.string().uuid(),
  period_type: z.enum(['monthly', 'yearly']).default('monthly'),
  amount: z.number().positive(),
  alert_threshold: z.number().int().min(1).max(99).default(80),
})

export const updateBudgetRuleSchema = createBudgetRuleSchema.partial().extend({
  id: z.string().uuid(),
})
```

### 3.6 Banner de alerta no Dashboard

O Dashboard Fase 2 já tem um `PendingRecurrenceBanner`. Na Fase 3, adicionamos um `BudgetAlertBanner` que aparece quando há orçamentos exceeded ou em warning no mês corrente:

```typescript
// Renderizado no dashboard/page.tsx
// getPendingBudgetAlerts(workspaceId, year, month) → { exceeded: number, warning: number }
```

---

## 4. Relatórios (Reports)

### 4.1 Estrutura de navegação

```
/[workspace]/reports
  ├── /income-statement   → DRE (Demonstrativo de Resultado)
  ├── /cash-flow          → Fluxo de Caixa (método indireto simplificado)
  └── /net-worth          → Evolução do Patrimônio Líquido
```

Cada rota é um Server Component com `searchParams` para filtros (período, contas, categorias).

### 4.2 DRE — Demonstrativo de Resultado

#### Layout

```
/[workspace]/reports/income-statement?from=2026-01&to=2026-03

┌───────────────────────────────────────────────────────────────┐
│  DRE — Jan a Mar 2026            Período: [Jan 26 → Mar 26]  │
│                                  [Exportar PDF] [Exportar CSV]│
├────────────────────────┬──────────┬──────────┬───────────────┤
│  Categoria             │  Jan/26  │  Fev/26  │  Mar/26       │
├────────────────────────┼──────────┼──────────┼───────────────┤
│  RECEITAS              │          │          │               │
│    Salário             │  5.000   │  5.000   │  5.000        │
│    Freelance           │  1.200   │  800     │  2.000        │
│  Total Receitas        │  6.200   │  5.800   │  7.000        │
├────────────────────────┼──────────┼──────────┼───────────────┤
│  DESPESAS              │          │          │               │
│    Alimentação         │  780     │  820     │  710          │
│    Moradia             │  1.800   │  1.800   │  1.800        │
│  Total Despesas        │  3.100   │  3.200   │  2.900        │
├────────────────────────┼──────────┼──────────┼───────────────┤
│  RESULTADO LÍQUIDO     │  3.100   │  2.600   │  4.100        │
└────────────────────────┴──────────┴──────────┴───────────────┘
```

#### Query

```typescript
export async function getIncomeStatement(
  workspaceId: string,
  from: string,  // 'YYYY-MM'
  to: string,    // 'YYYY-MM'
  accountIds?: string[]
): Promise<IncomeStatementData> {
  // Gera array de meses entre from e to
  // Para cada mês: SUM(amount) GROUP BY category_id, type
  // Estrutura hierárquica: categoria pai → subcategorias
  // Exclui transferências
}

type IncomeStatementData = {
  months: string[]   // ['2026-01', '2026-02', '2026-03']
  incomeRows: ISRow[]
  expenseRows: ISRow[]
  totalIncome: Record<string, number>   // por mês
  totalExpense: Record<string, number>
  netResult: Record<string, number>
}

type ISRow = {
  category_id: string
  category_name: string
  parent_id: string | null
  values: Record<string, number>  // mês → valor
  isParent: boolean
}
```

### 4.3 Fluxo de Caixa

```
/[workspace]/reports/cash-flow?year=2026

┌──────────────────────────────────────────────────────────────┐
│  Fluxo de Caixa — 2026         Ano: [2026]                   │
│                                [Exportar PDF] [Exportar CSV]  │
├──────────────────┬─────┬─────┬─────┬─────┬──────┬──────────┤
│                  │ Jan │ Fev │ Mar │ Abr │  ... │   Total  │
├──────────────────┼─────┼─────┼─────┼─────┼──────┼──────────┤
│ Entradas         │ 6.2k│ 5.8k│ 7.0k│     │      │          │
│ Saídas           │ 3.1k│ 3.2k│ 2.9k│     │      │          │
│ Saldo do mês     │ 3.1k│ 2.6k│ 4.1k│     │      │          │
│ Saldo acumulado  │ 3.1k│ 5.7k│ 9.8k│     │      │          │
├──────────────────┴─────┴─────┴─────┴─────┴──────┴──────────┤
│  [Gráfico de linha: saldo acumulado por mês]                 │
└──────────────────────────────────────────────────────────────┘
```

```typescript
export async function getCashFlowStatement(
  workspaceId: string,
  year: number,
  accountIds?: string[]
): Promise<CashFlowData> {
  // 12 meses do ano
  // income, expense por mês (excluindo transferências)
  // net = income - expense
  // cumulative = running sum de net
}
```

### 4.4 Evolução do Patrimônio Líquido

```
/[workspace]/reports/net-worth?months=12

┌──────────────────────────────────────────────────────────────┐
│  Patrimônio Líquido — Últimos 12 meses     [Exportar PDF]    │
├──────────────────────────────────────────────────────────────┤
│  Atual: R$ 48.500    Variação 12 meses: +R$ 14.200 (+41%)   │
│                                                              │
│  [Gráfico de área — saldo total por mês]                     │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Por conta:                                                  │
│  Nubank Checking    R$  5.200  ████░░░░  11%                │
│  Investimentos XP   R$ 38.000  ████████  78%                │
│  Carteira           R$  5.300  █░░░░░░░  11%                │
└──────────────────────────────────────────────────────────────┘
```

```typescript
export async function getNetWorthEvolution(
  workspaceId: string,
  months: number  // quantos meses para trás (6, 12, 24)
): Promise<NetWorthData> {
  // Para cada mês: saldo de cada conta no final do mês
  // = opening_balance + SUM(amount de transações até último dia do mês)
  // Exclui contas com include_in_net_worth = false
}
```

### 4.5 Filtros globais dos relatórios

Cada relatório aceita `searchParams` do Next.js:
- `from` / `to`: período (`YYYY-MM`)
- `year`: ano (para cash flow)
- `months`: janela temporal (para net worth)
- `accounts`: lista de account_ids separados por vírgula
- `categories`: lista de category_ids (DRE apenas)

Os filtros são renderizados no `ReportFilters` Client Component com `useRouter().replace` para atualizar a URL sem reload.

---

## 5. Exportação (Export)

### 5.1 Estratégia técnica

| Formato | Geração | Endpoint |
|---------|---------|----------|
| CSV | Node.js string building (sem lib) | Route Handler GET /api/export/csv |
| PDF | `@react-pdf/renderer` (server-side) | Route Handler GET /api/export/pdf |

Os Route Handlers recebem os mesmos `searchParams` das páginas de relatório. Isso permite o botão **Exportar** chamar diretamente a URL com os mesmos filtros ativos.

### 5.2 CSV export

```typescript
// app/api/export/csv/route.ts
// GET /api/export/csv?type=transactions&workspace=X&from=YYYY-MM-DD&to=YYYY-MM-DD

export async function GET(request: Request) {
  // 1. Valida sessão e workspace via Supabase
  // 2. Switch por `type`: transactions | income-statement | budgets
  // 3. Busca dados
  // 4. Converte para CSV (header + rows)
  // 5. Retorna Response com Content-Type: text/csv e Content-Disposition: attachment
}
```

**Campos CSV de transações**: date, description, amount, type, category, account, notes, status

### 5.3 PDF export

```typescript
// app/api/export/pdf/route.ts
// GET /api/export/pdf?type=income-statement&workspace=X&from=2026-01&to=2026-03

// Componentes React PDF:
// PDFDocument → PDFPage → PDFHeader, PDFTable, PDFFooter

// PDFDocument recebe os dados já formatados e renderiza
// usando @react-pdf/renderer (renderToBuffer no servidor)
```

**Layout do PDF**:
- Cabeçalho: Logo "Revenue Hub" (texto) + nome do workspace + período
- Corpo: tabela com os mesmos dados da tela
- Rodapé: "Gerado em DD/MM/YYYY HH:mm · Revenue Hub"
- Font: Helvetica (built-in) — sem dependência de Google Fonts
- Tamanho: A4 landscape para DRE, A4 portrait para os demais

### 5.4 Botão de exportação

```tsx
// components/reports/ExportButton.tsx  (Client Component)
// Recebe type e params, monta URL e usa window.open() para download
// Mostra spinner enquanto o download não inicia (usando <a download> não funciona bem com Route Handlers)

export function ExportButton({ type, params }: ExportButtonProps) {
  // href = `/api/export/${format}?type=${type}&${params}`
}
```

---

## 6. Migrations Fase 3

### Migration 020 — goals e goal_contributions

```sql
-- 020_goals.sql
CREATE TABLE goals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  type             text NOT NULL CHECK (type IN ('savings','debt_payoff','purchase','investment','emergency_fund','other')),
  target_amount    numeric(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount   numeric(15,2) NOT NULL DEFAULT 0,
  target_date      date,
  account_id       uuid REFERENCES accounts(id) ON DELETE SET NULL,
  color            text,
  icon             text,
  is_completed     boolean NOT NULL DEFAULT false,
  is_archived      boolean NOT NULL DEFAULT false,
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE goal_contributions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id      uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  amount       numeric(15,2) NOT NULL CHECK (amount > 0),
  note         text,
  date         date NOT NULL DEFAULT CURRENT_DATE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members can manage goals"
  ON goals FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace members can manage goal_contributions"
  ON goal_contributions FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_goals_workspace ON goals(workspace_id);
CREATE INDEX idx_goal_contributions_goal ON goal_contributions(goal_id);
CREATE INDEX idx_goal_contributions_workspace ON goal_contributions(workspace_id, date DESC);
```

### Migration 021 — budget_rules

```sql
-- 021_budgets.sql
CREATE TABLE budget_rules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id      uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  period_type      text NOT NULL DEFAULT 'monthly' CHECK (period_type IN ('monthly','yearly')),
  amount           numeric(15,2) NOT NULL CHECK (amount > 0),
  alert_threshold  integer NOT NULL DEFAULT 80 CHECK (alert_threshold BETWEEN 1 AND 99),
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, category_id, period_type)
);

ALTER TABLE budget_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members can manage budget_rules"
  ON budget_rules FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE INDEX idx_budget_rules_workspace ON budget_rules(workspace_id) WHERE is_active = true;
```

### Migration 022 — report indexes e helper function

```sql
-- 022_report_indexes.sql

-- Index para queries de relatório por workspace+mês
CREATE INDEX IF NOT EXISTS idx_transactions_report
  ON transactions(workspace_id, type, date)
  WHERE status != 'void';

-- Função auxiliar: saldo de uma conta até uma data (usada em net-worth)
CREATE OR REPLACE FUNCTION account_balance_at(
  p_account_id uuid,
  p_date       date
) RETURNS numeric AS $$
  SELECT
    COALESCE(a.opening_balance, 0) +
    COALESCE(SUM(
      CASE
        WHEN t.type = 'income' THEN t.amount
        WHEN t.type = 'expense' THEN -t.amount
        WHEN t.type = 'transfer_in' THEN t.amount
        WHEN t.type = 'transfer_out' THEN -t.amount
        ELSE 0
      END
    ), 0)
  FROM accounts a
  LEFT JOIN transactions t
    ON t.account_id = a.id
   AND t.date <= p_date
   AND t.status != 'void'
  WHERE a.id = p_account_id
  GROUP BY a.opening_balance;
$$ LANGUAGE SQL STABLE;
```

---

## 7. Arquitetura de Componentes

### 7.1 Árvore de componentes — Goals

```
app/(app)/[workspace]/goals/page.tsx          (Server Component)
  GoalsTabs                                    (Client — tabs: ativas/concluídas)
    GoalList                                   (Server Component, recebe array)
      GoalCard (×N)                            (Client — animação de progresso)
        ContributionModal                      (Client — Dialog/Drawer)
          ContributionForm                     (Client — react-hook-form)
        GoalMenu                               (Client — DropdownMenu)
    EmptyState
  GoalForm (modal)                             (Client — react-hook-form)
```

### 7.2 Árvore de componentes — Budgets

```
app/(app)/[workspace]/budgets/page.tsx         (Server Component)
  MonthNavigator                               (Client — já existe)
  BudgetSummaryBar                             (Server — total gasto/orçado)
  BudgetGrid                                   (Server Component)
    BudgetRow (×N)                             (Client — ProgressBar + status icon)
      BudgetRuleModal                          (Client — criar/editar regra)
  BudgetAlertBanner                            (Server — categorias exceeded)
  EmptyState (se sem orçamentos)
```

### 7.3 Árvore de componentes — Reports

```
app/(app)/[workspace]/reports/layout.tsx       (Server — nav tabs)
  ReportFilters                                (Client — period pickers, account select)
  ExportButton                                 (Client — PDF/CSV download)

/income-statement/page.tsx                     (Server Component)
  IncomeStatementTable                         (Server)

/cash-flow/page.tsx                            (Server Component)
  CashFlowTable                                (Server)
  CashFlowChart                                (Client — Recharts LineChart)

/net-worth/page.tsx                            (Server Component)
  NetWorthSummary                              (Server — valor atual + variação)
  NetWorthChart                                (Client — Recharts AreaChart)
  AccountBreakdownTable                        (Server)
```

### 7.4 Novos componentes UI

| Componente | Descrição |
|------------|-----------|
| `GoalProgressBar` | ProgressBar especializado com cor dinâmica + marcador de % |
| `BudgetStatusBadge` | Badge com ícone: ✅ OK / ⚠️ Atenção / 🔴 Estourado |
| `ReportTable` | Tabela com cabeçalho fixo, linhas de subtotal em negrito, valores numéricos alinhados à direita |
| `PeriodRangePicker` | Seletor de `from/to` mês via dois `<select>` de mês/ano |
| `NetWorthChart` | `AreaChart` do Recharts com gradiente azul |
| `CashFlowLineChart` | `LineChart` do Recharts — linha de saldo acumulado |

---

## 8. Server Actions — Contratos Completos

### 8.1 Goals Actions

```typescript
// features/goals/actions.ts

// Cria meta. Incrementa sort_order automaticamente.
createGoal(workspaceId: string, input: CreateGoalInput): ActionResult<Goal>

// Atualiza campos da meta.
updateGoal(workspaceId: string, input: UpdateGoalInput): ActionResult<Goal>

// Marca como arquivada (soft delete).
archiveGoal(workspaceId: string, goalId: string): ActionResult<void>

// Adiciona contribuição e atualiza current_amount atomicamente.
// Se current_amount >= target_amount: marca is_completed = true.
addGoalContribution(
  workspaceId: string,
  input: AddContributionInput
): ActionResult<GoalContribution>

// Remove contribuição e decrementa current_amount.
// Se meta estava concluída e current_amount < target_amount: desmarca is_completed.
removeGoalContribution(
  workspaceId: string,
  contributionId: string
): ActionResult<void>

// Reordena metas via drag-and-drop (batch UPDATE sort_order).
reorderGoals(workspaceId: string, orderedIds: string[]): ActionResult<void>
```

### 8.2 Budgets Actions

```typescript
// features/budgets/actions.ts

// Cria ou atualiza regra de orçamento (upsert por workspace_id + category_id + period_type).
upsertBudgetRule(workspaceId: string, input: CreateBudgetRuleInput): ActionResult<BudgetRule>

// Atualiza amount e/ou alert_threshold.
updateBudgetRule(workspaceId: string, input: UpdateBudgetRuleInput): ActionResult<BudgetRule>

// Desativa (soft delete) — is_active = false.
deactivateBudgetRule(workspaceId: string, ruleId: string): ActionResult<void>
```

### 8.3 Export — Route Handlers (não são Server Actions)

```typescript
// app/api/export/csv/route.ts
GET /api/export/csv
  ?type=transactions|income-statement|budgets
  &workspace={workspaceId}
  &from={YYYY-MM-DD}
  &to={YYYY-MM-DD}
  → Response(csvString, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="..."' } })

// app/api/export/pdf/route.ts
GET /api/export/pdf
  ?type=income-statement|cash-flow|net-worth
  &workspace={workspaceId}
  &from={YYYY-MM}
  &to={YYYY-MM}
  → Response(pdfBuffer, { headers: { 'Content-Type': 'application/pdf', ... } })
```

---

## 9. Estrutura de Pastas — Adições

```
apps/web/
├── app/
│   ├── (app)/[workspace]/
│   │   ├── goals/
│   │   │   └── page.tsx
│   │   ├── budgets/
│   │   │   └── page.tsx
│   │   └── reports/
│   │       ├── layout.tsx
│   │       ├── page.tsx                  ← redirect para /income-statement
│   │       ├── income-statement/
│   │       │   └── page.tsx
│   │       ├── cash-flow/
│   │       │   └── page.tsx
│   │       └── net-worth/
│   │           └── page.tsx
│   └── api/
│       └── export/
│           ├── csv/route.ts
│           └── pdf/route.ts
├── features/
│   ├── goals/
│   │   ├── schemas.ts
│   │   ├── queries.ts
│   │   ├── actions.ts
│   │   ├── components/
│   │   │   ├── GoalCard.tsx
│   │   │   ├── GoalForm.tsx
│   │   │   ├── GoalList.tsx
│   │   │   ├── GoalsTabs.tsx
│   │   │   └── ContributionModal.tsx
│   │   └── __tests__/
│   │       ├── schemas.test.ts
│   │       └── utils.test.ts
│   ├── budgets/
│   │   ├── schemas.ts
│   │   ├── queries.ts
│   │   ├── actions.ts
│   │   ├── components/
│   │   │   ├── BudgetGrid.tsx
│   │   │   ├── BudgetRow.tsx
│   │   │   ├── BudgetRuleModal.tsx
│   │   │   ├── BudgetSummaryBar.tsx
│   │   │   └── BudgetStatusBadge.tsx
│   │   └── __tests__/
│   │       ├── schemas.test.ts
│   │       └── queries.test.ts
│   └── reports/
│       ├── queries.ts                    ← getIncomeStatement, getCashFlow, getNetWorth
│       ├── components/
│       │   ├── ReportFilters.tsx
│       │   ├── ReportTable.tsx
│       │   ├── ExportButton.tsx
│       │   ├── IncomeStatementTable.tsx
│       │   ├── CashFlowTable.tsx
│       │   ├── CashFlowLineChart.tsx
│       │   ├── NetWorthSummary.tsx
│       │   ├── NetWorthChart.tsx
│       │   └── PeriodRangePicker.tsx
│       └── pdf/
│           ├── PDFDocument.tsx           ← @react-pdf/renderer
│           ├── PDFTable.tsx
│           └── PDFHeader.tsx
└── components/ui/
    ├── GoalProgressBar.tsx
    ├── BudgetStatusBadge.tsx
    ├── ReportTable.tsx
    └── PeriodRangePicker.tsx

packages/database/migrations/
  020_goals.sql
  021_budgets.sql
  022_report_indexes.sql
```

---

## 10. Backlog Técnico — Sprint 4

### Sprint 4A — Metas (3 dias)

| # | Tarefa | Prioridade |
|---|--------|:---:|
| 1 | Migration 020: goals + goal_contributions + RLS | Alta |
| 2 | `features/goals/schemas.ts` + testes | Alta |
| 3 | `features/goals/queries.ts` (GoalWithStats) | Alta |
| 4 | `features/goals/actions.ts` (create/update/archive/contribution/reorder) | Alta |
| 5 | GoalCard + GoalProgressBar | Alta |
| 6 | GoalForm (modal) | Alta |
| 7 | ContributionModal | Alta |
| 8 | GoalsTabs + GoalList | Média |
| 9 | `/goals/page.tsx` (Server Component) | Alta |

### Sprint 4B — Orçamentos (2 dias)

| # | Tarefa | Prioridade |
|---|--------|:---:|
| 10 | Migration 021: budget_rules + RLS | Alta |
| 11 | `features/budgets/schemas.ts` + testes | Alta |
| 12 | `features/budgets/queries.ts` (getBudgetSummary) | Alta |
| 13 | `features/budgets/actions.ts` (upsert/update/deactivate) | Alta |
| 14 | BudgetRow + BudgetStatusBadge + BudgetGrid | Alta |
| 15 | BudgetRuleModal | Alta |
| 16 | `/budgets/page.tsx` (Server Component) | Alta |
| 17 | BudgetAlertBanner no Dashboard | Média |

### Sprint 4C — Relatórios (3 dias)

| # | Tarefa | Prioridade |
|---|--------|:---:|
| 18 | Migration 022: indexes + function account_balance_at | Alta |
| 19 | `features/reports/queries.ts` (getIncomeStatement, getCashFlow, getNetWorth) | Alta |
| 20 | ReportFilters (Client Component) | Alta |
| 21 | ReportTable (componente genérico) | Alta |
| 22 | IncomeStatementTable | Alta |
| 23 | CashFlowTable + CashFlowLineChart | Alta |
| 24 | NetWorthSummary + NetWorthChart | Alta |
| 25 | `/reports/` layout + páginas | Alta |

### Sprint 4D — Export (2 dias)

| # | Tarefa | Prioridade |
|---|--------|:---:|
| 26 | Instalar `@react-pdf/renderer` | Alta |
| 27 | PDFDocument + PDFTable + PDFHeader | Alta |
| 28 | Route Handler `/api/export/pdf` | Alta |
| 29 | Route Handler `/api/export/csv` | Alta |
| 30 | ExportButton (Client Component) | Alta |
| 31 | Integrar botões de export nas páginas de relatório | Alta |

### Testes críticos

| Arquivo | O que testa |
|---------|-------------|
| `goals/schemas.test.ts` | createGoalSchema, addContributionSchema |
| `goals/utils.test.ts` | cálculo de percentage, monthsLeft, requiredMonthly |
| `budgets/schemas.test.ts` | createBudgetRuleSchema, getBudgetStatus |
| `budgets/queries.test.ts` | lógica de BudgetLine aggregation |
| `reports/queries.test.ts` | getIncomeStatement math, net worth acumulado |

---

### Dependências novas (package.json)

```json
{
  "@react-pdf/renderer": "^3.4.4"
}
```

Sem outras dependências externas: CSV é gerado com string building nativo do Node.js.

---

*Fim da especificação Fase 3 — Revenue Hub*
