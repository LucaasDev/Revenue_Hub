-- ============================================================
-- 015_audit_logs.sql — Trilha de auditoria imutável (insert-only)
-- ============================================================

create table audit_logs (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references workspaces(id) on delete set null,
  user_id       uuid references profiles(id) on delete set null,

  action        text not null,      -- 'create', 'update', 'delete', 'login', etc.
  table_name    text not null,
  record_id     uuid,
  old_values    jsonb,
  new_values    jsonb,
  ip_address    inet,
  user_agent    text,

  created_at    timestamptz not null default now()
);

-- Índices (read-heavy para queries do painel admin)
create index audit_logs_workspace_id_idx on audit_logs(workspace_id);
create index audit_logs_user_id_idx on audit_logs(user_id);
create index audit_logs_created_at_idx on audit_logs(created_at desc);
create index audit_logs_table_record_idx on audit_logs(table_name, record_id);
