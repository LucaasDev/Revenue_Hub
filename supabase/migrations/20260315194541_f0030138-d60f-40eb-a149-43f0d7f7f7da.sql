
-- 1. Create family_role enum
CREATE TYPE public.family_role AS ENUM ('admin', 'editor', 'viewer');

-- 2. Family groups table
CREATE TABLE public.family_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Minha Família',
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;

-- 3. Family members table
CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role family_role NOT NULL DEFAULT 'viewer',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(family_id, user_id)
);
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- 4. Family invites table
CREATE TABLE public.family_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  role family_role NOT NULL DEFAULT 'viewer',
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

-- 5. Helper: get user's family id
CREATE OR REPLACE FUNCTION public.get_user_family_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT family_id FROM public.family_members WHERE user_id = _user_id LIMIT 1
$$;

-- 6. Helper: check if two users share a family
CREATE OR REPLACE FUNCTION public.is_family_member(_user_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members fm1
    JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = _user_id AND fm2.user_id = _target_user_id
  )
$$;

-- 7. Helper: get family role
CREATE OR REPLACE FUNCTION public.get_family_role(_user_id uuid)
RETURNS family_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.family_members WHERE user_id = _user_id LIMIT 1
$$;

-- 8. Helper: is family admin (role=admin or is owner)
CREATE OR REPLACE FUNCTION public.is_family_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members fm
    JOIN public.family_groups fg ON fg.id = fm.family_id
    WHERE fm.user_id = _user_id AND (fm.role = 'admin' OR fg.owner_id = _user_id)
  )
$$;

-- 9. Helper: ensure user has a family (creates one if not)
CREATE OR REPLACE FUNCTION public.ensure_user_family(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _family_id uuid;
BEGIN
  SELECT family_id INTO _family_id FROM public.family_members WHERE user_id = _user_id LIMIT 1;
  IF _family_id IS NULL THEN
    INSERT INTO public.family_groups (owner_id) VALUES (_user_id) RETURNING id INTO _family_id;
    INSERT INTO public.family_members (family_id, user_id, role) VALUES (_family_id, _user_id, 'admin');
  END IF;
  RETURN _family_id;
END;
$$;

-- 10. RLS policies for family_groups
CREATE POLICY "Members can view their family group" ON public.family_groups
FOR SELECT TO authenticated
USING (id = public.get_user_family_id(auth.uid()));

CREATE POLICY "Owner can update family group" ON public.family_groups
FOR UPDATE TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Authenticated can create family group" ON public.family_groups
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

-- 11. RLS policies for family_members
CREATE POLICY "Members can view family members" ON public.family_members
FOR SELECT TO authenticated
USING (family_id = public.get_user_family_id(auth.uid()));

CREATE POLICY "Admins can insert members" ON public.family_members
FOR INSERT TO authenticated
WITH CHECK (
  family_id = public.get_user_family_id(auth.uid())
  AND public.is_family_admin(auth.uid())
);

CREATE POLICY "Admins can update members" ON public.family_members
FOR UPDATE TO authenticated
USING (
  family_id = public.get_user_family_id(auth.uid())
  AND public.is_family_admin(auth.uid())
);

CREATE POLICY "Admins can delete members" ON public.family_members
FOR DELETE TO authenticated
USING (
  family_id = public.get_user_family_id(auth.uid())
  AND public.is_family_admin(auth.uid())
);

-- 12. RLS policies for family_invites
CREATE POLICY "Members can view family invites" ON public.family_invites
FOR SELECT TO authenticated
USING (family_id = public.get_user_family_id(auth.uid()));

CREATE POLICY "Admins can insert invites" ON public.family_invites
FOR INSERT TO authenticated
WITH CHECK (
  family_id = public.get_user_family_id(auth.uid())
  AND public.is_family_admin(auth.uid())
);

CREATE POLICY "Admins can update invites" ON public.family_invites
FOR UPDATE TO authenticated
USING (
  family_id = public.get_user_family_id(auth.uid())
  AND public.is_family_admin(auth.uid())
);

CREATE POLICY "Admins can delete invites" ON public.family_invites
FOR DELETE TO authenticated
USING (
  family_id = public.get_user_family_id(auth.uid())
  AND public.is_family_admin(auth.uid())
);

CREATE POLICY "Anyone can read invite by token" ON public.family_invites
FOR SELECT USING (true);

-- 13. Update RLS on existing tables to support family data sharing
-- Accounts: family members can view, only owner or admin can modify
DROP POLICY IF EXISTS "Users can manage own accounts" ON public.accounts;

CREATE POLICY "Family can view accounts" ON public.accounts
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_family_member(auth.uid(), user_id)
);

CREATE POLICY "Owner or admin can insert accounts" ON public.accounts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner or family admin/editor can update accounts" ON public.accounts
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR (public.is_family_member(auth.uid(), user_id) AND public.get_family_role(auth.uid()) = 'admin')
);

CREATE POLICY "Owner can delete accounts" ON public.accounts
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Categories
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;

CREATE POLICY "Family can view categories" ON public.categories
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_family_member(auth.uid(), user_id)
);

CREATE POLICY "Owner can insert categories" ON public.categories
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner or family admin can update categories" ON public.categories
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR (public.is_family_member(auth.uid(), user_id) AND public.get_family_role(auth.uid()) = 'admin')
);

CREATE POLICY "Owner can delete categories" ON public.categories
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Transactions
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;

CREATE POLICY "Family can view transactions" ON public.transactions
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_family_member(auth.uid(), user_id)
);

CREATE POLICY "Owner or editor can insert transactions" ON public.transactions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner or family editor/admin can update transactions" ON public.transactions
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR (public.is_family_member(auth.uid(), user_id) AND public.get_family_role(auth.uid()) IN ('admin', 'editor'))
);

CREATE POLICY "Owner can delete transactions" ON public.transactions
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Goals
DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;

CREATE POLICY "Family can view goals" ON public.goals
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_family_member(auth.uid(), user_id)
);

CREATE POLICY "Owner can insert goals" ON public.goals
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner or family admin can update goals" ON public.goals
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR (public.is_family_member(auth.uid(), user_id) AND public.get_family_role(auth.uid()) = 'admin')
);

CREATE POLICY "Owner can delete goals" ON public.goals
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Cards
DROP POLICY IF EXISTS "Users can manage own cards" ON public.cards;

CREATE POLICY "Family can view cards" ON public.cards
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_family_member(auth.uid(), user_id)
);

CREATE POLICY "Owner can insert cards" ON public.cards
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner or family admin can update cards" ON public.cards
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR (public.is_family_member(auth.uid(), user_id) AND public.get_family_role(auth.uid()) = 'admin')
);

CREATE POLICY "Owner can delete cards" ON public.cards
FOR DELETE TO authenticated
USING (auth.uid() = user_id);
