-- Add display label for finance roles
alter table public.finance_roles add column if not exists user_label text;

