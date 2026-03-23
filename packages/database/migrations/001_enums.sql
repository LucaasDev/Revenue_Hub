-- ============================================================
-- 001_enums.sql — Tipos enumerados do sistema
-- ============================================================

-- Tipo de plano do workspace
create type workspace_plan as enum ('free', 'pro', 'family');

-- Roles dentro de um workspace
create type workspace_role as enum ('owner', 'admin', 'member');

-- Tipo de conta financeira
create type account_type as enum (
  'checking',     -- conta corrente
  'savings',      -- poupança
  'wallet',       -- carteira / dinheiro em espécie
  'investment',   -- investimento
  'other'
);

-- Tipo de transação
create type transaction_type as enum (
  'income',           -- receita
  'expense',          -- despesa
  'transfer',         -- transferência entre contas do mesmo workspace
  'opening_balance'   -- saldo inicial ao criar conta
);

-- Status de uma transação
create type transaction_status as enum (
  'pending',      -- lançada mas não confirmada (ex: recorrência futura)
  'confirmed',    -- confirmada, afeta saldo
  'reconciled',   -- conciliada com extrato bancário — imutável
  'void'          -- cancelada — não afeta saldo
);

-- Tipo de categoria
create type category_type as enum ('income', 'expense');

-- Frequência de recorrência
create type recurrence_frequency as enum (
  'daily',
  'weekly',
  'biweekly',   -- quinzenal
  'monthly',
  'bimonthly',  -- bimestral
  'quarterly',
  'yearly'
);

-- Status de meta financeira
create type goal_status as enum ('active', 'paused', 'completed', 'cancelled');

-- Estratégia de aporte em meta
create type goal_strategy as enum (
  'fixed_monthly',      -- aporte fixo por mês
  'percentage_income',  -- % da receita mensal
  'manual'              -- sem automação
);

-- Status de fatura de cartão
create type invoice_status as enum (
  'open',     -- período em aberto (ainda recebendo transações)
  'closed',   -- período encerrado, aguardando pagamento
  'paid',     -- fatura paga
  'overdue'   -- fatura vencida e não paga
);

-- Marca do cartão
create type card_brand as enum (
  'visa', 'mastercard', 'elo', 'amex', 'hipercard', 'other'
);
