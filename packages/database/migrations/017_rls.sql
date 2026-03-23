-- ============================================================
-- 017_rls.sql — Row Level Security (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas de negócio
alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table recurrence_rules enable row level security;
alter table credit_cards enable row level security;
alter table card_invoices enable row level security;
alter table card_transactions enable row level security;
alter table goals enable row level security;
alter table goal_contributions enable row level security;
alter table budgets enable row level security;
alter table audit_logs enable row level security;

-- ============================================================
-- HELPER FUNCTIONS (security definer = rodam como superuser,
-- mas o corpo verifica auth.uid() — seguro e performático)
-- ============================================================

-- Verifica se o usuário autenticado é membro do workspace com role mínimo
create or replace function is_workspace_member(
  ws_id uuid,
  min_role workspace_role default 'member'
)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from workspace_members wm
    join workspaces w on w.id = wm.workspace_id
    where wm.workspace_id = ws_id
      and wm.user_id = auth.uid()
      and w.deleted_at is null
      and wm.role = any(
        case min_role
          when 'owner'  then array['owner']::workspace_role[]
          when 'admin'  then array['owner','admin']::workspace_role[]
          else               array['owner','admin','member']::workspace_role[]
        end
      )
  )
$$;

-- Verifica se o usuário é super_admin
create or replace function is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_super_admin from profiles where id = auth.uid()),
    false
  )
$$;

-- Retorna o role do usuário em um workspace específico
create or replace function my_workspace_role(ws_id uuid)
returns workspace_role
language sql
security definer
stable
as $$
  select role from workspace_members
  where workspace_id = ws_id and user_id = auth.uid()
  limit 1
$$;

-- ============================================================
-- PROFILES
-- ============================================================
create policy "users can read own profile"
  on profiles for select
  using (id = auth.uid() or is_super_admin());

create policy "users can update own profile"
  on profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- super_admin não pode ser alterado via RLS — somente via service role
    and is_super_admin = (select is_super_admin from profiles where id = auth.uid())
  );

-- INSERT é feito pelo trigger handle_new_user via security definer — sem policy de insert

-- ============================================================
-- WORKSPACES
-- ============================================================
create policy "members can read workspace"
  on workspaces for select
  using (
    is_workspace_member(id)
    or is_super_admin()
  );

create policy "authenticated users can create workspace"
  on workspaces for insert
  with check (
    auth.uid() is not null
    and owner_id = auth.uid()
  );

create policy "admins can update workspace"
  on workspaces for update
  using (is_workspace_member(id, 'admin'))
  with check (
    -- owner_id e slug são imutáveis após criação
    owner_id = (select owner_id from workspaces where id = workspaces.id)
    and slug  = (select slug from workspaces where id = workspaces.id)
  );

create policy "only owner can delete workspace"
  on workspaces for delete
  using (is_workspace_member(id, 'owner'));

-- ============================================================
-- WORKSPACE_MEMBERS
-- ============================================================
create policy "members can read workspace members"
  on workspace_members for select
  using (is_workspace_member(workspace_id));

create policy "admins can add members"
  on workspace_members for insert
  with check (
    is_workspace_member(workspace_id, 'admin')
    -- owner não pode ser inserido novamente (já existe)
    and role != 'owner'
  );

create policy "admins can update member roles"
  on workspace_members for update
  using (is_workspace_member(workspace_id, 'admin'))
  with check (
    -- Não pode promover ninguém a owner via update
    role != 'owner'
    -- Não pode rebaixar o owner
    and user_id != (select owner_id from workspaces where id = workspace_id)
  );

create policy "admins can remove members"
  on workspace_members for delete
  using (
    is_workspace_member(workspace_id, 'admin')
    -- owner não pode ser removido
    and user_id != (select owner_id from workspaces where id = workspace_id)
    -- member pode sair por conta própria
    or user_id = auth.uid()
  );

-- ============================================================
-- ACCOUNTS
-- ============================================================
create policy "members can read accounts"
  on accounts for select
  using (is_workspace_member(workspace_id));

create policy "admins can create accounts"
  on accounts for insert
  with check (
    is_workspace_member(workspace_id, 'admin')
    and created_by = auth.uid()
  );

create policy "admins can update accounts"
  on accounts for update
  using (is_workspace_member(workspace_id, 'admin'));

-- DELETE bloqueado via RLS — use is_active = false (archive)
-- A deleção real é permitida apenas via service role após verificação de zero transações

-- ============================================================
-- CATEGORIES
-- ============================================================
create policy "members can read categories"
  on categories for select
  using (is_workspace_member(workspace_id));

create policy "admins can create categories"
  on categories for insert
  with check (
    is_workspace_member(workspace_id, 'admin')
    and is_system = false  -- categorias de sistema são seed, não criadas pelo usuário
  );

create policy "admins can update categories"
  on categories for update
  using (is_workspace_member(workspace_id, 'admin'))
  with check (
    -- is_system não pode ser alterado
    is_system = (select is_system from categories where id = categories.id)
  );

create policy "admins can delete non-system categories"
  on categories for delete
  using (
    is_workspace_member(workspace_id, 'admin')
    and is_system = false
  );

-- ============================================================
-- TRANSACTIONS
-- ============================================================
create policy "members can read transactions"
  on transactions for select
  using (
    is_workspace_member(workspace_id)
    and deleted_at is null
  );

create policy "members can create transactions"
  on transactions for insert
  with check (
    is_workspace_member(workspace_id)
    and created_by = auth.uid()
    -- Transações reconciled não podem ser criadas manualmente
    and status != 'reconciled'
  );

create policy "creator or admin can update transactions"
  on transactions for update
  using (
    is_workspace_member(workspace_id)
    and (created_by = auth.uid() or is_workspace_member(workspace_id, 'admin'))
    -- Transações reconciled são imutáveis
    and status != 'reconciled'
  )
  with check (
    -- Status reconciled não pode ser definido manualmente
    status != 'reconciled'
  );

-- Soft delete apenas — DELETE real bloqueado
create policy "creator or admin can soft-delete transactions"
  on transactions for update
  using (
    is_workspace_member(workspace_id)
    and (created_by = auth.uid() or is_workspace_member(workspace_id, 'admin'))
  );

-- ============================================================
-- RECURRENCE_RULES
-- ============================================================
create policy "members can read recurrences"
  on recurrence_rules for select
  using (is_workspace_member(workspace_id));

create policy "members can create recurrences"
  on recurrence_rules for insert
  with check (
    is_workspace_member(workspace_id)
    and created_by = auth.uid()
  );

create policy "creator or admin can update recurrences"
  on recurrence_rules for update
  using (
    is_workspace_member(workspace_id)
    and (created_by = auth.uid() or is_workspace_member(workspace_id, 'admin'))
  );

create policy "creator or admin can delete recurrences"
  on recurrence_rules for delete
  using (
    is_workspace_member(workspace_id)
    and (created_by = auth.uid() or is_workspace_member(workspace_id, 'admin'))
  );

-- ============================================================
-- CREDIT_CARDS
-- ============================================================
create policy "members can read credit cards"
  on credit_cards for select
  using (is_workspace_member(workspace_id));

create policy "admins can manage credit cards"
  on credit_cards for insert
  with check (
    is_workspace_member(workspace_id, 'admin')
    and created_by = auth.uid()
  );

create policy "admins can update credit cards"
  on credit_cards for update
  using (is_workspace_member(workspace_id, 'admin'));

-- ============================================================
-- CARD_INVOICES
-- ============================================================
create policy "members can read invoices"
  on card_invoices for select
  using (is_workspace_member(workspace_id));

-- Faturas são gerenciadas pelo sistema (Edge Function) ou por admins
create policy "admins can manage invoices"
  on card_invoices for insert
  with check (is_workspace_member(workspace_id, 'admin'));

create policy "admins can update invoices"
  on card_invoices for update
  using (is_workspace_member(workspace_id, 'admin'))
  with check (
    -- Fatura paga não pode voltar para status anterior
    status != 'paid' or
    (select status from card_invoices where id = card_invoices.id) = 'paid'
  );

-- ============================================================
-- CARD_TRANSACTIONS
-- ============================================================
create policy "members can read card transactions"
  on card_transactions for select
  using (is_workspace_member(workspace_id));

create policy "members can insert card transactions"
  on card_transactions for insert
  with check (is_workspace_member(workspace_id));

-- ============================================================
-- GOALS
-- ============================================================
create policy "members can read goals"
  on goals for select
  using (is_workspace_member(workspace_id));

create policy "members can create goals"
  on goals for insert
  with check (
    is_workspace_member(workspace_id)
    and created_by = auth.uid()
  );

create policy "creator or admin can update goals"
  on goals for update
  using (
    is_workspace_member(workspace_id)
    and (created_by = auth.uid() or is_workspace_member(workspace_id, 'admin'))
  );

create policy "admins can delete goals"
  on goals for delete
  using (is_workspace_member(workspace_id, 'admin'));

-- ============================================================
-- GOAL_CONTRIBUTIONS
-- ============================================================
create policy "members can read contributions"
  on goal_contributions for select
  using (is_workspace_member(workspace_id));

create policy "members can create contributions"
  on goal_contributions for insert
  with check (
    is_workspace_member(workspace_id)
    and created_by = auth.uid()
  );

create policy "creator or admin can delete contributions"
  on goal_contributions for delete
  using (
    is_workspace_member(workspace_id)
    and (created_by = auth.uid() or is_workspace_member(workspace_id, 'admin'))
  );

-- ============================================================
-- BUDGETS
-- ============================================================
create policy "members can read budgets"
  on budgets for select
  using (is_workspace_member(workspace_id));

create policy "admins can manage budgets"
  on budgets for insert
  with check (is_workspace_member(workspace_id, 'admin'));

create policy "admins can update budgets"
  on budgets for update
  using (is_workspace_member(workspace_id, 'admin'));

create policy "admins can delete budgets"
  on budgets for delete
  using (is_workspace_member(workspace_id, 'admin'));

-- ============================================================
-- AUDIT_LOGS — insert-only, ninguém deleta
-- ============================================================
create policy "super_admin can read all audit logs"
  on audit_logs for select
  using (is_super_admin());

create policy "members can read own workspace audit logs"
  on audit_logs for select
  using (
    workspace_id is not null
    and is_workspace_member(workspace_id, 'admin')
  );

-- INSERT via service role apenas (functions security definer)
-- Nenhuma policy de UPDATE ou DELETE
