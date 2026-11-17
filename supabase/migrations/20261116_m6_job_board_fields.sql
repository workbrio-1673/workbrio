-- ============================================================
-- Workbrio M6 — Job-board fields on jobs
-- ============================================================
-- HOW TO APPLY (2 minutes, no code needed):
--   1. Open your Supabase project dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "New query", paste this ENTIRE file, click "Run"
-- Done. Real employment jobs (Pakistan + international, incl. remote)
-- can now be posted with company, location, apply link, last date,
-- job type and source — and the salary/budget becomes optional, so a
-- job whose pay is not published never shows an invented number.
-- Safe to re-run: every statement is idempotent.
-- REQUIRES: the M2 migration (20261008_m2_jobs.sql) applied first.
-- ============================================================

-- ---------- New columns (all optional) ----------

alter table public.jobs
  add column if not exists company_name text;

alter table public.jobs
  add column if not exists location text;

alter table public.jobs
  add column if not exists apply_url text;

alter table public.jobs
  add column if not exists deadline date;

alter table public.jobs
  add column if not exists job_type text;

alter table public.jobs
  add column if not exists source_name text;

-- ---------- Job type values ----------

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.jobs'::regclass
      and conname = 'jobs_job_type_check'
  ) then
    alter table public.jobs
      add constraint jobs_job_type_check
      check (job_type is null or job_type in (
        'full-time', 'part-time', 'contract', 'internship', 'remote'
      ));
  end if;
end $$;

-- ---------- Budget becomes optional ----------

-- Drop the old "budget_amount > 0" check (it was created without a
-- fixed name by the M2 migration, so find it by its definition).
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.jobs'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%budget_amount% > 0%'
  loop
    execute format('alter table public.jobs drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.jobs
  alter column budget_amount drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.jobs'::regclass
      and conname = 'jobs_budget_amount_check'
  ) then
    alter table public.jobs
      add constraint jobs_budget_amount_check
      check (budget_amount is null or budget_amount > 0);
  end if;
end $$;

-- ---------- Notes ----------
-- * Existing freelance jobs keep working: their budgets stay as-is,
--   and the new columns are simply empty for them.
-- * RLS policies are unchanged: only signed-in clients can post
--   (client_id = auth.uid() and profile role = 'client'), open jobs
--   stay public, owners still edit/close their own jobs.
-- * A job with no budget shows "Salary not listed" on the site —
--   never a made-up number.
