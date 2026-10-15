-- ============================================================
-- Workbrio M2 — Jobs & Proposals schema
-- ============================================================
-- HOW TO APPLY (2 minutes, no code needed):
--   1. Open your Supabase project dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "New query", paste this ENTIRE file, click "Run"
-- Done. The jobs and proposals tables plus their permissions are
-- created at once.
-- Safe to re-run: every statement is idempotent.
-- REQUIRES: the M1 migration (20261008_m1_profiles.sql) applied first.
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  budget_type text not null default 'fixed'
    check (budget_type in ('fixed', 'hourly')),
  budget_amount numeric(10, 2) not null check (budget_amount > 0),
  skills_required text[] not null default '{}',
  status text not null default 'open'
    check (status in ('open', 'closed', 'in_progress')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  cover_note text,
  bid_amount numeric(10, 2) check (bid_amount is null or bid_amount > 0),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (job_id, freelancer_id)
);

-- ---------- updated_at auto-touch (reuses M1 function) ----------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at
  before update on public.jobs
  for each row execute function public.handle_updated_at();

-- ---------- Row Level Security ----------

alter table public.jobs enable row level security;
alter table public.proposals enable row level security;

-- jobs: open jobs are public; owners see all of theirs;
-- freelancers see jobs they applied to (even after closing)
drop policy if exists "jobs_select_visible" on public.jobs;
create policy "jobs_select_visible" on public.jobs
  for select using (
    status = 'open'
    or client_id = auth.uid()
    or exists (
      select 1 from public.proposals p
      where p.job_id = jobs.id and p.freelancer_id = auth.uid()
    )
  );

-- jobs: only signed-in clients can post, always as themselves
drop policy if exists "jobs_insert_client" on public.jobs;
create policy "jobs_insert_client" on public.jobs
  for insert with check (
    client_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'client'
    )
  );

-- jobs: owners can edit/close their jobs
drop policy if exists "jobs_update_owner" on public.jobs;
create policy "jobs_update_owner" on public.jobs
  for update using (client_id = auth.uid())
  with check (client_id = auth.uid());

drop policy if exists "jobs_delete_owner" on public.jobs;
create policy "jobs_delete_owner" on public.jobs
  for delete using (client_id = auth.uid());

-- proposals: a freelancer sees their own; a client sees proposals
-- on their own jobs. Nobody else sees them.
drop policy if exists "proposals_select_parties" on public.proposals;
create policy "proposals_select_parties" on public.proposals
  for select using (
    freelancer_id = auth.uid()
    or exists (
      select 1 from public.jobs j
      where j.id = proposals.job_id and j.client_id = auth.uid()
    )
  );

-- proposals: signed-in freelancers apply to open jobs (not their own)
drop policy if exists "proposals_insert_freelancer" on public.proposals;
create policy "proposals_insert_freelancer" on public.proposals
  for insert with check (
    freelancer_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'freelancer'
    )
    and exists (
      select 1 from public.jobs j
      where j.id = proposals.job_id
        and j.status = 'open'
        and j.client_id <> auth.uid()
    )
  );

-- proposals: the client who owns the job accepts/declines
drop policy if exists "proposals_update_job_owner" on public.proposals;
create policy "proposals_update_job_owner" on public.proposals
  for update using (
    exists (
      select 1 from public.jobs j
      where j.id = proposals.job_id and j.client_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.jobs j
      where j.id = proposals.job_id and j.client_id = auth.uid()
    )
  );

-- proposals: freelancers can withdraw their own applications
drop policy if exists "proposals_delete_own" on public.proposals;
create policy "proposals_delete_own" on public.proposals
  for delete using (freelancer_id = auth.uid());
