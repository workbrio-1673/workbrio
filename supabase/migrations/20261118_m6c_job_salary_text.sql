-- ============================================================
-- Workbrio M6c — Job salary as free text
-- ============================================================
-- HOW TO APPLY (2 minutes, no code needed):
--   1. Open your Supabase project dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "New query", paste this ENTIRE file, click "Run"
-- Done. Each job can now carry its employer-stated pay as text
-- (e.g. "£32,073–£39,043 / year") instead of only a single
-- number. The site's budget field is a single number and cannot
-- honestly hold a salary range — that is why ranged jobs showed
-- "Salary not listed" even though the range was in the description.
-- Safe to re-run: the statement is idempotent.
-- REQUIRES: the M6 migration (20261116_m6_job_board_fields.sql)
-- applied first (the column itself needs nothing else, but the
-- backfill SQL assumes the M6 columns exist).
-- ============================================================

alter table public.jobs
  add column if not exists salary_text text;

-- ---------- Notes ----------
-- * salary_text is optional (NULL = no published pay). Jobs with no
--   stated pay keep showing "Salary not listed" — never invent one.
-- * Only employer-stated values go here, copied from the listing
--   (e.g. "PKR 45,000–65,000 / month", "$21.83 / hour").
-- * RLS policies are unchanged: the column is part of the jobs row,
--   so the same public-read / owner-write rules apply.
