-- ============================================================
-- Workbrio M2 — RLS infinite-recursion fix (42P17)
-- ============================================================
-- HOW TO APPLY (2 minutes):
--   1. Supabase dashboard -> SQL Editor -> New query
--   2. Paste this ENTIRE file -> Run -> "Success"
-- Run AFTER 20261008_m2_jobs.sql. Safe to re-run.
--
-- Root cause: the jobs SELECT policy reads public.proposals,
-- and the proposals policies read public.jobs -> Postgres
-- detects infinite recursion and rejects every query.
-- Fix (official Supabase pattern): SECURITY DEFINER helper
-- functions bypass RLS for these cross-table checks, breaking
-- the cycle. Helpers only ever inspect the CURRENT user's rows.
-- ============================================================

-- ---------- helpers ----------

create or replace function public.is_job_owner(j_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.jobs
    where id = j_id and client_id = auth.uid()
  );
$$;

create or replace function public.has_applied_to_job(j_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.proposals
    where job_id = j_id and freelancer_id = auth.uid()
  );
$$;

create or replace function public.is_job_open_to_apply(j_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.jobs
    where id = j_id and status = 'open' and client_id <> auth.uid()
  );
$$;

grant execute on function public.is_job_owner(uuid) to anon, authenticated;
grant execute on function public.has_applied_to_job(uuid) to anon, authenticated;
grant execute on function public.is_job_open_to_apply(uuid) to anon, authenticated;

-- ---------- jobs policies (fixed: no cross-table RLS reads) ----------

drop policy if exists "jobs_select_visible" on public.jobs;
create policy "jobs_select_visible" on public.jobs
  for select using (
    status = 'open'
    or client_id = auth.uid()
    or public.has_applied_to_job(id)
  );

-- jobs_insert_client / jobs_update_owner / jobs_delete_owner:
-- only read public.profiles (no recursion there) -> unchanged.

-- ---------- proposals policies (fixed) ----------

drop policy if exists "proposals_select_parties" on public.proposals;
create policy "proposals_select_parties" on public.proposals
  for select using (
    freelancer_id = auth.uid()
    or public.is_job_owner(job_id)
  );

drop policy if exists "proposals_insert_freelancer" on public.proposals;
create policy "proposals_insert_freelancer" on public.proposals
  for insert with check (
    freelancer_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'freelancer'
    )
    and public.is_job_open_to_apply(job_id)
  );

drop policy if exists "proposals_update_job_owner" on public.proposals;
create policy "proposals_update_job_owner" on public.proposals
  for update using (public.is_job_owner(job_id))
  with check (public.is_job_owner(job_id));

-- proposals_delete_own: no cross-table reads -> unchanged.
