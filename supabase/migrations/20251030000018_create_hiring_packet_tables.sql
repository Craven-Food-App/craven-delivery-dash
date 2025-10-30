create table if not exists public.hiring_packets (
  id uuid primary key default gen_random_uuid(),
  employee_email text not null,
  employee_name text not null,
  state text not null,
  packet_type text not null default 'employee',
  created_at timestamptz not null default now()
);

create table if not exists public.hiring_packet_docs (
  id uuid primary key default gen_random_uuid(),
  packet_id uuid not null references public.hiring_packets(id) on delete cascade,
  doc_key text not null,
  label text not null,
  required boolean not null default true,
  status text not null default 'pending', -- pending|sent|signed|uploaded
  file_url text,
  updated_at timestamptz not null default now()
);

alter table public.hiring_packets enable row level security;
alter table public.hiring_packet_docs enable row level security;

create policy hp_read on public.hiring_packets for select using (auth.role() in ('authenticated','service_role'));
create policy hpd_read on public.hiring_packet_docs for select using (auth.role() in ('authenticated','service_role'));
create policy hp_write on public.hiring_packets for insert with check (auth.role() = 'service_role');
create policy hpd_write on public.hiring_packet_docs for insert with check (auth.role() = 'service_role');
create policy hpd_update on public.hiring_packet_docs for update using (auth.role() in ('authenticated','service_role'));


