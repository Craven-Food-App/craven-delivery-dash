alter table public.employees
  add column if not exists salary_status text check (salary_status in ('active','deferred')) default 'active',
  add column if not exists funding_trigger integer,
  add column if not exists deferred_salary_clause boolean default false;
