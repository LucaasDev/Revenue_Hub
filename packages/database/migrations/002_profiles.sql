-- ============================================================
-- 002_profiles.sql — Perfil público do usuário
-- ============================================================

create table profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text not null,
  avatar_url        text,
  currency_default  char(3) not null default 'BRL',
  is_super_admin    boolean not null default false,
  preferences       jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table profiles is 'Perfil público do usuário. Espelha e estende auth.users.';
comment on column profiles.is_super_admin is 'Acesso ao painel de administração global. Definido manualmente.';
comment on column profiles.preferences is 'JSON livre: tema, idioma, notificações, etc.';

-- Índices
create index profiles_is_super_admin_idx on profiles(is_super_admin) where is_super_admin = true;
