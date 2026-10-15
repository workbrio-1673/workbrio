-- Workbrio saved jobs (bookmark jobs for later).
-- Run this in Supabase → SQL Editor → New query → Run.

create table if not exists public.saved_jobs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

alter table public.saved_jobs enable row level security;

drop policy if exists "Users manage own saved jobs" on public.saved_jobs;
create policy "Users manage own saved jobs"
  on public.saved_jobs for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists saved_jobs_user_idx
  on public.saved_jobs (user_id, created_at desc);
