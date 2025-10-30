-- Role-based permissions draft for finance tables

-- Helper SQL functions for checking finance roles
create or replace function public.has_finance_role(check_role text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.finance_roles fr
    where fr.user_id = auth.uid() and fr.role = check_role
  );
$$;

-- Adjust policies: reads allowed to authenticated; writes restricted to service_role or appropriate roles
drop policy if exists invoices_write on public.invoices;
create policy invoices_write on public.invoices for insert with check (
  auth.role() = 'service_role' or public.has_finance_role('AP') or public.has_finance_role('Controller') or public.has_finance_role('CFO')
);
drop policy if exists payment_runs_write on public.payment_runs;
create policy payment_runs_write on public.payment_runs for insert with check (
  auth.role() = 'service_role' or public.has_finance_role('AP') or public.has_finance_role('Controller') or public.has_finance_role('CFO')
);
drop policy if exists receivables_write on public.receivables;
create policy receivables_write on public.receivables for insert with check (
  auth.role() = 'service_role' or public.has_finance_role('AR') or public.has_finance_role('Controller') or public.has_finance_role('CFO')
);
drop policy if exists dunning_write on public.dunning_events;
create policy dunning_write on public.dunning_events for insert with check (
  auth.role() = 'service_role' or public.has_finance_role('AR') or public.has_finance_role('Controller') or public.has_finance_role('CFO')
);
drop policy if exists close_tasks_write on public.close_tasks;
create policy close_tasks_write on public.close_tasks for insert with check (
  auth.role() = 'service_role' or public.has_finance_role('Controller') or public.has_finance_role('CFO')
);
drop policy if exists recs_write on public.reconciliations;
create policy recs_write on public.reconciliations for insert with check (
  auth.role() = 'service_role' or public.has_finance_role('Controller') or public.has_finance_role('CFO')
);
drop policy if exists bank_accounts_write on public.bank_accounts;
create policy bank_accounts_write on public.bank_accounts for insert with check (
  auth.role() = 'service_role' or public.has_finance_role('Treasury') or public.has_finance_role('Controller') or public.has_finance_role('CFO')
);


