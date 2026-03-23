-- Migration 020: Financial Goals (Metas Financeiras)
-- Creates goals and goal_contributions tables with RLS

CREATE TABLE IF NOT EXISTS goals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  type             text NOT NULL DEFAULT 'savings'
                     CHECK (type IN ('savings','debt_payoff','purchase','investment','emergency_fund','other')),
  target_amount    numeric(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount   numeric(15,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date      date,
  account_id       uuid REFERENCES accounts(id) ON DELETE SET NULL,
  color            text,
  icon             text,
  is_completed     boolean NOT NULL DEFAULT false,
  is_archived      boolean NOT NULL DEFAULT false,
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goal_contributions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id      uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  amount       numeric(15,2) NOT NULL CHECK (amount > 0),
  note         text,
  date         date NOT NULL DEFAULT CURRENT_DATE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Updated_at trigger for goals
CREATE OR REPLACE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members can manage goals"
  ON goals FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace members can manage goal_contributions"
  ON goal_contributions FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goals_workspace_active
  ON goals(workspace_id, sort_order)
  WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_goals_workspace_completed
  ON goals(workspace_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal
  ON goal_contributions(goal_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_goal_contributions_workspace
  ON goal_contributions(workspace_id, date DESC);
