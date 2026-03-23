-- ============================================================
-- 007_transactions.sql — Entidade central de movimentação
-- ============================================================

create table transactions (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  account_id        uuid not null references accounts(id) on delete restrict,
  category_id       uuid references categories(id) on delete set null,
  created_by        uuid not null references profiles(id),
  recurrence_id     uuid references recurrence_rules(id) on delete set null,

  -- Dados financeiros
  type              transaction_type not null,
  amount            numeric(15,2) not null check (amount > 0),
  currency          char(3) not null default 'BRL',
  amount_in_base    numeric(15,2) not null,   -- normalizado para currency_base do workspace
  exchange_rate     numeric(10,6) not null default 1,

  -- Metadados
  description       text not null check (char_length(description) between 1 and 255),
  notes             text check (char_length(notes) <= 2000),
  date              date not null,
  status            transaction_status not null default 'confirmed',

  -- Transferência
  is_transfer       boolean not null default false,
  transfer_peer_id  uuid references transactions(id) on delete set null,

  -- Soft delete
  deleted_at        timestamptz,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Constraints de negócio
  constraint transactions_transfer_has_peer check (
    not is_transfer or transfer_peer_id is not null
  ),
  constraint transactions_opening_balance_once check (
    type != 'opening_balance' or (
      not exists (
        select 1 from transactions t2
        where t2.account_id = account_id
          and t2.type = 'opening_balance'
          and t2.id != id
          and t2.deleted_at is null
      )
    )
  )
);

comment on column transactions.amount is 'Sempre positivo. O tipo (income/expense) define a direção.';
comment on column transactions.amount_in_base is 'Valor convertido para moeda base do workspace. Atualizado por trigger.';
comment on column transactions.transfer_peer_id is 'Auto-referência para o par de transferência. Ambos os registros são criados na mesma operação.';

-- Índices (priorizando queries mais comuns)
create index transactions_workspace_date_idx on transactions(workspace_id, date desc) where deleted_at is null;
create index transactions_account_date_idx on transactions(account_id, date desc) where deleted_at is null;
create index transactions_workspace_category_idx on transactions(workspace_id, category_id) where deleted_at is null;
create index transactions_recurrence_id_idx on transactions(recurrence_id) where recurrence_id is not null;
create index transactions_status_idx on transactions(workspace_id, status) where deleted_at is null;
create index transactions_transfer_peer_idx on transactions(transfer_peer_id) where transfer_peer_id is not null;
create index transactions_deleted_at_idx on transactions(deleted_at) where deleted_at is null;
