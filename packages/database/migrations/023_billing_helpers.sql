-- Migration 023: billing helpers
-- Índices para queries de billing/trial e funções helper de acesso

CREATE INDEX IF NOT EXISTS idx_workspaces_trial_ends_at
  ON workspaces(trial_ends_at)
  WHERE subscription_status = 'trialing';

CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_customer
  ON workspaces(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workspaces_subscription_status
  ON workspaces(subscription_status);

-- Retorna true se o workspace tem acesso ativo (trial válido ou assinatura ativa)
CREATE OR REPLACE FUNCTION workspace_has_access(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ws workspaces%ROWTYPE;
BEGIN
  SELECT * INTO ws FROM workspaces WHERE id = ws_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF ws.subscription_status = 'active' THEN RETURN TRUE; END IF;
  IF ws.subscription_status = 'trialing'
     AND ws.trial_ends_at IS NOT NULL
     AND ws.trial_ends_at > now() THEN RETURN TRUE; END IF;
  RETURN FALSE;
END;
$$;

-- Retorna dias restantes de trial (null se não está em trial)
CREATE OR REPLACE FUNCTION workspace_trial_days_left(ws_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ws workspaces%ROWTYPE;
BEGIN
  SELECT * INTO ws FROM workspaces WHERE id = ws_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF ws.subscription_status != 'trialing' THEN RETURN NULL; END IF;
  IF ws.trial_ends_at IS NULL THEN RETURN NULL; END IF;
  RETURN GREATEST(0, CEIL(EXTRACT(EPOCH FROM (ws.trial_ends_at - now())) / 86400)::INTEGER);
END;
$$;
