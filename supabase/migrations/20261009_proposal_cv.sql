-- Workbrio: CV (PDF) upload for job proposals.
-- Run this in Supabase → SQL Editor → New query → Run.

-- 1) CV url column on proposals
alter table public.proposals
  add column if not exists cv_url text;

-- 2) Private storage bucket for CVs
insert into storage.buckets (id, name, public)
  values ('cvs', 'cvs', false)
  on conflict (id) do nothing;

-- 3) Storage policies: authenticated users can upload + read CVs.
--    (Both applicant and job poster are authenticated.)
drop policy if exists "Authenticated can upload CVs" on storage.objects;
create policy "Authenticated can upload CVs"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cvs');

drop policy if exists "Authenticated can read CVs" on storage.objects;
create policy "Authenticated can read CVs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'cvs');

drop policy if exists "Users can delete own CVs" on storage.objects;
create policy "Users can delete own CVs"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cvs');
