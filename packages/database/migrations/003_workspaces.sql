-- ============================================================
-- 003_workspaces.sql — Unidade de tenant
-- ============================================================

create table workspaces (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 100),
  slug          text not null unique check (slug ~ '^[a-z0-9-]{3,50}$'),
  plan          workspace_plan not null default 'free',
  owner_id      uuid not null references profiles(id),
  currency_base char(3) not null default 'BRL',
  deleted_at    timestamptz,           -- soft delete
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table workspaces is 'Unidade de tenant. Todo dado de negócio pertence a um workspace.';
comment on column workspaces.slug is 'Identificador único imutável após criação.';
comment on column workspaces.currency_base is 'Moeda base para normalização de valores (amount_in_base).';
comment on column workspaces.deleted_at is 'Soft delete. Dados retidos por 30 dias antes de expurgo.';

-- Índices
create index workspaces_owner_id_idx on workspaces(owner_id);
create index workspaces_deleted_at_idx on workspaces(deleted_at) where deleted_at is null;
