-- ============================================================
-- Workbrio M3 — Feed (posts, likes, comments) schema
-- ============================================================
-- HOW TO APPLY (2 minutes, no code needed):
--   1. Open your Supabase project dashboard
--   2. Go to "SQL Editor" in the left sidebar
--   3. Click "New query", paste this ENTIRE file, click "Run"
-- Done. The feed tables, permissions and post-image storage are
-- all created at once.
-- Safe to re-run: every statement is idempotent.
-- REQUIRES: the M1 migration (20261008_m1_profiles.sql) applied first.
--
-- RLS design note: every policy below uses ONLY direct
-- auth.uid() comparisons — no cross-table reads — so there is
-- no infinite-recursion risk (the M2 jobs/proposals cycle taught
-- us this lesson; see 20261008_m2_jobs_rls_fix.sql).
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 5000),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx
  on public.posts (created_at desc);
create index if not exists post_likes_post_idx
  on public.post_likes (post_id);
create index if not exists comments_post_idx
  on public.comments (post_id, created_at asc);

-- ---------- updated_at auto-touch for posts ----------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.handle_updated_at();

-- ---------- Row Level Security ----------

alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;

-- posts: everyone can read; signed-in users post as themselves;
-- only the author can edit or delete their post.
drop policy if exists "posts_public_read" on public.posts;
create policy "posts_public_read" on public.posts
  for select using (true);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts
  for insert with check (author_id = auth.uid());

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts
  for update using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts
  for delete using (author_id = auth.uid());

-- post_likes: everyone can read; users like/unlike as themselves.
drop policy if exists "post_likes_public_read" on public.post_likes;
create policy "post_likes_public_read" on public.post_likes
  for select using (true);

drop policy if exists "post_likes_insert_own" on public.post_likes;
create policy "post_likes_insert_own" on public.post_likes
  for insert with check (user_id = auth.uid());

drop policy if exists "post_likes_delete_own" on public.post_likes;
create policy "post_likes_delete_own" on public.post_likes
  for delete using (user_id = auth.uid());

-- comments: everyone can read; signed-in users comment as
-- themselves; only the author can edit or delete their comment.
drop policy if exists "comments_public_read" on public.comments;
create policy "comments_public_read" on public.comments
  for select using (true);

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments
  for insert with check (author_id = auth.uid());

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments
  for update using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments
  for delete using (author_id = auth.uid());

-- ---------- Post image storage bucket (public) ----------

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = true;

-- Public read of post images
drop policy if exists "post_images_public_read" on storage.objects;
create policy "post_images_public_read" on storage.objects
  for select using (bucket_id = 'post-images');

-- Signed-in users upload into their own folder: post-images/<their-user-id>/...
drop policy if exists "post_images_owner_insert" on storage.objects;
create policy "post_images_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post_images_owner_update" on storage.objects;
create policy "post_images_owner_update" on storage.objects
  for update using (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post_images_owner_delete" on storage.objects;
create policy "post_images_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
