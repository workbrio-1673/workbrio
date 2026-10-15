-- ============================================================
-- Workbrio — Services (Fiverr-style gig storefront) schema
-- ============================================================
-- HOW TO APPLY (2 minutes, no code needed):
--   1. Open your Supabase project dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "New query", paste this ENTIRE file, click "Run"
-- Done. The services table plus its permissions are created at once.
-- Safe to re-run: every statement is idempotent.
-- REQUIRES: the M1 migration (20261008_m1_profiles.sql) applied first.
-- ============================================================

-- ---------- Table ----------

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null default 'Other',
  price numeric(10, 2) not null check (price > 0),
  delivery_days integer not null default 3 check (delivery_days > 0),
  skills text[] not null default '{}',
  status text not null default 'active'
    check (status in ('active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_freelancer_idx
  on public.services (freelancer_id);
create index if not exists services_status_idx
  on public.services (status);

-- ---------- updated_at auto-touch (reuses M1 function) ----------

drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at
  before update on public.services
  for each row execute function public.handle_updated_at();

-- ---------- Row Level Security ----------

alter table public.services enable row level security;

-- services: active services are public; owners see all of theirs
drop policy if exists "services_select_visible" on public.services;
create policy "services_select_visible" on public.services
  for select using (
    status = 'active'
    or freelancer_id = auth.uid()
  );

-- services: only signed-in freelancers can list, always as themselves
drop policy if exists "services_insert_freelancer" on public.services;
create policy "services_insert_freelancer" on public.services
  for insert with check (
    freelancer_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'freelancer'
    )
  );

-- services: owners can edit/pause their services
drop policy if exists "services_update_owner" on public.services;
create policy "services_update_owner" on public.services
  for update using (freelancer_id = auth.uid())
  with check (freelancer_id = auth.uid());

drop policy if exists "services_delete_owner" on public.services;
create policy "services_delete_owner" on public.services
  for delete using (freelancer_id = auth.uid());
