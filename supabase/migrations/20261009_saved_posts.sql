-- Workbrio saved posts (LinkedIn-style "Saved items").
-- Run this in Supabase → SQL Editor → New query → Run.

create table if not exists public.saved_posts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.saved_posts enable row level security;

-- Users can only see and manage their own saved posts.
drop policy if exists "Users manage own saved posts" on public.saved_posts;
create policy "Users manage own saved posts"
  on public.saved_posts for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists saved_posts_user_idx
  on public.saved_posts (user_id, created_at desc);
