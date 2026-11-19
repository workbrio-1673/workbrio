-- ============================================================
-- Workbrio M6e — Comments on job posts
-- ============================================================
-- HOW TO APPLY (2 minutes, no code needed):
--   1. Open your Supabase project dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "New query", paste this ENTIRE file, click "Run"
-- Done. Job comments are created at once.
-- Safe to re-run: every statement is idempotent.
-- REQUIRES: the M2 migration (20261008_m2_jobs.sql) applied first
--   (public.jobs) and M1 (20261008_m1_profiles.sql).
--
-- WHY: feed posts already have comments (M3: public.comments), but
-- the job detail page had no way for signed-in users to ask
-- questions about a job. This adds public.job_comments, mirroring
-- the M3 comments pattern: signed-in users read, authenticated
-- users comment as themselves, only the author can edit or delete
-- their comment. RLS uses ONLY direct auth.uid() comparisons —
-- no cross-table reads — so there is no infinite-recursion risk.
-- No seed comments: comments are plain user text only.
-- ============================================================

-- ---------- Table ----------

create table if not exists public.job_comments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists job_comments_job_idx
  on public.job_comments (job_id, created_at asc);

-- ---------- Row Level Security ----------

alter table public.job_comments enable row level security;

-- job_comments: signed-in users can read; authenticated users
-- comment as themselves; only the author can edit or delete
-- their comment.
drop policy if exists "job_comments_auth_read" on public.job_comments;
create policy "job_comments_auth_read" on public.job_comments
  for select using (auth.role() = 'authenticated');

drop policy if exists "job_comments_insert_own" on public.job_comments;
create policy "job_comments_insert_own" on public.job_comments
  for insert with check (author_id = auth.uid());

drop policy if exists "job_comments_update_own" on public.job_comments;
create policy "job_comments_update_own" on public.job_comments
  for update using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "job_comments_delete_own" on public.job_comments;
create policy "job_comments_delete_own" on public.job_comments
  for delete using (author_id = auth.uid());
