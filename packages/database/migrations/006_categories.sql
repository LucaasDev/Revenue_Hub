-- ============================================================
-- 006_categories.sql — Categorias hierárquicas (2 níveis)
-- ============================================================

create table categories (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  parent_id     uuid references categories(id) on delete restrict,
  name          text not null check (char_length(name) between 1 and 80),
  type          category_type not null,
  icon          text,
  color         char(7),
  is_system     boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),

  constraint categories_color_format check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  -- Subcategoria não pode ter filhos (máximo 2 níveis)
  constraint categories_max_depth check (
    parent_id is null or not exists (
      select 1 from categories p where p.id = parent_id and p.parent_id is not null
    )
  )
);

comment on column categories.is_system is 'Categorias padrão seed. Não podem ser deletadas, apenas ocultadas.';
comment on column categories.parent_id is 'Self-reference. Máximo 2 níveis de hierarquia.';

-- Índices
create index categories_workspace_id_idx on categories(workspace_id);
create index categories_workspace_type_idx on categories(workspace_id, type);
create index categories_parent_id_idx on categories(parent_id);
create index categories_workspace_system_idx on categories(workspace_id, is_system);
