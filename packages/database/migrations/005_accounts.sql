-- ============================================================
-- 005_accounts.sql — Conta financeira
-- ============================================================

create table accounts (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references workspaces(id) on delete cascade,
  created_by            uuid not null references profiles(id),
  name                  text not null check (char_length(name) between 1 and 100),
  type                  account_type not null,
  institution           text check (char_length(institution) <= 100),
  balance               numeric(15,2) not null default 0,
  currency              char(3) not null default 'BRL',
  color                 char(7),   -- hex color, ex: '#3B82F6'
  icon                  text,      -- nome do ícone no design system
  is_active             boolean not null default true,
  include_in_net_worth  boolean not null default true,
  sort_order            int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint accounts_color_format check (color is null or color ~ '^#[0-9A-Fa-f]{6}$')
);

comment on column accounts.balance is 'Calculado automaticamente por trigger. Nunca editar diretamente.';
comment on column accounts.include_in_net_worth is 'Se false, exclui da tela de patrimônio líquido (ex: conta conjunta já contabilizada).';

-- Índices
create index accounts_workspace_id_idx on accounts(workspace_id);
create index accounts_workspace_active_idx on accounts(workspace_id, is_active);
create index accounts_workspace_sort_idx on accounts(workspace_id, sort_order);
