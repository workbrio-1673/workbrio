-- ============================================================
-- Workbrio M2 — RLS fix PART 2 (sirf policies; functions pehle
-- se live hain). POORI file copy karein — chhoti hai!
-- Supabase -> SQL Editor -> New query -> paste -> Run
-- ============================================================

drop policy if exists "jobs_select_visible" on public.jobs;
create policy "jobs_select_visible" on public.jobs
  for select using (
    status = 'open'
    or client_id = auth.uid()
    or public.has_applied_to_job(id)
  );

drop policy if exists "proposals_select_parties" on public.proposals;
create policy "proposals_select_parties" on public.proposals
  for select using (
    freelancer_id = auth.uid()
    or public.is_job_owner(job_id)
  );

drop policy if exists "proposals_insert_freelancer" on public.proposals;
create policy "proposals_insert_freelancer" on public.proposals
  for insert with check (
    freelancer_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'freelancer'
    )
    and public.is_job_open_to_apply(job_id)
  );

drop policy if exists "proposals_update_job_owner" on public.proposals;
create policy "proposals_update_job_owner" on public.proposals
  for update using (public.is_job_owner(job_id))
  with check (public.is_job_owner(job_id));
