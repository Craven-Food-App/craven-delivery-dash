-- Create budgets table for CFO Budget vs Actuals
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  period text not null, -- e.g., '2025-10' (YYYY-MM)
  dept text not null,
  amount numeric not null default 0,
  created_at timestamp with time zone not null default now()
);

-- Optional simple index for filtering/sorting
create index if not exists budgets_period_idx on public.budgets (period);
create index if not exists budgets_dept_idx on public.budgets (dept);

-- RLS optional: disabled for simplicity; adjust as needed
alter table public.budgets enable row level security;

-- Simple permissive policy for authenticated users; tighten in production
create policy if not exists budgets_read_policy on public.budgets
  for select using (auth.role() = 'authenticated' or auth.role() = 'service_role');

create policy if not exists budgets_write_policy on public.budgets
  for insert with check (auth.role() = 'service_role');

-- Allow service role updates (e.g., backend jobs)
create policy if not exists budgets_update_policy on public.budgets
  for update using (auth.role() = 'service_role');
