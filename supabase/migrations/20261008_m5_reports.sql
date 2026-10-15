-- ============================================================
-- Workbrio M5 — Reports / moderation schema
-- ============================================================
-- HOW TO APPLY (2 minutes, no code needed):
--   1. Open your Supabase project dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "+ New query" (a FRESH tab — do not reuse a tab that
--      still has old SQL in it), paste this ENTIRE file, click "Run"
-- Done. The reports table and its permissions are created at once.
-- Safe to re-run: every statement is idempotent.
-- REQUIRES: the M1 migration (20261008_m1_profiles.sql) applied first.
--
-- NOTE: reports are write-only for members. There is deliberately
-- NO public read policy — reports are reviewed by an admin
-- (admin review UI is out of MVP scope).
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null
    check (target_type in ('post', 'job', 'profile', 'message')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'actioned')),
  created_at timestamptz not null default now()
);

create index if not exists reports_target_idx
  on public.reports (target_type, target_id);
create index if not exists reports_status_idx
  on public.reports (status, created_at desc);

-- ---------- Row Level Security ----------
-- Recursion-free by design: only direct auth.uid() comparisons,
-- zero cross-table reads.

alter table public.reports enable row level security;

-- Signed-in members can file reports as themselves.
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (reporter_id = auth.uid());

-- No SELECT / UPDATE / DELETE policies for members on purpose:
-- reports are reviewed by an admin outside the MVP app.
