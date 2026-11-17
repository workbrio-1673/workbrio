-- ============================================================
-- Workbrio M6b — Job image on jobs
-- ============================================================
-- HOW TO APPLY (2 minutes, no code needed):
--   1. Open your Supabase project dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "New query", paste this ENTIRE file, click "Run"
-- Done. Each job can now carry one photo (image_url) — a generic,
-- freely hotlinkable photo (e.g. Unsplash) that makes the job card
-- look like a real listing. No company logos are stored; the photo
-- is only a visual for the card.
-- Safe to re-run: the statement is idempotent.
-- REQUIRES: the M6 migration (20261116_m6_job_board_fields.sql)
-- applied first (it is not required for this column, but the batch
-- SQL that inserts image_url values assumes the M6 columns exist).
-- ============================================================

alter table public.jobs
  add column if not exists image_url text;

-- ---------- Notes ----------
-- * image_url is optional (NULL = no photo). Old jobs and classic
--   freelance gigs simply show no banner — their cards look exactly
--   as before.
-- * RLS policies are unchanged: the column is part of the jobs row,
--   so the same public-read / owner-write rules apply.
-- * Photos are hotlinked (Unsplash / Pexels direct image URLs), not
--   uploaded to Supabase Storage — nothing to store or clean up.
