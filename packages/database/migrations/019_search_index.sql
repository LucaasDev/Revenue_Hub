-- Migration 019: Full-text search index for transactions
-- Enables fast Portuguese-language search on description + notes

-- GIN index for full-text search (only non-deleted rows)
create index if not exists transactions_description_search_idx
  on transactions
  using gin(to_tsvector('portuguese', description || ' ' || coalesce(notes, '')))
  where deleted_at is null;

-- Also index on date + id for cursor-based pagination performance
create index if not exists transactions_cursor_idx
  on transactions (date desc, id desc)
  where deleted_at is null;

-- Composite index for the most common filter: workspace + date range
create index if not exists transactions_workspace_date_idx
  on transactions (workspace_id, date desc)
  where deleted_at is null;

-- Index for recurrence pending banner query
create index if not exists transactions_recurrence_pending_idx
  on transactions (workspace_id, status, recurrence_id)
  where deleted_at is null and recurrence_id is not null;
