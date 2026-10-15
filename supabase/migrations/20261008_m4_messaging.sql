-- ============================================================
-- Workbrio M4 — Messaging & Notifications schema
-- ============================================================
-- HOW TO APPLY (2 minutes, no code needed):
--   1. Open your Supabase project dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "+ New query" (a FRESH tab — do not reuse a tab that
--      still has old SQL in it), paste this ENTIRE file, click "Run"
-- Done. Conversations, messages, notifications, their permissions,
-- notification triggers and realtime are all created at once.
-- Safe to re-run: every statement is idempotent.
-- REQUIRES: M1 (20261008_m1_profiles.sql) and M2 (20261008_m2_jobs.sql)
-- applied first (conversations reference profiles and jobs).
--
-- RLS design note: policies use ONLY direct auth.uid() comparisons
-- plus the SECURITY DEFINER helper is_conversation_participant()
-- (same pattern as 20261008_m2_jobs_rls_fix.sql). No cross-table RLS
-- reads anywhere -> no infinite-recursion risk (error 42P17).
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_1 uuid not null references public.profiles(id) on delete cascade,
  participant_2 uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Canonical ordering so each pair/job has exactly one row.
  -- (uuid < uuid works in Postgres; it also implies participant_1 <> participant_2.)
  check (participant_1 < participant_2),
  unique (participant_1, participant_2, job_id)
);

-- Postgres treats NULLs as distinct in unique constraints, so a second
-- partial index guards the "general chat" (job_id IS NULL) case.
create unique index if not exists conversations_pair_general_uidx
  on public.conversations (participant_1, participant_2)
  where job_id is null;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at asc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('proposal_received', 'proposal_accepted', 'proposal_declined', 'new_message')),
  title text not null,
  body text not null default '',
  link_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

-- ---------- updated_at auto-touch for conversations ----------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.handle_updated_at();

-- Bump a conversation to the top of the list when a message lands.
-- Runs as the sender (a participant), who is allowed to UPDATE their
-- own conversations by the RLS policy below.
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- ---------- SECURITY DEFINER helper (breaks RLS cycles) ----------

create or replace function public.is_conversation_participant(c_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.conversations
    where id = c_id
      and (participant_1 = auth.uid() or participant_2 = auth.uid())
  );
$$;

grant execute on function public.is_conversation_participant(uuid) to anon, authenticated;

-- ---------- Row Level Security ----------

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- conversations: only the two participants can see / manage them.
drop policy if exists "conversations_participant_read" on public.conversations;
create policy "conversations_participant_read" on public.conversations
  for select using (
    participant_1 = auth.uid() or participant_2 = auth.uid()
  );

drop policy if exists "conversations_participant_insert" on public.conversations;
create policy "conversations_participant_insert" on public.conversations
  for insert with check (
    (participant_1 = auth.uid() or participant_2 = auth.uid())
    and participant_1 < participant_2
  );

drop policy if exists "conversations_participant_update" on public.conversations;
create policy "conversations_participant_update" on public.conversations
  for update using (
    participant_1 = auth.uid() or participant_2 = auth.uid()
  )
  with check (
    participant_1 = auth.uid() or participant_2 = auth.uid()
  );

drop policy if exists "conversations_participant_delete" on public.conversations;
create policy "conversations_participant_delete" on public.conversations
  for delete using (
    participant_1 = auth.uid() or participant_2 = auth.uid()
  );

-- messages: participants read; the sender sends; participants mark read.
-- (No cross-table RLS reads — the helper bypasses RLS safely.)
drop policy if exists "messages_participant_read" on public.messages;
create policy "messages_participant_read" on public.messages
  for select using (public.is_conversation_participant(conversation_id));

drop policy if exists "messages_sender_insert" on public.messages;
create policy "messages_sender_insert" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
  );

drop policy if exists "messages_participant_update" on public.messages;
create policy "messages_participant_update" on public.messages
  for update using (public.is_conversation_participant(conversation_id))
  with check (public.is_conversation_participant(conversation_id));

-- notifications: users read and mark their own as read.
-- (Rows are created by SECURITY DEFINER triggers below, so no
-- user-facing INSERT policy is needed or wanted.)
drop policy if exists "notifications_owner_read" on public.notifications;
create policy "notifications_owner_read" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "notifications_owner_update" on public.notifications;
create policy "notifications_owner_update" on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- Notification triggers ----------
-- All trigger functions are SECURITY DEFINER (owned by postgres, which
-- bypasses RLS), so they can insert notification rows for any user.
-- They only ever insert rows — never read anything sensitive — and they
-- never raise, so they cannot break the insert/update that fired them.

-- 1. Freelancer applies -> notify the client.
create or replace function public.notify_proposal_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_job_title text;
  v_freelancer_name text;
begin
  select j.client_id, j.title into v_client_id, v_job_title
  from public.jobs j where j.id = new.job_id;
  select p.full_name into v_freelancer_name
  from public.profiles p where p.id = new.freelancer_id;
  if v_client_id is not null then
    insert into public.notifications (user_id, type, title, body, link_url)
    values (
      v_client_id,
      'proposal_received',
      'New proposal received',
      coalesce(v_freelancer_name, 'A freelancer')
        || ' applied to "' || coalesce(v_job_title, 'your job') || '"'
        || case when new.bid_amount is not null
                then ' for $' || new.bid_amount::text else '' end
        || '.',
      '/dashboard/proposals'
    );
  end if;
  return new;
exception when others then
  -- Notifications must never break applying to a job.
  return new;
end;
$$;

drop trigger if exists proposals_notify_received on public.proposals;
create trigger proposals_notify_received
  after insert on public.proposals
  for each row execute function public.notify_proposal_received();

-- 2. Proposal accepted/declined -> notify the freelancer.
create or replace function public.notify_proposal_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_title text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;
  if new.status not in ('accepted', 'declined') then
    return new;
  end if;
  select j.title into v_job_title from public.jobs j where j.id = new.job_id;
  insert into public.notifications (user_id, type, title, body, link_url)
  values (
    new.freelancer_id,
    -- Map proposal status -> notification type explicitly: the
    -- notifications.type check constraint only allows
    -- 'proposal_accepted' / 'proposal_declined' (not 'accepted').
    case when new.status = 'accepted' then 'proposal_accepted' else 'proposal_declined' end,
    case when new.status = 'accepted' then 'Proposal accepted!' else 'Proposal declined' end,
    case when new.status = 'accepted'
      then 'Your proposal for "' || coalesce(v_job_title, 'a job')
        || '" was accepted. You can now message the client.'
      else 'Your proposal for "' || coalesce(v_job_title, 'a job')
        || '" was declined. Keep exploring open jobs!' end,
    case when new.status = 'accepted' then '/dashboard/applications' else '/jobs' end
  );
  return new;
exception when others then
  return new;
end;
$$;

-- NOTE: the notifications.type check constraint lists
-- 'proposal_accepted' / 'proposal_declined' (not 'accepted'/'declined'),
-- mapped explicitly in the insert above.
drop trigger if exists proposals_notify_status on public.proposals;
create trigger proposals_notify_status
  after update of status on public.proposals
  for each row execute function public.notify_proposal_status();

-- 3. New chat message -> notify the other participant.
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_other uuid;
  v_sender_name text;
begin
  select case when c.participant_1 = new.sender_id
              then c.participant_2 else c.participant_1 end
    into v_other
  from public.conversations c where c.id = new.conversation_id;
  select p.full_name into v_sender_name
  from public.profiles p where p.id = new.sender_id;
  if v_other is not null then
    insert into public.notifications (user_id, type, title, body, link_url)
    values (
      v_other,
      'new_message',
      'New message',
      coalesce(v_sender_name, 'Someone') || ': ' || left(new.content, 120),
      '/messages?conversation=' || new.conversation_id::text
    );
  end if;
  return new;
exception when others then
  -- Notifications must never break sending a message.
  return new;
end;
$$;

drop trigger if exists messages_notify_new on public.messages;
create trigger messages_notify_new
  after insert on public.messages
  for each row execute function public.notify_new_message();

-- ---------- Realtime ----------
-- Lets the chat window and the notification bell update live.
-- Guarded so re-running never errors.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
