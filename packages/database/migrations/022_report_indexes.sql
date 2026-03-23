-- Migration 022: Report Indexes and Helper Functions
-- Optimizes report queries and adds account balance helper

-- Composite index for report queries (type + date, excluding void)
CREATE INDEX IF NOT EXISTS idx_transactions_report
  ON transactions(workspace_id, type, date DESC)
  WHERE status != 'void';

-- Index for category-grouped expense queries (budgets + DRE)
CREATE INDEX IF NOT EXISTS idx_transactions_category_report
  ON transactions(workspace_id, category_id, date)
  WHERE status != 'void' AND type = 'expense';

-- Index for income grouped by category (DRE)
CREATE INDEX IF NOT EXISTS idx_transactions_income_report
  ON transactions(workspace_id, category_id, date)
  WHERE status != 'void' AND type = 'income';

-- Helper function: balance of an account at a specific date
-- Used by net-worth evolution query
CREATE OR REPLACE FUNCTION account_balance_at(
  p_account_id uuid,
  p_date       date
) RETURNS numeric AS $$
  SELECT
    COALESCE(a.opening_balance, 0) +
    COALESCE(SUM(
      CASE
        WHEN t.type IN ('income', 'transfer_in')  THEN  t.amount
        WHEN t.type IN ('expense', 'transfer_out') THEN -t.amount
        ELSE 0
      END
    ), 0)
  FROM accounts a
  LEFT JOIN transactions t
    ON  t.account_id = a.id
    AND t.date <= p_date
    AND t.status != 'void'
  WHERE a.id = p_account_id
  GROUP BY a.opening_balance;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION account_balance_at(uuid, date) TO authenticated;
