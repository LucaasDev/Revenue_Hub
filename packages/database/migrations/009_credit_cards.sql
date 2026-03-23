-- ============================================================
-- 009_credit_cards.sql — Cartão de crédito
-- ============================================================

create table credit_cards (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  account_id      uuid not null references accounts(id) on delete restrict,
  created_by      uuid not null references profiles(id),

  name            text not null check (char_length(name) between 1 and 100),
  brand           card_brand not null default 'other',
  last_four       char(4) check (last_four ~ '^\d{4}$'),
  credit_limit    numeric(15,2) not null check (credit_limit > 0),
  current_balance numeric(15,2) not null default 0,

  closing_day     int not null check (closing_day between 1 and 28),
  due_day         int not null check (due_day between 1 and 28),

  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Índices
create index credit_cards_workspace_id_idx on credit_cards(workspace_id);
create index credit_cards_account_id_idx on credit_cards(account_id);
create index credit_cards_workspace_active_idx on credit_cards(workspace_id, is_active);
