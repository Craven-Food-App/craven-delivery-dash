-- Link invoices to payment runs and add processed status
alter table public.invoices add column if not exists payment_run_id uuid references public.payment_runs(id) on delete set null;
create index if not exists invoices_payment_run_idx on public.invoices (payment_run_id);

alter table public.payment_runs add column if not exists processed_at timestamptz;

-- Simple exec roles table mapping user -> role for finance portal
create table if not exists public.finance_roles (
  user_id uuid not null,
  role text not null, -- CFO|Controller|AP|AR|Auditor
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.finance_roles enable row level security;
create policy if not exists finance_roles_read on public.finance_roles for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists finance_roles_write on public.finance_roles for insert with check (auth.role() = 'service_role');

-- Example: tighten writes on invoices to AP or higher (service_role in app handles writes normally)
-- For app-side row updates via RPC in future, these policies can be refined.
