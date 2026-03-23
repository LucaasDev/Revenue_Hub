-- ============================================================
-- 011_card_transactions.sql — Vínculo transação ↔ fatura (suporta parcelamento)
-- ============================================================

create table card_transactions (
  id                   uuid primary key default gen_random_uuid(),
  invoice_id           uuid not null references card_invoices(id) on delete cascade,
  transaction_id       uuid not null references transactions(id) on delete cascade,
  workspace_id         uuid not null references workspaces(id) on delete cascade,

  installment_number   int not null default 1 check (installment_number >= 1),
  total_installments   int not null default 1 check (total_installments >= 1),
  installment_amount   numeric(15,2) not null check (installment_amount > 0),

  -- Para parcelamento: referência à transação original (1ª parcela)
  parent_tx_id         uuid references transactions(id) on delete set null,

  created_at           timestamptz not null default now(),

  constraint card_tx_installment_valid check (installment_number <= total_installments),
  constraint card_tx_unique unique (invoice_id, transaction_id)
);

-- Índices
create index card_tx_invoice_id_idx on card_transactions(invoice_id);
create index card_tx_workspace_id_idx on card_transactions(workspace_id);
create index card_tx_parent_idx on card_transactions(parent_tx_id) where parent_tx_id is not null;
