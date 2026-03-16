
-- 1. Add status/plan columns to family_groups (tenant metadata)
ALTER TABLE public.family_groups ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.family_groups ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

-- 2. Add tenant_id to all data tables
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.family_groups(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.family_groups(id);
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.family_groups(id);
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.family_groups(id);
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.family_groups(id);

-- 3. Populate tenant_id from existing data
UPDATE public.accounts a SET tenant_id = (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = a.user_id LIMIT 1) WHERE a.tenant_id IS NULL;
UPDATE public.transactions t SET tenant_id = (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = t.user_id LIMIT 1) WHERE t.tenant_id IS NULL;
UPDATE public.goals g SET tenant_id = (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = g.user_id LIMIT 1) WHERE g.tenant_id IS NULL;
UPDATE public.categories c SET tenant_id = (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = c.user_id LIMIT 1) WHERE c.tenant_id IS NULL;
UPDATE public.cards cd SET tenant_id = (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = cd.user_id LIMIT 1) WHERE cd.tenant_id IS NULL;

-- 4. Create helper function: get_user_tenant_id (replaces get_user_family_id conceptually)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM public.family_members WHERE user_id = _user_id LIMIT 1
$$;

-- 5. Auto-fill tenant_id trigger function
CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_user_tenant_id(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Create triggers for auto-fill
CREATE TRIGGER set_tenant_id_accounts BEFORE INSERT ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();
CREATE TRIGGER set_tenant_id_transactions BEFORE INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();
CREATE TRIGGER set_tenant_id_goals BEFORE INSERT ON public.goals FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();
CREATE TRIGGER set_tenant_id_categories BEFORE INSERT ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();
CREATE TRIGGER set_tenant_id_cards BEFORE INSERT ON public.cards FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();

-- 7. Drop old RLS policies
DROP POLICY IF EXISTS "Owner or admin can insert accounts" ON public.accounts;
DROP POLICY IF EXISTS "Family can view accounts" ON public.accounts;
DROP POLICY IF EXISTS "Owner or family admin/editor can update accounts" ON public.accounts;
DROP POLICY IF EXISTS "Owner can delete accounts" ON public.accounts;

DROP POLICY IF EXISTS "Family can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Owner or editor can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Owner or family editor/admin can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Owner can delete transactions" ON public.transactions;

DROP POLICY IF EXISTS "Family can view goals" ON public.goals;
DROP POLICY IF EXISTS "Owner can insert goals" ON public.goals;
DROP POLICY IF EXISTS "Owner or family admin can update goals" ON public.goals;
DROP POLICY IF EXISTS "Owner can delete goals" ON public.goals;

DROP POLICY IF EXISTS "Family can view categories" ON public.categories;
DROP POLICY IF EXISTS "Owner can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Owner or family admin can update categories" ON public.categories;
DROP POLICY IF EXISTS "Owner can delete categories" ON public.categories;

DROP POLICY IF EXISTS "Family can view cards" ON public.cards;
DROP POLICY IF EXISTS "Owner can insert cards" ON public.cards;
DROP POLICY IF EXISTS "Owner or family admin can update cards" ON public.cards;
DROP POLICY IF EXISTS "Owner can delete cards" ON public.cards;

-- 8. New tenant-based RLS policies

-- ACCOUNTS
CREATE POLICY "Tenant can view accounts" ON public.accounts FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant member can insert accounts" ON public.accounts FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admin/owner can update accounts" ON public.accounts FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND (auth.uid() = user_id OR public.get_family_role(auth.uid()) = 'admin'));
CREATE POLICY "Tenant owner can delete accounts" ON public.accounts FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND auth.uid() = user_id);

-- TRANSACTIONS
CREATE POLICY "Tenant can view transactions" ON public.transactions FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant member can insert transactions" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admin/editor can update transactions" ON public.transactions FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND (auth.uid() = user_id OR public.get_family_role(auth.uid()) IN ('admin', 'editor')));
CREATE POLICY "Tenant owner can delete transactions" ON public.transactions FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND auth.uid() = user_id);

-- GOALS
CREATE POLICY "Tenant can view goals" ON public.goals FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant member can insert goals" ON public.goals FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admin can update goals" ON public.goals FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND (auth.uid() = user_id OR public.get_family_role(auth.uid()) = 'admin'));
CREATE POLICY "Tenant owner can delete goals" ON public.goals FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND auth.uid() = user_id);

-- CATEGORIES
CREATE POLICY "Tenant can view categories" ON public.categories FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant member can insert categories" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admin can update categories" ON public.categories FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND (auth.uid() = user_id OR public.get_family_role(auth.uid()) = 'admin'));
CREATE POLICY "Tenant owner can delete categories" ON public.categories FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND auth.uid() = user_id);

-- CARDS
CREATE POLICY "Tenant can view cards" ON public.cards FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant member can insert cards" ON public.cards FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admin can update cards" ON public.cards FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND (auth.uid() = user_id OR public.get_family_role(auth.uid()) = 'admin'));
CREATE POLICY "Tenant owner can delete cards" ON public.cards FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()) AND auth.uid() = user_id);

-- 9. Global admin function
CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = _user_id AND email = 'lucas.oliveira1805k@gmail.com'
  )
$$;

-- 10. Admin RPC: get stats
CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF NOT public.is_global_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  SELECT json_build_object(
    'total_tenants', (SELECT count(*) FROM public.family_groups),
    'total_users', (SELECT count(DISTINCT user_id) FROM public.family_members),
    'total_transactions', (SELECT count(*) FROM public.transactions),
    'total_goals', (SELECT count(*) FROM public.goals)
  ) INTO result;
  RETURN result;
END;
$$;

-- 11. Admin RPC: get tenants
CREATE OR REPLACE FUNCTION public.admin_get_tenants()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF NOT public.is_global_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT fg.id, fg.name, fg.status, fg.plan, fg.created_at,
      (SELECT au.email FROM auth.users au WHERE au.id = fg.owner_id) as owner_email,
      (SELECT count(*) FROM public.family_members fm WHERE fm.family_id = fg.id) as member_count,
      (SELECT count(*) FROM public.transactions tx WHERE tx.tenant_id = fg.id) as transaction_count
    FROM public.family_groups fg ORDER BY fg.created_at DESC
  ) t;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 12. Admin RPC: get users
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF NOT public.is_global_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT au.id, au.email, au.created_at, au.last_sign_in_at,
      au.raw_user_meta_data->>'display_name' as display_name,
      au.banned_until,
      CASE WHEN au.banned_until IS NOT NULL AND au.banned_until > now() THEN false ELSE true END as is_active,
      (SELECT fg.name FROM public.family_members fm JOIN public.family_groups fg ON fg.id = fm.family_id WHERE fm.user_id = au.id LIMIT 1) as tenant_name,
      (SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = au.id LIMIT 1) as tenant_id
    FROM auth.users au ORDER BY au.created_at DESC
  ) t;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 13. Admin RPC: get growth (monthly user signups for last 12 months)
CREATE OR REPLACE FUNCTION public.admin_get_growth()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF NOT public.is_global_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  SELECT json_agg(row_to_json(t)) INTO result FROM (
    SELECT 
      to_char(date_trunc('month', au.created_at), 'YYYY-MM') as month,
      count(*) as user_count
    FROM auth.users au
    WHERE au.created_at >= now() - interval '12 months'
    GROUP BY date_trunc('month', au.created_at)
    ORDER BY date_trunc('month', au.created_at)
  ) t;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 14. Admin RPC: toggle user active status (ban/unban)
CREATE OR REPLACE FUNCTION public.admin_toggle_user(_target_user_id uuid, _active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_global_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF _active THEN
    UPDATE auth.users SET banned_until = NULL WHERE id = _target_user_id;
  ELSE
    UPDATE auth.users SET banned_until = '2099-12-31'::timestamptz WHERE id = _target_user_id;
  END IF;
END;
$$;
