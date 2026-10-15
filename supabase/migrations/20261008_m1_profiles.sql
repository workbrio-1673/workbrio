-- ============================================================
-- Workbrio M1 — Profiles schema
-- ============================================================
-- HOW TO APPLY (2 minutes, no code needed):
--   1. Open your Supabase project dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "New query", paste this ENTIRE file, click "Run"
-- Done. The profiles tables, permissions, avatar storage and the
-- automatic profile-on-signup trigger are all created at once.
-- Safe to re-run: every statement is idempotent.
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'freelancer'
    check (role in ('freelancer', 'client')),
  full_name text,
  headline text,
  bio text,
  location text,
  hourly_rate numeric(10, 2),
  avatar_url text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_skills (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, skill_id)
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  link_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ---------- updated_at auto-touch ----------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ---------- Auto-create a profile row on signup ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_name text;
begin
  v_role := coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'freelancer');
  if v_role not in ('freelancer', 'client') then
    v_role := 'freelancer';
  end if;

  v_name := nullif(new.raw_user_meta_data ->> 'full_name', '');
  if v_name is null then
    v_name := split_part(new.email, '@', 1);
  end if;

  insert into public.profiles (id, role, full_name)
  values (new.id, v_role, v_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.profile_skills enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.reviews enable row level security;

-- profiles: anyone can read; owners manage their own row
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- skills: anyone can read; signed-in users can add new ones
drop policy if exists "skills_select_all" on public.skills;
create policy "skills_select_all" on public.skills
  for select using (true);

drop policy if exists "skills_insert_auth" on public.skills;
create policy "skills_insert_auth" on public.skills
  for insert with check (auth.role() = 'authenticated');

-- profile_skills: anyone can read; profile owner manages
drop policy if exists "profile_skills_select_all" on public.profile_skills;
create policy "profile_skills_select_all" on public.profile_skills
  for select using (true);

drop policy if exists "profile_skills_insert_own" on public.profile_skills;
create policy "profile_skills_insert_own" on public.profile_skills
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = profile_skills.profile_id and p.id = auth.uid()
    )
  );

drop policy if exists "profile_skills_delete_own" on public.profile_skills;
create policy "profile_skills_delete_own" on public.profile_skills
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = profile_skills.profile_id and p.id = auth.uid()
    )
  );

-- portfolio_items: anyone can read; profile owner manages
drop policy if exists "portfolio_select_all" on public.portfolio_items;
create policy "portfolio_select_all" on public.portfolio_items
  for select using (true);

drop policy if exists "portfolio_manage_own" on public.portfolio_items;
create policy "portfolio_manage_own" on public.portfolio_items
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- reviews: anyone can read; signed-in users can review OTHER profiles;
-- reviewers manage their own reviews
drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews
  for select using (true);

drop policy if exists "reviews_insert_others" on public.reviews;
create policy "reviews_insert_others" on public.reviews
  for insert with check (
    auth.role() = 'authenticated'
    and profile_id <> auth.uid()
    and (reviewer_id is null or reviewer_id = auth.uid())
  );

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update using (reviewer_id = auth.uid());

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews
  for delete using (reviewer_id = auth.uid());

-- ---------- Avatar storage bucket (public) ----------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Public read of avatars
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Signed-in users upload into their own folder: avatars/<their-user-id>/...
drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- Seed a starter skill catalog ----------

insert into public.skills (name) values
  ('Web Development'),
  ('UI/UX Design'),
  ('Graphic Design'),
  ('Logo Design'),
  ('Branding'),
  ('Content Writing'),
  ('Copywriting'),
  ('Translation'),
  ('Video Editing'),
  ('Motion Graphics'),
  ('Photography'),
  ('Voice Over'),
  ('Mobile App Development'),
  ('Game Development'),
  ('WordPress'),
  ('React'),
  ('Python'),
  ('AI & Machine Learning'),
  ('Blockchain'),
  ('Digital Marketing'),
  ('SEO'),
  ('Social Media Marketing'),
  ('Email Marketing'),
  ('Data Entry'),
  ('Virtual Assistance'),
  ('Customer Support'),
  ('Project Management'),
  ('Accounting'),
  ('Illustration')
on conflict (name) do nothing;
