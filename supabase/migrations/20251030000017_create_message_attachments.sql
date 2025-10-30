-- Message attachments table (store storage URL and metadata)

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_url text not null,
  file_name text,
  content_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

alter table public.message_attachments enable row level security;
create policy if not exists msg_attachments_read on public.message_attachments for select using (auth.role() in ('authenticated','service_role'));
create policy if not exists msg_attachments_write on public.message_attachments for insert with check (auth.role() = 'service_role');


