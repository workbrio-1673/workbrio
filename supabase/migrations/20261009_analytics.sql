-- Workbrio visitor analytics: lightweight page-view tracking.
-- Run this in Supabase → SQL Editor → New query → Run.

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  visitor_key text not null,
  created_at timestamptz not null default now()
);

alter table public.page_views enable row level security;

-- Anyone (even logged-out visitors) can log a page view.
drop policy if exists "Anyone can log a page view" on public.page_views;
create policy "Anyone can log a page view"
  on public.page_views for insert
  to anon, authenticated
  with check (true);

-- Signed-in users can read the stats for the dashboard.
drop policy if exists "Signed-in users can read stats" on public.page_views;
create policy "Signed-in users can read stats"
  on public.page_views for select
  to authenticated
  using (true);

create index if not exists page_views_created_at_idx
  on public.page_views (created_at desc);
