-- Migration 021: Budget Rules (Orçamentos por Categoria)
-- Creates budget_rules table with RLS

CREATE TABLE IF NOT EXISTS budget_rules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id      uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  period_type      text NOT NULL DEFAULT 'monthly'
                     CHECK (period_type IN ('monthly', 'yearly')),
  amount           numeric(15,2) NOT NULL CHECK (amount > 0),
  alert_threshold  integer NOT NULL DEFAULT 80
                     CHECK (alert_threshold BETWEEN 1 AND 99),
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, category_id, period_type)
);

-- Updated_at trigger
CREATE OR REPLACE TRIGGER budget_rules_updated_at
  BEFORE UPDATE ON budget_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE budget_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members can manage budget_rules"
  ON budget_rules FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_rules_workspace_active
  ON budget_rules(workspace_id, category_id)
  WHERE is_active = true;
