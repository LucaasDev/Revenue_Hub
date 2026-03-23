-- ============================================================
-- 014_budgets.sql — Orçamento por categoria por mês
-- ============================================================

create table budgets (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references workspaces(id) on delete cascade,
  category_id      uuid not null references categories(id) on delete cascade,

  year             int not null check (year between 2000 and 2100),
  month            int not null check (month between 1 and 12),
  amount_planned   numeric(15,2) not null check (amount_planned > 0),

  -- Calculado via materialized view ou trigger
  amount_spent     numeric(15,2) not null default 0 check (amount_spent >= 0),

  -- Percentual do planejado para disparar alerta (ex: 80 = 80%)
  alert_threshold  int not null default 80 check (alert_threshold between 1 and 100),

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint budgets_unique unique (workspace_id, category_id, year, month)
);

-- Índices
create index budgets_workspace_period_idx on budgets(workspace_id, year, month);
create index budgets_category_id_idx on budgets(category_id);
