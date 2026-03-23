-- ============================================================
-- 008_recurrence_rules.sql — Regras de transações recorrentes
-- ============================================================

create table recurrence_rules (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  account_id    uuid not null references accounts(id) on delete restrict,
  category_id   uuid references categories(id) on delete set null,
  created_by    uuid not null references profiles(id),

  description   text not null check (char_length(description) between 1 and 255),
  type          transaction_type not null check (type in ('income', 'expense')),
  amount        numeric(15,2) not null check (amount > 0),
  currency      char(3) not null default 'BRL',

  -- Configuração de repetição
  frequency     recurrence_frequency not null,
  interval      int not null default 1 check (interval between 1 and 12),
  day_of_month  int check (day_of_month between 1 and 28),  -- 28 para evitar problemas com fev.

  -- Período de vigência
  starts_on         date not null,
  ends_on           date,  -- null = infinita
  next_occurrence   date not null,
  last_generated    date,

  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint recurrence_ends_after_starts check (ends_on is null or ends_on > starts_on),
  constraint recurrence_next_occurrence_valid check (ends_on is null or next_occurrence <= ends_on)
);

comment on column recurrence_rules.day_of_month is 'Máximo 28 para garantir validade em todos os meses, incluindo fevereiro.';
comment on column recurrence_rules.next_occurrence is 'Atualizado pelo cron job após cada geração. Indexado para performance.';
comment on column recurrence_rules.interval is 'A cada N períodos. Ex: frequency=monthly, interval=2 = bimestral.';

-- Índices
create index recurrence_workspace_active_idx on recurrence_rules(workspace_id, is_active);
create index recurrence_next_occurrence_idx on recurrence_rules(next_occurrence) where is_active = true;
create index recurrence_account_id_idx on recurrence_rules(account_id);
