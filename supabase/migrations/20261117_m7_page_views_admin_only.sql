-- ============================================================
-- Workbrio M7 — Site analytics readable by admin only
-- ============================================================
-- HOW TO APPLY (2 minutes, no code needed):
--   1. Open your Supabase project dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "New query", paste this ENTIRE file, click "Run"
-- Done. The page_views stats (total / today / unique visitors) can
-- then only be read by the admin account (azmeeaslam@gmail.com).
-- Other signed-in users see no numbers at all — the dashboard card
-- is hidden for them too (code change in src/app/dashboard/page.tsx).
-- Logging a visit stays open to everyone (insert policy untouched),
-- so visit counting keeps working exactly as before.
-- Safe to re-run: every statement is idempotent.
-- REQUIRES: the analytics migration (20261009_analytics.sql) first.
-- ============================================================

-- ---------- Restrict page_views reads to the admin ----------

drop policy if exists "Signed-in users can read stats" on public.page_views;
drop policy if exists "Only admin can read stats" on public.page_views;
create policy "Only admin can read stats"
  on public.page_views for select
  using ((auth.jwt() ->> 'email') = 'azmeeaslam@gmail.com');
