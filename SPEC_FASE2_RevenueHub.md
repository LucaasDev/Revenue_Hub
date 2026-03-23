# Revenue Hub — Especificação Técnica Fase 2

> Versão: 1.0 | Status: Para validação | Data: 2026-03-20
> Pré-requisito: Fase 1 concluída (infraestrutura, auth, schema completo no ar)

---

## Índice

1. [Escopo e Objetivos](#1-escopo-e-objetivos)
2. [Dashboard](#2-dashboard)
3. [Transações](#3-transações)
4. [Contas](#4-contas)
5. [Categorias](#5-categorias)
6. [Cartões de Crédito](#6-cartões-de-crédito)
7. [Recorrências](#7-recorrências)
8. [Arquitetura de Componentes](#8-arquitetura-de-componentes)
9. [Server Actions — Contratos Completos](#9-server-actions--contratos-completos)
10. [Estrutura de Pastas — Adições](#10-estrutura-de-pastas--adições)
11. [Backlog Técnico — Sprints 2 e 3](#11-backlog-técnico--sprints-2-e-3)

---

## 1. Escopo e Objetivos

A Fase 2 entrega as **features de negócio centrais** do Revenue Hub. Ao final, o usuário consegue:

- Ver um dashboard com visão financeira real do mês
- Lançar, editar e organizar transações (incluindo transferências e parcelamentos)
- Gerenciar contas com saldo atualizado em tempo real
- Organizar categorias em hierarquia de 2 níveis
- Cadastrar cartões de crédito e acompanhar o ciclo completo de faturas
- Configurar transações recorrentes com geração automática via cron

### O que **não** é Fase 2

| Feature | Fase prevista |
|---------|:---:|
| Metas financeiras (goals) | Fase 3 |
| Orçamentos por categoria (budgets) | Fase 3 |
| Relatórios e exportação (PDF/CSV) | Fase 3 |
| Integração com Open Finance / OFX | Fase 4 |
| App mobile (React Native) | Fase 5 |

### Princípios arquiteturais mantidos

- **Server-first**: dados carregados via Server Components ou `queries.ts`; mutações via Server Actions
- **Otimista quando possível**: usar `useOptimistic` do React 19 em listas de transações e contas
- **RLS como última linha de defesa**: validações business-rule em Server Actions antes do banco
- **Zero client bundle desnecessário**: componentes interativos (modais, formulários) são Client Components isolados; o restante permanece Server

---

## 2. Dashboard

### 2.1 Layout e widgets

O dashboard é uma **Server Component** que carrega todos os dados em paralelo com `Promise.all`. Não há loading skeleton global — cada widget tem seu próprio `Suspense`.

```
┌─────────────────────────────────────────────────────────┐
│  Navegador de mês   ◀  Março 2026  ▶          [+ Nova]  │
├──────────┬──────────┬──────────┬──────────────────────── │
│ Receitas │ Despesas │ Saldo    │ Patrimônio Líquido       │
│ +R$8.500 │ -R$3.200 │ +R$5.300 │ R$42.000               │
├──────────┴──────────┴──────────┴────────────────────────┤
│  Gráfico de fluxo de caixa (barras diárias — 30 dias)   │
├───────────────────────────┬─────────────────────────────┤
│  Despesas por categoria   │  Contas com saldo            │
│  (donut chart)            │  (lista com barra de prog.)  │
├───────────────────────────┴─────────────────────────────┤
│  Últimas 5 transações           [Ver todas →]           │
├─────────────────────────────────────────────────────────┤
│  Faturas abertas de cartão      [Gerenciar →]           │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Queries do dashboard

```typescript
// features/dashboard/queries.ts

/** KPIs do mês */
export async function getDashboardKPIs(workspaceId: string, year: number, month: number) {
  // SUM de income e expense confirmados no período
  // Saldo atual = soma de todos os accounts.balance (include_in_net_worth = true)
}

/** Fluxo de caixa diário (30 dias) */
export async function getCashFlowByDay(workspaceId: string, dateFrom: string, dateTo: string) {
  // GROUP BY date, type → array de { date, income, expense }
}

/** Top 5 categorias de despesa do mês */
export async function getExpensesByCategory(workspaceId: string, year: number, month: number) {
  // JOIN com categories, GROUP BY category_id
  // Retorna: [{ categoryId, name, color, icon, total, percentage }]
}

/** Patrimônio líquido (net worth) */
export async function getNetWorth(workspaceId: string) {
  // SUM(balance) WHERE include_in_net_worth = true e is_active = true
}
```

### 2.3 Navegação de mês

O mês ativo fica no `useWorkspaceStore` (já existe). O componente `MonthNavigator` é um Client Component que atualiza o store e re-faz os fetches via TanStack Query.

```typescript
// store/workspace.ts — já existe, apenas adicionar:
activeMonth: Date           // ✓ já está
setActiveMonth: (m: Date)   // ✓ já está
```

### 2.4 Componente `StatCard`

Widget de KPI reutilizável com variação percentual em relação ao mês anterior.

```typescript
interface StatCardProps {
  title: string
  value: number
  currency: string
  trend?: number          // variação %, ex: +12.5 ou -3.2
  trendLabel?: string     // "vs mês anterior"
  variant?: 'income' | 'expense' | 'neutral'
  loading?: boolean
}
```

---

## 3. Transações

### 3.1 Listagem com filtros

A página de transações usa **URL search params** como fonte de verdade dos filtros — permite compartilhar links e navegação com o botão voltar.

```
/[workspace]/transactions
  ?page=1
  &status=confirmed
  &type=expense
  &category=uuid
  &account=uuid
  &dateFrom=2026-03-01
  &dateTo=2026-03-31
  &search=mercado
```

#### Componentes

| Componente | Tipo | Responsabilidade |
|-----------|------|-----------------|
| `TransactionFilters` | Client | Barra de filtros (tipo, status, categoria, conta, período, busca) |
| `TransactionTable` | Server | Tabela paginada (já existe — expandir) |
| `TransactionRow` | Client | Linha com ações inline (editar, estornar, deletar) |
| `TransactionForm` | Client | Modal de criação/edição |
| `TransferForm` | Client | Modal específico para transferências |
| `TransactionDetail` | Server | Página `/transactions/[id]` com histórico |

### 3.2 Formulário de transação (`TransactionForm`)

Modal controlado com `useForm` (react-hook-form + zodResolver).

**Campos por tipo:**

```
income / expense:
  ├── type (toggle: Receita / Despesa)
  ├── description (text, required)
  ├── amount (currency input, required)
  ├── currency (select, default workspace.currency_base)
  ├── account_id (select com contas ativas)
  ├── category_id (select hierárquico, required para expense)
  ├── date (date picker, default: hoje)
  ├── status (toggle: Confirmada / Pendente)
  └── notes (textarea, optional)

transfer:
  ├── description
  ├── amount
  ├── currency
  ├── from_account_id (conta origem)
  ├── to_account_id   (conta destino ≠ origem)
  ├── date
  └── notes

opening_balance:
  — criado automaticamente ao criar conta —
  — não aparece no formulário manual —
```

### 3.3 Ações inline na transação

```typescript
// Ações disponíveis por status:
// confirmed   → editar | estornar (void) | soft-delete
// pending     → confirmar | editar | soft-delete
// reconciled  → somente editar notes/description
// void        → nenhuma ação (somente leitura)
```

### 3.4 Busca full-text

```sql
-- Índice necessário (migration adicional: 019_search_index.sql)
create index transactions_description_search_idx
  on transactions
  using gin(to_tsvector('portuguese', description || ' ' || coalesce(notes, '')))
  where deleted_at is null;

-- Query
select * from transactions
where workspace_id = $1
  and deleted_at is null
  and to_tsvector('portuguese', description || ' ' || coalesce(notes, ''))
      @@ plainto_tsquery('portuguese', $2)
order by date desc;
```

### 3.5 Paginação

Usar **cursor-based pagination** para a listagem principal (mais eficiente que OFFSET em tabelas grandes):

```typescript
// Cursor = { date: string, id: string } (último item da página anterior)
export async function getTransactionsCursor(
  workspaceId: string,
  filters: ListTransactionsInput,
  cursor?: { date: string; id: string },
) {
  // WHERE (date, id) < (cursor.date, cursor.id)
  // ORDER BY date DESC, id DESC
  // LIMIT perPage + 1  -- +1 para saber se há próxima página
}
```

### 3.6 Bulk actions

Seleção múltipla para operações em lote:

```typescript
export async function bulkDeleteTransactions(
  workspaceId: string,
  ids: string[],          // máx 100 por operação
): Promise<ActionResult<{ affected: number }>>

export async function bulkConfirmTransactions(
  workspaceId: string,
  ids: string[],
): Promise<ActionResult<{ affected: number }>>
```

### 3.7 Regras de negócio adicionais

1. **Edição de transação `reconciled`** — somente `description` e `notes` são editáveis. Campos financeiros (`amount`, `date`, `account_id`, `category_id`) ficam disabled no formulário.
2. **Transação em fatura paga** — ao tentar editar, exibir aviso "Esta transação pertence a uma fatura já paga e não pode ser alterada."
3. **Validação de categoria x tipo** — o select de categorias filtra automaticamente pelo `type` da transação (income mostra só categorias income, etc.).
4. **Estorno (void)** — setar `status = 'void'`. O trigger de saldo reverte automaticamente. Não deletar o registro.
5. **Data futura** — ao salvar com `date > hoje`, o status é forçado para `pending` independente do que o usuário selecionou.
6. **Moeda diferente da base** — ao selecionar uma conta com moeda diferente do workspace, exibir campo `exchange_rate` para o usuário informar a taxa do dia. O `amount_in_base` é calculado client-side como preview antes de salvar.

---

## 4. Contas

### 4.1 Layout da página

```
┌─────────────────────────────────────────────────┐
│  Contas Ativas                      [+ Nova conta]│
├────────────────────────────────────────────────── │
│  ⠿ [ícone] Nubank CC       R$ 2.340,00   [···]   │
│  ⠿ [ícone] Itaú Corrente   R$ 8.120,50   [···]   │
│  ⠿ [ícone] Carteira        R$   320,00   [···]   │
├────────────────────────────────────────────────── │
│  Contas Arquivadas (2)              [Mostrar ▼]  │
└─────────────────────────────────────────────────┘
```

- Drag-and-drop para reordenar (atualiza `sort_order` via Server Action)
- Menu `[···]` com: Editar | Ver transações | Arquivar | Excluir (se saldo = 0)

### 4.2 Formulário de conta

```typescript
interface AccountFormFields {
  name: string                // 1–100 chars
  type: account_type          // checking | savings | wallet | investment | other
  institution?: string        // banco/corretora, optional
  currency: string            // default: workspace.currency_base
  opening_balance: number     // default: 0 (cria opening_balance tx se > 0)
  color?: string              // hex picker
  icon?: string               // select de ícones (lucide)
  include_in_net_worth: boolean
}
```

### 4.3 Reordenamento (drag-and-drop)

```typescript
// features/accounts/actions.ts
export async function reorderAccounts(
  workspaceId: string,
  orderedIds: string[],     // array de IDs na nova ordem
): Promise<ActionResult>
// UPDATE accounts SET sort_order = index WHERE id = orderedIds[index]
// Executado em batch (uma query por conta) dentro de uma transação ACID
```

Biblioteca recomendada: `@dnd-kit/core` + `@dnd-kit/sortable` (tree-shakeable, acessível).

### 4.4 Exclusão de conta

```typescript
// Regras:
// 1. Conta com transações → bloquear DELETE, oferecer "Arquivar"
// 2. Conta sem transações → permitir DELETE real (via service role no admin, ou verificação server-side)
// 3. Conta arquivada → pode ser reativada ou excluída se sem transações

export async function deleteAccount(
  workspaceId: string,
  accountId: string,
): Promise<ActionResult>
// Verificar: count(transactions WHERE account_id = accountId AND deleted_at IS NULL) = 0
// Se > 0: retornar erro com code: 'HAS_TRANSACTIONS'
```

### 4.5 Saldo em tempo real

O `balance` na tabela é atualizado pelo trigger `trg_transaction_balance` (Fase 1). No frontend:

- Exibir saldo do Server Component na carga inicial
- Após mutações (criar/editar/deletar transação), chamar `revalidatePath` para re-renderizar o Server Component com saldo atualizado
- **Não** usar polling ou subscriptions em tempo real na Fase 2 (reservado para Fase 4)

---

## 5. Categorias

### 5.1 Layout — árvore de 2 níveis

```
┌──────────────────────────────────────────────────────┐
│  DESPESAS                    RECEITAS           [+ Nova]│
├──────────────────────────┬───────────────────────────── │
│  ▼ 🍽 Alimentação        │  ▼ 💼 Salário                │
│      └ Supermercado      │      └ Salário fixo           │
│      └ Restaurante       │      └ 13º salário            │
│      └ Delivery          │      └ Férias                 │
│  ▼ 🚗 Transporte         │  ▼ 💻 Freelance              │
│      └ Combustível       │  ▼ 📈 Investimentos          │
│      └ Uber/App          │      └ Dividendos             │
│  ▼ 🏠 Moradia            │      └ Renda fixa             │
│  ...                     │  ...                          │
└──────────────────────────┴───────────────────────────── │
```

Cada categoria exibe badge "sistema" (is_system = true) que impede exclusão.

### 5.2 Componentes

| Componente | Tipo | Descrição |
|-----------|------|-----------|
| `CategoryTree` | Client | Árvore expansível com drag para reordenar |
| `CategoryForm` | Client | Modal criar/editar (nome, tipo, cor, ícone, pai) |
| `CategoryMergeDialog` | Client | Modal para mesclar categoria com destino |
| `CategoryBadge` | Server | Badge inline com cor e ícone (reutilizado em toda a app) |

### 5.3 Regras de merge

Ao arquivar/deletar uma categoria que possui transações vinculadas:

1. Exibir `CategoryMergeDialog` com select da categoria destino (mesmo `type`)
2. Server Action atualiza `category_id` de todas as transações afetadas para o destino
3. Só então executa a exclusão/ocultação da categoria original

```typescript
export async function mergeAndDeleteCategory(
  workspaceId: string,
  sourceCategoryId: string,
  targetCategoryId: string,
): Promise<ActionResult<{ transactionsMoved: number }>>
// 1. Verificar que source e target têm o mesmo type
// 2. UPDATE transactions SET category_id = target WHERE category_id = source
// 3. Se is_system = false → DELETE category
// 4. Se is_system = true → apenas reatribuir transações (não deleta)
```

### 5.4 Criação de subcategoria

```typescript
// Regra: parent_id deve ser de uma categoria sem parent_id (máx 2 níveis)
// Validação extra na Server Action além da constraint do banco:
if (parentCategory.parent_id !== null) {
  return { ok: false, error: 'Subcategorias não podem ter filhos', code: 'MAX_DEPTH' }
}
```

### 5.5 Seletor hierárquico de categorias

Componente `CategorySelect` reutilizado em `TransactionForm` e `BudgetForm`:

```typescript
interface CategorySelectProps {
  workspaceId: string
  value?: string | null
  onChange: (id: string | null) => void
  type: 'income' | 'expense'     // filtra pelo tipo
  placeholder?: string
  error?: string
}
// Exibe grupos (pai) com sub-itens indentados
// Categorias de sistema marcadas com ícone especial
// Campo de busca inline para workspaces com muitas categorias
```

---

## 6. Cartões de Crédito

### 6.1 Fluxo completo

```
Cadastrar cartão
  └→ Definir closing_day e due_day
       └→ Sistema gera fatura 'open' automaticamente (Edge Function ou ao criar)
            └→ Usuário lança despesas → vinculadas à fatura aberta corrente
                 └→ closing_day chega → Edge Function fecha fatura (→ 'closed') e abre nova
                      └→ due_day chega → usuário paga fatura
                           └→ Fatura → 'paid' | todas as transações do período → 'reconciled'
```

### 6.2 Página de listagem de cartões

```
┌─────────────────────────────────────────────────────┐
│  Cartões de crédito                  [+ Novo cartão] │
├──────────────────────────────────────────────────────│
│  [VISA] Nubank Roxo          Limite: R$ 10.000       │
│         Fatura aberta: R$ 2.340  Fecha em 12 dias    │
│                                          [Ver fatura]│
├──────────────────────────────────────────────────────│
│  [MC]   Itaú Gold            Limite: R$ 5.000        │
│         Fatura fechada: R$ 890   Vence em 5 dias     │
│                                         [Pagar agora]│
└──────────────────────────────────────────────────────│
```

### 6.3 Página de detalhe do cartão (`/cards/[id]`)

```
┌──────────────────────────────────────────────────────┐
│  Nubank Roxo ████████████░░░░  R$ 2.340 / R$ 10.000 │
│  Utilização: 23,4%                                   │
├──────────────────┬───────────────────────────────────┤
│  Faturas         │  Transações da fatura selecionada  │
│  ┌─────────────┐ │                                   │
│  │ ● Aberta    │ │  20/03  Netflix        R$ 55,90   │
│  │   Mar 2026  │ │  18/03  Mercado Livre  R$ 287,00  │
│  │   R$ 2.340  │ │  15/03  iFood 1/3      R$ 45,33  │
│  ├─────────────┤ │  15/03  iFood 2/3      R$ 45,33  │
│  │   Fev 2026  │ │  15/03  iFood 3/3      R$ 45,33  │
│  │   R$ 1.890  │ │  ...                             │
│  │   [Paga ✓]  │ │                                  │
│  └─────────────┘ │                          [+ Lançar]│
└──────────────────┴───────────────────────────────────┘
```

### 6.4 Lançar despesa no cartão

Diferença do fluxo normal: ao selecionar uma conta do tipo **credit_card** (na prática, ao vincular a transação a um `card_id`), o formulário exibe opção de parcelamento.

```typescript
interface CardTransactionInput extends CreateTransactionInput {
  card_id: string
  total_installments: number   // 1 = à vista, N = parcelado
}

// Server Action: createCardTransaction
// Para N parcelas, cria N transações + N card_transactions
// Cada parcela vai para a fatura do mês correspondente (mês + i)
// parent_tx_id = id da primeira parcela (installment_number = 1)
```

**Algoritmo de distribuição por fatura:**

```typescript
function getInvoiceForDate(cardId: string, date: Date): Promise<CardInvoice>
// Para a data informada, encontrar (ou criar) a fatura open cujo
// period_start <= date <= period_end
// Se não existir, criar a fatura para o período correspondente
```

### 6.5 Pagamento de fatura

```typescript
export async function payInvoice(
  workspaceId: string,
  invoiceId: string,
  paymentAccountId: string,   // conta corrente que paga a fatura
  paidAmount: number,         // pode ser parcial (pagamento mínimo)
  paymentDate: string,
): Promise<ActionResult<{ transactionId: string }>>

// 1. Criar transação expense na conta de pagamento
//    description: "Fatura Cartão [nome] — [Mês/Ano]"
//    category: "Serviços > Cartão de crédito" (criar se não existir)
// 2. Atualizar card_invoices.paid_amount += paidAmount
// 3. Se paid_amount >= total_amount:
//    - status → 'paid'
//    - paid_at → agora
//    - payment_tx_id → id da transação criada
//    - UPDATE todas as transactions do período → status = 'reconciled'
```

### 6.6 Formulário de cadastro de cartão

```typescript
interface CreditCardFormFields {
  name: string              // "Nubank Roxo", "Itaú Platinum"
  brand: card_brand         // visa | mastercard | elo | amex | hipercard | other
  last_four?: string        // últimos 4 dígitos (opcional)
  credit_limit: number      // limite do cartão
  closing_day: number       // 1–28: dia de fechamento da fatura
  due_day: number           // 1–28: dia de vencimento
  account_id: string        // conta corrente vinculada ao pagamento
}
// Ao criar: gerar automaticamente a primeira fatura 'open' para o período corrente
```

### 6.7 Indicador de utilização

```typescript
// Exibido na listagem e no detalhe:
const utilization = (currentBalance / creditLimit) * 100

// Cores:
// < 30%  → verde (income)
// 30–70% → amarelo
// > 70%  → vermelho (expense)
```

---

## 7. Recorrências

### 7.1 Página de gerenciamento

```
/[workspace]/recurrences
┌──────────────────────────────────────────────────────────┐
│  Transações Recorrentes              [+ Nova recorrência] │
├──────────────────────────────────────────────────────────┤
│  ATIVAS                                                   │
│  ↑ Salário          mensal · dia 5  R$ 8.500   [···]    │
│  ↓ Aluguel          mensal · dia 10 R$ 2.200   [···]    │
│  ↓ Streaming        mensal · dia 15 R$ 85,90   [···]    │
│  ↓ Academia         mensal · dia 1  R$ 120,00  [···]    │
│                                                           │
│  PAUSADAS / ENCERRADAS (3)              [Mostrar ▼]      │
└──────────────────────────────────────────────────────────┘
```

### 7.2 Formulário de recorrência

Usa o `createRecurrenceSchema` já definido na Fase 1. Adicionalmente:

- Preview da próxima ocorrência calculado client-side ao alterar campos
- Calendário visual mostrando as próximas 3 datas de geração
- Opção "Gerar retroativamente" (checkbox): ao criar uma regra com `starts_on` no passado, oferece gerar as transações faltantes

```typescript
// Preview client-side das próximas N ocorrências
export function getNextOccurrences(
  startsOn: Date,
  frequency: RecurrenceFrequency,
  interval: number,
  dayOfMonth: number | null,
  count: number = 3,
): Date[]
```

### 7.3 Transações pendentes geradas pelo cron

Quando a Edge Function `process-recurrences` gera uma transação `pending`, o usuário deve ser notificado para confirmá-la ou descartá-la.

**Banner de pendências no dashboard:**

```
⚠ Você tem 3 transações recorrentes aguardando confirmação.
[Revisar agora →]
```

**Página de revisão** (`/[workspace]/transactions?status=pending&source=recurrence`):
- Lista filtrada por `status = pending` e `recurrence_id IS NOT NULL`
- Ações rápidas: Confirmar | Descartar (void)
- Botão "Confirmar todas"

---

## 8. Arquitetura de Componentes

### 8.1 Novos componentes — `components/ui/`

| Componente | Descrição |
|-----------|-----------|
| `CurrencyInput` | Input numérico com formatação de moeda em tempo real |
| `DatePicker` | Seletor de data acessível (sem biblioteca externa) |
| `ColorPicker` | Swatches de cor pré-definidas + input hex |
| `IconPicker` | Grid de ícones Lucide para selecionar ícone |
| `Tabs` | Abas com conteúdo (painel de categorias income/expense) |
| `Tooltip` | Tooltip acessível para ícones e truncamentos |
| `EmptyState` | Ilustração + texto + CTA para listas vazias |
| `Skeleton` | Placeholder animado para loading states |
| `ProgressBar` | Barra de progresso com variantes e labels |
| `DropdownMenu` | Menu suspenso de ações (substituir `[···]`) |
| `Pagination` | Navegação entre páginas com cursor |
| `Drawer` | Painel lateral para formulários em mobile |
| `Toggle` | Switch estilizado para opções binárias |
| `Combobox` | Select com busca (para categorias com muitos itens) |

### 8.2 Novos componentes — `components/forms/`

| Componente | Descrição |
|-----------|-----------|
| `FormField` | Wrapper que conecta `Input`/`Select` ao react-hook-form |
| `AmountField` | `CurrencyInput` + campo de moeda + taxa de câmbio (condicional) |
| `DateField` | `DatePicker` integrado ao react-hook-form |
| `CategoryField` | `Combobox` hierárquico filtrado por type |
| `AccountField` | Select de contas com saldo e ícone |

### 8.3 Padrão de Modal/Drawer

Todos os formulários de criação/edição seguem o padrão:

```typescript
// Em desktop: Dialog (modal centralizado)
// Em mobile: Drawer (painel bottom-sheet)
// Decisão automática via hook useBreakpoint()

function useBreakpoint(breakpoint: 'sm' | 'md' | 'lg' = 'md') {
  // Usa window.matchMedia → true se >= breakpoint
}

// Uso:
function TransactionFormModal({ open, onClose, transaction }) {
  const isDesktop = useBreakpoint('md')
  const Container = isDesktop ? Dialog : Drawer
  return <Container open={open} onClose={onClose}>...</Container>
}
```

### 8.4 Padrão de otimismo (`useOptimistic`)

Para listas que sofrem mutações frequentes (transações, contas):

```typescript
// Exemplo em TransactionTable
const [optimisticTransactions, addOptimistic] = useOptimistic(
  transactions,
  (state, action: { type: 'delete'; id: string } | { type: 'update'; tx: Transaction }) => {
    if (action.type === 'delete') return state.filter(t => t.id !== action.id)
    if (action.type === 'update') return state.map(t => t.id === action.tx.id ? action.tx : t)
    return state
  }
)

// Ao deletar:
startTransition(() => {
  addOptimistic({ type: 'delete', id: transactionId })
  deleteTransaction(workspaceId, transactionId) // Server Action
})
```

### 8.5 Padrão de formulário com `react-hook-form`

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTransactionSchema, type CreateTransactionInput } from '../schemas'

export function TransactionForm({ onSuccess, transaction }: TransactionFormProps) {
  const form = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: transaction ?? {
      type: 'expense',
      currency: 'BRL',
      status: 'confirmed',
      date: new Date().toISOString().split('T')[0],
    },
  })

  async function onSubmit(data: CreateTransactionInput) {
    const result = transaction
      ? await updateTransaction(workspaceId, { ...data, id: transaction.id })
      : await createTransaction(workspaceId, data)

    if (!result.ok) {
      form.setError('root', { message: result.error })
      return
    }
    onSuccess?.()
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
```

### 8.6 Dependências a adicionar (Fase 2)

```json
{
  "dependencies": {
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.0",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2"
  }
}
```

> **Nota**: Não adicionar `@radix-ui` nem `shadcn/ui` — o design system próprio criado na Fase 1 cobre os primitivos necessários.

---

## 9. Server Actions — Contratos Completos

### 9.1 Dashboard

```typescript
// features/dashboard/actions.ts — nenhuma mutação aqui (somente queries)
```

### 9.2 Transações

```typescript
// features/transactions/actions.ts

createTransaction(workspaceId: string, data: CreateTransactionInput)
  → ActionResult<{ id: string }>

updateTransaction(workspaceId: string, data: UpdateTransactionInput)
  → ActionResult<{ id: string }>
  // Valida: se status = 'reconciled', só permite atualizar description e notes
  // Valida: category.type deve ser igual a transaction.type

voidTransaction(workspaceId: string, transactionId: string)
  → ActionResult
  // SET status = 'void' WHERE id = transactionId AND status != 'reconciled'

deleteTransaction(workspaceId: string, transactionId: string)
  → ActionResult
  // SET deleted_at = now() (soft delete)
  // Proibido para status = 'reconciled'

confirmTransaction(workspaceId: string, transactionId: string)
  → ActionResult
  // SET status = 'confirmed' WHERE status = 'pending'

bulkDeleteTransactions(workspaceId: string, ids: string[])
  → ActionResult<{ affected: number }>

bulkConfirmTransactions(workspaceId: string, ids: string[])
  → ActionResult<{ affected: number }>

createCardTransaction(workspaceId: string, data: CardTransactionInput)
  → ActionResult<{ ids: string[] }>
  // Para N parcelas, cria N transações + N card_transactions
```

### 9.3 Contas

```typescript
// features/accounts/actions.ts

createAccount(workspaceId: string, data: CreateAccountInput)
  → ActionResult<{ id: string }>
  // Verifica limite do plano
  // Se opening_balance > 0, cria transação opening_balance

updateAccount(workspaceId: string, accountId: string, data: UpdateAccountInput)
  → ActionResult
  // Não permite alterar currency se já houver transações

archiveAccount(workspaceId: string, accountId: string)
  → ActionResult
  // SET is_active = false

deleteAccount(workspaceId: string, accountId: string)
  → ActionResult
  // Verifica: 0 transações não deletadas
  // Se > 0: retorna { ok: false, code: 'HAS_TRANSACTIONS' }

reorderAccounts(workspaceId: string, orderedIds: string[])
  → ActionResult
  // UPDATE em batch: sort_order = index(id)
```

### 9.4 Categorias

```typescript
// features/categories/actions.ts

createCategory(workspaceId: string, data: CreateCategoryInput)
  → ActionResult<{ id: string }>
  // Valida: max 2 níveis
  // Valida: parent tem mesmo type que filho

updateCategory(workspaceId: string, categoryId: string, data: UpdateCategoryInput)
  → ActionResult
  // Se is_system: só permite alterar name, color, icon
  // Não permite alterar type se houver transações vinculadas

deleteCategory(workspaceId: string, categoryId: string)
  → ActionResult
  // Se is_system = true: proibido
  // Se há transações: retorna { ok: false, code: 'HAS_TRANSACTIONS', count: N }

mergeAndDeleteCategory(
  workspaceId: string,
  sourceCategoryId: string,
  targetCategoryId: string,
)
  → ActionResult<{ transactionsMoved: number }>
```

### 9.5 Cartões de Crédito

```typescript
// features/cards/actions.ts

createCreditCard(workspaceId: string, data: CreditCardFormFields)
  → ActionResult<{ id: string }>
  // Cria o cartão
  // Gera a primeira fatura 'open' para o período corrente

updateCreditCard(workspaceId: string, cardId: string, data: Partial<CreditCardFormFields>)
  → ActionResult

archiveCreditCard(workspaceId: string, cardId: string)
  → ActionResult
  // SET is_active = false
  // Não permite se houver fatura open com transações

payInvoice(
  workspaceId: string,
  invoiceId: string,
  paymentAccountId: string,
  paidAmount: number,
  paymentDate: string,
)
  → ActionResult<{ transactionId: string }>
```

### 9.6 Recorrências

```typescript
// features/recurrences/actions.ts

createRecurrence(workspaceId: string, data: CreateRecurrenceInput)
  → ActionResult<{ id: string }>

updateRecurrence(workspaceId: string, recurrenceId: string, data: Partial<CreateRecurrenceInput>)
  → ActionResult
  // Alterações só afetam ocorrências futuras (next_occurrence em diante)

pauseRecurrence(workspaceId: string, recurrenceId: string)
  → ActionResult
  // SET is_active = false

resumeRecurrence(workspaceId: string, recurrenceId: string)
  → ActionResult
  // SET is_active = true
  // Recalcular next_occurrence se estava pausada por muito tempo

deleteRecurrence(workspaceId: string, recurrenceId: string)
  → ActionResult
  // Deleta a regra; transações já geradas NÃO são afetadas
  // Confirmar com o usuário antes (dialog de aviso)

generateRetroactiveTransactions(workspaceId: string, recurrenceId: string)
  → ActionResult<{ generated: number }>
  // Para cada data entre starts_on e hoje que não tem transação gerada,
  // cria transação com status = 'pending'
  // Máximo 24 transações retroativas por chamada (proteção contra abuse)
```

---

## 10. Estrutura de Pastas — Adições

```
apps/web/
├── app/
│   └── (app)/
│       └── [workspace]/
│           ├── cards/                        ← expandir (já existe scaffold)
│           │   └── [id]/
│           │       └── page.tsx              ← implementar detalhe completo
│           └── recurrences/                  ← NOVO
│               └── page.tsx
│
├── components/
│   └── ui/
│       ├── CurrencyInput.tsx                 ← NOVO
│       ├── DatePicker.tsx                    ← NOVO
│       ├── ColorPicker.tsx                   ← NOVO
│       ├── IconPicker.tsx                    ← NOVO
│       ├── Tabs.tsx                          ← NOVO
│       ├── Tooltip.tsx                       ← NOVO
│       ├── EmptyState.tsx                    ← NOVO
│       ├── Skeleton.tsx                      ← NOVO
│       ├── ProgressBar.tsx                   ← NOVO
│       ├── DropdownMenu.tsx                  ← NOVO
│       ├── Pagination.tsx                    ← NOVO
│       ├── Drawer.tsx                        ← NOVO
│       ├── Toggle.tsx                        ← NOVO
│       └── Combobox.tsx                      ← NOVO
│
│   └── forms/
│       ├── FormField.tsx                     ← NOVO
│       ├── AmountField.tsx                   ← NOVO
│       ├── DateField.tsx                     ← NOVO
│       ├── CategoryField.tsx                 ← NOVO
│       └── AccountField.tsx                  ← NOVO
│
│   └── charts/                               ← NOVO (todos)
│       ├── CashFlowChart.tsx                 ← barras diárias (Recharts)
│       └── ExpenseDonutChart.tsx             ← pizza por categoria (Recharts)
│
│   └── layout/
│       └── MonthNavigator.tsx                ← NOVO
│
├── features/
│   ├── dashboard/                            ← NOVO
│   │   ├── queries.ts
│   │   └── components/
│   │       ├── StatCard.tsx
│   │       ├── RecentTransactions.tsx
│   │       └── OpenInvoicesWidget.tsx
│   │
│   ├── transactions/
│   │   ├── actions.ts                        ← expandir
│   │   ├── queries.ts                        ← expandir (cursor pagination, fulltext)
│   │   └── components/
│   │       ├── TransactionTable.tsx          ← expandir
│   │       ├── TransactionRow.tsx            ← NOVO
│   │       ├── TransactionForm.tsx           ← NOVO (modal completo)
│   │       ├── TransferForm.tsx              ← NOVO
│   │       ├── TransactionFilters.tsx        ← NOVO
│   │       └── BulkActionsBar.tsx            ← NOVO
│   │
│   ├── accounts/
│   │   ├── actions.ts                        ← expandir
│   │   ├── queries.ts                        ← NOVO
│   │   └── components/
│   │       ├── AccountList.tsx               ← NOVO (com drag-and-drop)
│   │       ├── AccountCard.tsx               ← NOVO
│   │       └── AccountForm.tsx               ← NOVO (modal)
│   │
│   ├── categories/
│   │   ├── actions.ts                        ← NOVO
│   │   ├── queries.ts                        ← NOVO
│   │   └── components/
│   │       ├── CategoryTree.tsx              ← NOVO
│   │       ├── CategoryForm.tsx              ← NOVO
│   │       ├── CategoryMergeDialog.tsx       ← NOVO
│   │       ├── CategoryBadge.tsx             ← NOVO
│   │       └── CategorySelect.tsx            ← NOVO (Combobox hierárquico)
│   │
│   ├── cards/
│   │   ├── actions.ts                        ← NOVO
│   │   ├── queries.ts                        ← NOVO
│   │   └── components/
│   │       ├── CardList.tsx                  ← NOVO
│   │       ├── CardDetail.tsx                ← NOVO
│   │       ├── CardForm.tsx                  ← NOVO
│   │       ├── InvoiceList.tsx               ← NOVO
│   │       ├── InvoiceDetail.tsx             ← NOVO
│   │       ├── PayInvoiceDialog.tsx          ← NOVO
│   │       └── CardTransactionForm.tsx       ← NOVO (com parcelamento)
│   │
│   └── recurrences/
│       ├── actions.ts                        ← NOVO
│       ├── queries.ts                        ← NOVO
│       └── components/
│           ├── RecurrenceList.tsx            ← NOVO
│           ├── RecurrenceForm.tsx            ← NOVO
│           └── PendingTransactionsBar.tsx    ← NOVO (banner no dashboard)
│
├── lib/
│   └── utils/
│       └── recurrence.ts                     ← NOVO (getNextOccurrences, etc.)
│
└── packages/
    └── database/
        └── migrations/
            └── 019_search_index.sql          ← NOVO (full-text search)
```

---

## 11. Backlog Técnico — Sprints 2 e 3

**Sprint 2** foca em Dashboard + Transações + Contas + Categorias.
**Sprint 3** foca em Cartões de Crédito + Recorrências.

**Duração estimada por sprint**: 2 semanas | **Critério de saída**: todas as features da sprint funcionando em staging com testes passando.

---

### Sprint 2 — Dashboard, Transações, Contas e Categorias (2 semanas)

#### Epic 6: Dashboard (Dias 1–3)

| # | Tarefa | Dep. | Est. | Critério de Aceite |
|---|--------|------|------|--------------------|
| 6.1 | Queries: KPIs, fluxo de caixa, top categorias, net worth | Fase 1 | 3h | Queries retornam dados corretos para o mês ativo |
| 6.2 | Componente `StatCard` com tendência % | 6.1 | 2h | Exibe valor, variação positiva/negativa e cor correta |
| 6.3 | `CashFlowChart` com Recharts (barras diárias) | 6.1 | 3h | Gráfico renderiza com dados reais; responsivo |
| 6.4 | `ExpenseDonutChart` por categoria | 6.1 | 2h | Donut com legenda, truncamento de labels, tooltip |
| 6.5 | `MonthNavigator` + integração com store | — | 2h | Navegar mês altera dados de todos os widgets |
| 6.6 | Widget de últimas transações | 6.1 | 1h | Exibe 5 transações mais recentes com link para lista |
| 6.7 | Widget de faturas abertas de cartão | 6.1 | 1h | Exibe faturas open/overdue com valor e vencimento |
| 6.8 | Recharts como dependência; Suspense por widget | 6.2–6.7 | 1h | Cada widget tem skeleton independente |

#### Epic 7: Novos componentes UI (Dias 1–4, paralelo)

| # | Tarefa | Dep. | Est. | Critério de Aceite |
|---|--------|------|------|--------------------|
| 7.1 | `CurrencyInput` com formatação em tempo real | — | 2h | Digitar "1234" exibe "R$ 1.234,00"; parseia corretamente |
| 7.2 | `DatePicker` acessível (sem lib externa) | — | 3h | Navegação por teclado; funciona em mobile |
| 7.3 | `DropdownMenu` com ações | — | 2h | Fecha ao clicar fora ou Esc; acessível (role=menu) |
| 7.4 | `Skeleton` e `EmptyState` | — | 1h | Skeleton anima; EmptyState exibe ícone + CTA |
| 7.5 | `Tooltip` | — | 1h | Aparece em hover/focus; não ultrapassa viewport |
| 7.6 | `Tabs` | — | 1h | Troca conteúdo sem rerenderizar; acessível (ARIA) |
| 7.7 | `ProgressBar` com variantes | — | 1h | Exibe % com cor por faixa (verde/amarelo/vermelho) |
| 7.8 | `Combobox` com busca | — | 3h | Filtra opções em tempo real; acessível; suporta grupos |
| 7.9 | `Drawer` (bottom-sheet mobile) | — | 2h | Abre com animação; fecha com swipe ou Esc |
| 7.10 | `FormField` + `AmountField` + `DateField` | 7.1, 7.2 | 2h | Integração com react-hook-form sem prop drilling |

#### Epic 8: Transações — CRUD completo (Dias 4–8)

| # | Tarefa | Dep. | Est. | Critério de Aceite |
|---|--------|------|------|--------------------|
| 8.1 | Migração 019: índice full-text em transactions | — | 30min | `supabase db push` sem erros |
| 8.2 | `TransactionFilters` com URL params | — | 3h | Filtrar por tipo, status, conta, categoria, período e texto |
| 8.3 | `TransactionForm` modal completo (income/expense) | 7.1,7.2,7.10 | 5h | Validação Zod em tempo real; submit cria/edita corretamente |
| 8.4 | `TransferForm` modal | 8.3 | 2h | Cria par de transações ACID; contas origem ≠ destino |
| 8.5 | `TransactionRow` com ações inline | 7.3 | 2h | Confirmar, estornar, deletar funcionam com feedback |
| 8.6 | Otimismo com `useOptimistic` na lista | 8.3–8.5 | 2h | Delete atualiza a UI instantaneamente sem reload |
| 8.7 | Paginação cursor-based | — | 3h | "Carregar mais" busca próxima página corretamente |
| 8.8 | Busca full-text integrada ao filtro | 8.1, 8.2 | 2h | Buscar "mercado" retorna transações com essa palavra |
| 8.9 | Bulk actions (selecionar + deletar/confirmar) | 8.5 | 2h | Checkbox de seleção múltipla; barra de ações em lote |
| 8.10 | Testes: schemas, actions, componente Table | — | 3h | ≥ 25 casos cobrindo validações e ações |

#### Epic 9: Contas (Dias 7–9)

| # | Tarefa | Dep. | Est. | Critério de Aceite |
|---|--------|------|------|--------------------|
| 9.1 | `AccountList` com drag-and-drop (@dnd-kit) | — | 4h | Reordenar persiste; lista separada ativas/arquivadas |
| 9.2 | `AccountCard` com saldo, tipo e ações | 7.3 | 2h | Exibe saldo atualizado; ícone + cor configuráveis |
| 9.3 | `AccountForm` modal (criar + editar) | 7.1,7.10 | 3h | Criar com saldo inicial gera transação opening_balance |
| 9.4 | Action: arquivar conta | 9.1 | 1h | Conta vai para seção "Arquivadas"; não some |
| 9.5 | Action: deletar conta (validação de transações) | 9.1 | 1h | Bloqueia com mensagem clara se houver transações |
| 9.6 | `ColorPicker` + `IconPicker` para contas/categorias | — | 2h | Swatches + input hex; grid de ícones pesquisável |
| 9.7 | Testes: actions de conta | — | 2h | Testar limite de plano, opening_balance, archivamento |

#### Epic 10: Categorias (Dias 9–12)

| # | Tarefa | Dep. | Est. | Critério de Aceite |
|---|--------|------|------|--------------------|
| 10.1 | `CategoryTree` com grupos income/expense | 7.6 | 4h | Expansível; indica is_system; reordenar dentro do grupo |
| 10.2 | `CategoryForm` modal | 9.6, 7.10 | 3h | Criar pai e subcategoria; validar máx 2 níveis |
| 10.3 | `CategoryBadge` com cor e ícone | — | 1h | Renderiza em TransactionTable, TransactionForm, etc. |
| 10.4 | `CategorySelect` (Combobox hierárquico) | 7.8 | 2h | Filtra por type; exibe pai > filho indentado |
| 10.5 | Action: deletar com verificação de transações | — | 1h | Retorna count de transações afetadas |
| 10.6 | `CategoryMergeDialog` + action merge | 10.4 | 3h | Remapeia transações para categoria destino antes de deletar |
| 10.7 | Integrar `CategorySelect` no `TransactionForm` | 10.4, 8.3 | 1h | Filtrado pelo type da transação em tempo real |
| 10.8 | Testes: actions de categoria (merge, delete, max depth) | — | 2h | ≥ 15 casos |

---

### Sprint 3 — Cartões de Crédito e Recorrências (2 semanas)

#### Epic 11: Cartões de Crédito (Dias 1–8)

| # | Tarefa | Dep. | Est. | Critério de Aceite |
|---|--------|------|------|--------------------|
| 11.1 | Queries: cartões, faturas, transações da fatura | — | 2h | Dados corretos por período; current_balance calculado |
| 11.2 | `CardList` com utilização e status da fatura | 7.7, 11.1 | 3h | Barra de utilização com cor por faixa; status de fatura |
| 11.3 | `CardForm` modal (criar + editar) | 7.10 | 3h | Criar cartão gera fatura open para o período corrente |
| 11.4 | Página detalhe `/cards/[id]` com lista de faturas | 11.1 | 4h | Selecionar fatura exibe suas transações; layout split |
| 11.5 | `CardTransactionForm` com parcelamento | 8.3 | 4h | Criar 1 ou N parcelas; preview do calendário de vencimentos |
| 11.6 | Algoritmo `getInvoiceForDate` | — | 2h | Encontra ou cria fatura correta para a data do lançamento |
| 11.7 | `PayInvoiceDialog` (valor + conta + data) | 7.10 | 3h | Pagamento total marca fatura como 'paid' e reconcilia txs |
| 11.8 | Indicador de utilização visual (`ProgressBar`) | 7.7 | 1h | Verde < 30%, amarelo 30–70%, vermelho > 70% |
| 11.9 | Integrar lançamento de cartão no `TransactionForm` | 11.5, 11.6 | 2h | Ao selecionar conta tipo cartão, exibir campos de parcelamento |
| 11.10 | Testes: ciclo completo de fatura + pagamento | — | 4h | ≥ 20 casos (criar, lançar, parcelar, pagar, reconciliar) |

#### Epic 12: Recorrências (Dias 7–12)

| # | Tarefa | Dep. | Est. | Critério de Aceite |
|---|--------|------|------|--------------------|
| 12.1 | `RecurrenceList` com status ativa/pausada | — | 2h | Ativas e pausadas separadas; ações de menu |
| 12.2 | `RecurrenceForm` modal com preview de próximas datas | — | 4h | Mostra próximas 3 ocorrências ao preencher campos |
| 12.3 | Action: criar, pausar, retomar, deletar | — | 2h | Pausar não exclui transações geradas |
| 12.4 | Opção "Gerar retroativamente" no formulário | 12.2 | 2h | Máx 24 transações; todas geradas como 'pending' |
| 12.5 | `PendingTransactionsBar` no dashboard | 12.3 | 2h | Banner conta transações pending com recurrence_id |
| 12.6 | Página de revisão de pendentes (filtro especial) | 8.2 | 1h | Lista com confirmar/descartar em lote |
| 12.7 | Helper `getNextOccurrences` com testes | — | 2h | ≥ 10 casos cobrindo todos os tipos de frequência |
| 12.8 | Testes: actions de recorrência + geração retroativa | — | 3h | ≥ 15 casos |

#### Epic 13: Qualidade e Deploy Sprint 3 (Dias 13–14)

| # | Tarefa | Dep. | Est. | Critério de Aceite |
|---|--------|------|------|--------------------|
| 13.1 | Cobertura de testes ≥ 70% em todos os módulos novos | — | 4h | `pnpm test --coverage` verde |
| 13.2 | Lighthouse CI no GitHub Actions (score ≥ 80) | — | 2h | Performance, Acessibilidade e Best Practices ≥ 80 |
| 13.3 | Testes E2E críticos com Playwright: login → criar tx → ver dashboard | — | 4h | Fluxo principal funciona em Chromium e Firefox |
| 13.4 | Deploy staging + smoke test manual | — | 1h | Todas as features da Sprint 2 e 3 funcionando |
| 13.5 | Atualizar README e documentação de componentes | — | 1h | Storybook ou comentários JSDoc nos componentes |

---

### Dependências críticas entre epics

```
Epic 6 (Dashboard)
  └→ Depende das queries de transactions e accounts (Fase 1 OK)

Epic 7 (UI Components)
  └→ Independente — pode rodar em paralelo com qualquer epic

Epic 8 (Transações)
  └→ Depende de Epic 7 (CurrencyInput, DatePicker, FormField)
  └→ Depende de Epic 10.4 (CategorySelect) para o form completo

Epic 9 (Contas)
  └→ Depende de Epic 7 (ColorPicker, IconPicker)

Epic 10 (Categorias)
  └→ Depende de Epic 7 (Combobox)
  └→ Bloqueia Epic 8.3 (TransactionForm com CategorySelect)

Epic 11 (Cartões)
  └→ Depende de Epic 8 (TransactionForm como base)
  └→ Depende de Epic 9 (AccountField para seleção de conta)

Epic 12 (Recorrências)
  └→ Depende de Epic 8 (TransactionForm para formulário de regra)
  └→ Depende de Epic 6 (dashboard para o banner de pendentes)
```

---

### Definição de "pronto" (DoD) — Sprints 2 e 3

- [ ] Código revisado em PR (nenhum merge direto na main)
- [ ] `pnpm lint` e `tsc --noEmit` sem erros
- [ ] Cobertura ≥ 70% em todos os módulos novos
- [ ] Lighthouse score ≥ 80 em Performance e Acessibilidade
- [ ] Testes E2E cobrindo o fluxo crítico (login → transação → dashboard)
- [ ] Nenhuma regressão nas features da Fase 1 (CI verde)
- [ ] Deploy funcionando em staging com dados de seed

---

*Próximo passo após validação desta spec: iniciar Epic 7 (componentes UI) em paralelo com Epic 6 (Dashboard queries), seguindo a ordem de dependências definida acima.*
