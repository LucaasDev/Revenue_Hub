-- ============================================================
-- 004_workspace_members.sql — Vínculo usuário ↔ workspace
-- ============================================================

create table workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  role          workspace_role not null default 'member',
  invited_by    uuid references profiles(id),
  joined_at     timestamptz not null default now(),

  constraint workspace_members_unique unique (workspace_id, user_id)
);

comment on table workspace_members is 'Vínculo usuário ↔ workspace com role. Um usuário pode ter roles diferentes em workspaces distintos.';

-- Índices
create index workspace_members_workspace_id_idx on workspace_members(workspace_id);
create index workspace_members_user_id_idx on workspace_members(user_id);
create index workspace_members_role_idx on workspace_members(workspace_id, role);
