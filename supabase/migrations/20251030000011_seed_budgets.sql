-- Seed example budgets data
-- Note: adjust amounts and departments as needed

insert into public.budgets (period, dept, amount)
values
  (to_char(date_trunc('month', now()) - interval '1 month', 'YYYY-MM'), 'Operations', 120000),
  (to_char(date_trunc('month', now()) - interval '1 month', 'YYYY-MM'), 'Marketing', 60000),
  (to_char(date_trunc('month', now()) - interval '1 month', 'YYYY-MM'), 'Engineering', 90000),

  (to_char(date_trunc('month', now()), 'YYYY-MM'), 'Operations', 130000),
  (to_char(date_trunc('month', now()), 'YYYY-MM'), 'Marketing', 65000),
  (to_char(date_trunc('month', now()), 'YYYY-MM'), 'Engineering', 95000),

  (to_char(date_trunc('month', now()) + interval '1 month', 'YYYY-MM'), 'Operations', 135000),
  (to_char(date_trunc('month', now()) + interval '1 month', 'YYYY-MM'), 'Marketing', 70000), 
  (to_char(date_trunc('month', now()) + interval '1 month', 'YYYY-MM'), 'Engineering', 97000),

  (to_char(date_trunc('month', now()) + interval '2 month', 'YYYY-MM'), 'Operations', 140000),
  (to_char(date_trunc('month', now()) + interval '2 month', 'YYYY-MM'), 'Marketing', 72000),
  (to_char(date_trunc('month', now()) + interval '2 month', 'YYYY-MM'), 'Engineering', 100000);
