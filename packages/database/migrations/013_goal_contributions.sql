-- ============================================================
-- 013_goal_contributions.sql — Aportes a metas
-- ============================================================

create table goal_contributions (
  id              uuid primary key default gen_random_uuid(),
  goal_id         uuid not null references goals(id) on delete cascade,
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  transaction_id  uuid references transactions(id) on delete set null,
  created_by      uuid not null references profiles(id),

  amount          numeric(15,2) not null check (amount > 0),
  date            date not null,
  notes           text check (char_length(notes) <= 500),

  created_at      timestamptz not null default now()
);

-- Índices
create index goal_contributions_goal_id_idx on goal_contributions(goal_id);
create index goal_contributions_workspace_id_idx on goal_contributions(workspace_id);
create index goal_contributions_date_idx on goal_contributions(goal_id, date desc);
