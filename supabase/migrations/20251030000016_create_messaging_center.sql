-- Messaging center tables: threads, participants, messages, receipts

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.message_participants (
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  user_id uuid,
  user_label text,
  role_hint text,
  joined_at timestamptz not null default now(),
  primary key (thread_id, user_id, user_label)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid,
  sender_label text,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.message_receipts (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid,
  user_label text,
  read_at timestamptz,
  primary key (message_id, user_id, user_label)
);

-- RLS
alter table public.message_threads enable row level security;
alter table public.message_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_receipts enable row level security;

-- Reads for authenticated; writes via service_role for now
create policy if not exists message_threads_read on public.message_threads for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists message_threads_write on public.message_threads for insert with check (auth.role() = 'service_role');

create policy if not exists message_participants_read on public.message_participants for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists message_participants_write on public.message_participants for insert with check (auth.role() = 'service_role');

create policy if not exists messages_read on public.messages for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists messages_write on public.messages for insert with check (auth.role() = 'service_role');

create policy if not exists message_receipts_read on public.message_receipts for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists message_receipts_write on public.message_receipts for insert with check (auth.role() = 'service_role');


