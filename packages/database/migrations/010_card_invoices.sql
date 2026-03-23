-- ============================================================
-- 010_card_invoices.sql — Fatura mensal do cartão
-- ============================================================

create table card_invoices (
  id              uuid primary key default gen_random_uuid(),
  card_id         uuid not null references credit_cards(id) on delete cascade,
  workspace_id    uuid not null references workspaces(id) on delete cascade,

  period_start    date not null,
  period_end      date not null,
  due_date        date not null,
  total_amount    numeric(15,2) not null default 0,
  paid_amount     numeric(15,2) not null default 0,
  status          invoice_status not null default 'open',

  paid_at         timestamptz,
  payment_tx_id   uuid references transactions(id) on delete set null,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint card_invoices_period_valid check (period_end > period_start),
  constraint card_invoices_due_after_close check (due_date >= period_end),
  constraint card_invoices_unique_period unique (card_id, period_start)
);

-- Índices
create index card_invoices_card_id_idx on card_invoices(card_id);
create index card_invoices_workspace_id_idx on card_invoices(workspace_id);
create index card_invoices_card_period_idx on card_invoices(card_id, period_start desc);
create index card_invoices_status_idx on card_invoices(workspace_id, status);
