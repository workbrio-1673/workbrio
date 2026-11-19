-- Workbrio: poster notification when a proposal lands (M6d).
--
-- HOW TO RUN: Supabase dashboard -> SQL Editor -> New query -> paste this
-- file -> Run. Safe to re-run: every statement is idempotent.
--
-- WHY: the poster-notification mechanism was first declared in M4
-- (20261008_m4_messaging.sql: notify_proposal_received() trigger on
-- public.proposals). That migration's live status was never confirmed, so
-- this file re-declares the SAME mechanism standalone: the notifications
-- table, the owner read/update policies, the SECURITY DEFINER trigger
-- function and the trigger itself. If M4 already ran, this is a no-op;
-- if it never ran, this file alone makes the poster notification work.
-- No behaviour change versus M4 — the function body is identical.
--
-- WHAT IT DOES: when a freelancer submits a proposal (or an applicant
-- applies to an employment job — same proposals table), the job poster
-- gets an in-app notification "New proposal received" linking to
-- /dashboard/proposals, and the bell badge updates live via realtime.
-- In-app only — there is no email infra; nothing here sends email.
-- The trigger never raises, so it can never break applying to a job.

-- ---------- notifications table (as in M4) ----------

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

alter table public.notifications enable row level security;

-- notifications: users read and mark their own as read.
-- (Rows are created by the SECURITY DEFINER trigger below, so no
-- user-facing INSERT policy is needed or wanted.)
drop policy if exists "notifications_owner_read" on public.notifications;
create policy "notifications_owner_read" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "notifications_owner_update" on public.notifications;
create policy "notifications_owner_update" on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- Freelancer applies -> notify the client (poster) ----------

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

-- ---------- Realtime (bell badge updates live) ----------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
