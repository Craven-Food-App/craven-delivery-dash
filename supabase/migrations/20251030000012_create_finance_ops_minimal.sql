-- Minimal finance ops tables for CFO portal

-- AP: invoices and payment_runs
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  vendor text not null,
  invoice_number text not null,
  amount numeric not null,
  currency text not null default 'USD',
  invoice_date date not null,
  due_date date not null,
  status text not null default 'pending', -- pending|approved|paid
  created_at timestamptz not null default now()
);
create index if not exists invoices_due_idx on public.invoices (due_date);

create table if not exists public.payment_runs (
  id uuid primary key default gen_random_uuid(),
  scheduled_date date not null default (now()::date),
  status text not null default 'draft', -- draft|approved|processed
  total_amount numeric not null default 0,
  created_at timestamptz not null default now()
);

-- AR: receivables and dunning events
create table if not exists public.receivables (
  id uuid primary key default gen_random_uuid(),
  customer text not null,
  reference text,
  amount numeric not null,
  currency text not null default 'USD',
  issue_date date not null,
  due_date date not null,
  status text not null default 'open', -- open|paid|disputed|written_off
  created_at timestamptz not null default now()
);
create index if not exists receivables_due_idx on public.receivables (due_date);

create table if not exists public.dunning_events (
  id uuid primary key default gen_random_uuid(),
  receivable_id uuid not null references public.receivables(id) on delete cascade,
  action text not null, -- email_1|email_2|call|escalate
  notes text,
  created_at timestamptz not null default now()
);

-- Close: tasks and reconciliations
create table if not exists public.close_tasks (
  id uuid primary key default gen_random_uuid(),
  period text not null, -- YYYY-MM
  name text not null,
  owner text,
  status text not null default 'todo', -- todo|in_progress|done
  due_day int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.reconciliations (
  id uuid primary key default gen_random_uuid(),
  period text not null, -- YYYY-MM
  type text not null, -- bank|ar|ap|deferred_rev
  status text not null default 'open', -- open|tied|exception
  notes text,
  created_at timestamptz not null default now()
);

-- Treasury: bank accounts and balances
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  institution text,
  currency text not null default 'USD',
  current_balance numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- RLS (simple, permissive for reads; writes via service_role)
alter table public.invoices enable row level security;
alter table public.payment_runs enable row level security;
alter table public.receivables enable row level security;
alter table public.dunning_events enable row level security;
alter table public.close_tasks enable row level security;
alter table public.reconciliations enable row level security;
alter table public.bank_accounts enable row level security;

create policy if not exists invoices_read on public.invoices for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists invoices_write on public.invoices for insert with check (auth.role() = 'service_role');

create policy if not exists payment_runs_read on public.payment_runs for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists payment_runs_write on public.payment_runs for insert with check (auth.role() = 'service_role');

create policy if not exists receivables_read on public.receivables for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists receivables_write on public.receivables for insert with check (auth.role() = 'service_role');

create policy if not exists dunning_read on public.dunning_events for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists dunning_write on public.dunning_events for insert with check (auth.role() = 'service_role');

create policy if not exists close_tasks_read on public.close_tasks for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists close_tasks_write on public.close_tasks for insert with check (auth.role() = 'service_role');

create policy if not exists recs_read on public.reconciliations for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists recs_write on public.reconciliations for insert with check (auth.role() = 'service_role');

create policy if not exists bank_accounts_read on public.bank_accounts for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists bank_accounts_write on public.bank_accounts for insert with check (auth.role() = 'service_role');
