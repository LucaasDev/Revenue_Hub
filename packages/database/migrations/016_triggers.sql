-- ============================================================
-- 016_triggers.sql — Triggers essenciais do sistema
-- ============================================================

-- 1. Criar profile + workspace pessoal ao registrar usuário
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_workspace_id uuid;
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  -- Criar profile
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Gerar slug único
  base_slug := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    '[^a-z0-9]+', '-', 'g'
  ));
  final_slug := base_slug;
  while exists (select 1 from workspaces where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  -- Criar workspace pessoal
  insert into workspaces (name, slug, owner_id)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', 'Meu Workspace'),
    final_slug,
    new.id
  )
  returning id into new_workspace_id;

  -- Adicionar como owner
  insert into workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- 2. Atualizar saldo da conta após insert/update/delete em transactions
-- ============================================================
create or replace function recalculate_balance(p_account_id uuid)
returns void language plpgsql security definer as $$
begin
  update accounts
  set balance = (
    select coalesce(sum(
      case
        when type in ('income', 'opening_balance') then amount_in_base
        when type = 'expense' then -amount_in_base
        -- transfers tratadas como expense na origem e income no destino
        when type = 'transfer' and account_id = p_account_id then -amount_in_base
        else 0
      end
    ), 0)
    from transactions
    where account_id = p_account_id
      and status in ('confirmed', 'reconciled')
      and deleted_at is null
  ),
  updated_at = now()
  where id = p_account_id;
end;
$$;

create or replace function update_account_balance()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'DELETE' or (TG_OP = 'UPDATE' and OLD.status = 'void') then
    -- reverter impacto do registro antigo
    perform recalculate_balance(OLD.account_id);
  elsif TG_OP = 'INSERT' and NEW.status = 'confirmed' then
    perform recalculate_balance(NEW.account_id);
  elsif TG_OP = 'UPDATE' then
    perform recalculate_balance(NEW.account_id);
    if OLD.account_id != NEW.account_id then
      perform recalculate_balance(OLD.account_id);
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

create trigger trg_transaction_balance
  after insert or update or delete on transactions
  for each row execute function update_account_balance();

-- ============================================================
-- 3. Atualizar current_amount de goal após insert em goal_contributions
-- ============================================================
create or replace function update_goal_amount()
returns trigger language plpgsql security definer as $$
begin
  update goals
  set
    current_amount = (
      select coalesce(sum(amount), 0)
      from goal_contributions
      where goal_id = NEW.goal_id
    ),
    status = case
      when current_amount >= target_amount then 'completed'
      else status
    end,
    completed_at = case
      when current_amount >= target_amount and completed_at is null then now()
      else completed_at
    end,
    updated_at = now()
  where id = NEW.goal_id;
  return NEW;
end;
$$;

create trigger trg_goal_contribution
  after insert or delete on goal_contributions
  for each row execute function update_goal_amount();

-- ============================================================
-- 4. updated_at automático em todas as tabelas relevantes
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

-- Aplicar em cada tabela com updated_at
create trigger set_updated_at_profiles before update on profiles for each row execute function set_updated_at();
create trigger set_updated_at_workspaces before update on workspaces for each row execute function set_updated_at();
create trigger set_updated_at_accounts before update on accounts for each row execute function set_updated_at();
create trigger set_updated_at_transactions before update on transactions for each row execute function set_updated_at();
create trigger set_updated_at_credit_cards before update on credit_cards for each row execute function set_updated_at();
create trigger set_updated_at_card_invoices before update on card_invoices for each row execute function set_updated_at();
create trigger set_updated_at_recurrence_rules before update on recurrence_rules for each row execute function set_updated_at();
create trigger set_updated_at_goals before update on goals for each row execute function set_updated_at();
create trigger set_updated_at_budgets before update on budgets for each row execute function set_updated_at();
