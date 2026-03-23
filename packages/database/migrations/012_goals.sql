-- ============================================================
-- 012_goals.sql — Metas financeiras
-- ============================================================

create table goals (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null references workspaces(id) on delete cascade,
  account_id           uuid references accounts(id) on delete set null,
  created_by           uuid not null references profiles(id),

  name                 text not null check (char_length(name) between 1 and 100),
  description          text check (char_length(description) <= 500),
  icon                 text,
  color                char(7),

  target_amount        numeric(15,2) not null check (target_amount > 0),
  current_amount       numeric(15,2) not null default 0 check (current_amount >= 0),
  target_date          date,

  status               goal_status not null default 'active',
  strategy             goal_strategy not null default 'manual',
  monthly_contribution numeric(15,2) check (monthly_contribution >= 0),

  completed_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint goals_color_format check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint goals_current_lte_target check (current_amount <= target_amount * 1.05) -- permite 5% de overflow
);

-- Índices
create index goals_workspace_id_idx on goals(workspace_id);
create index goals_workspace_status_idx on goals(workspace_id, status);
create index goals_account_id_idx on goals(account_id) where account_id is not null;
