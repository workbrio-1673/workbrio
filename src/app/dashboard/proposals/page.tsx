import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/Card";
import { ProposalList } from "@/components/ProposalList";
import type { Job, ProposalWithFreelancer } from "@/lib/supabase/types";

/** Applicant inbox: /dashboard/proposals (clients). Session via cookies(), dynamic. */
export const instant = false;

type JobWithProposals = {
  job: Job;
  proposals: ProposalWithFreelancer[];
};

async function loadInbox(userId: string): Promise<JobWithProposals[]> {
  const supabase = await createClient();

  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("*")
    .eq("client_id", userId)
    .order("created_at", { ascending: false });
  if (jobsError || !jobs || jobs.length === 0) return [];

  const jobIds = jobs.map((j) => j.id as string);
  const { data: proposals } = await supabase
    .from("proposals")
    .select(
      "*, freelancer:freelancer_id(full_name, avatar_url, headline, hourly_rate)"
    )
    .in("job_id", jobIds)
    .order("created_at", { ascending: false });

  const byJob = new Map<string, ProposalWithFreelancer[]>();
  for (const p of (proposals ?? []) as unknown as Record<string, unknown>[]) {
    const f = (p.freelancer as Record<string, unknown> | null) ?? null;
    const mapped: ProposalWithFreelancer = {
      id: String(p.id),
      job_id: String(p.job_id),
      freelancer_id: String(p.freelancer_id),
      cover_note: (p.cover_note as string | null) ?? null,
      bid_amount: p.bid_amount != null ? Number(p.bid_amount) : null,
      cv_url: (p.cv_url as string | null) ?? null,
      status: p.status as "pending" | "accepted" | "declined",
      created_at: String(p.created_at),
      freelancer_name: (f?.full_name as string | null) ?? null,
      freelancer_avatar: (f?.avatar_url as string | null) ?? null,
      freelancer_headline: (f?.headline as string | null) ?? null,
      freelancer_rate: f?.hourly_rate != null ? Number(f.hourly_rate) : null,
    };
    const list = byJob.get(mapped.job_id) ?? [];
    list.push(mapped);
    byJob.set(mapped.job_id, list);
  }

  return (jobs as Job[]).map((job) => ({
    job,
    proposals: byJob.get(job.id) ?? [],
  }));
}

export default async function ProposalsInboxPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <AppNavbar />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-slate-600">
            Supabase is not connected yet. See README.md for setup.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const inbox = await loadInbox(user.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          Proposals
        </h1>
        <p className="mt-1 text-slate-600">
          Freelancers who applied to your jobs. Accepting a proposal starts the
          job and declines the others.
        </p>

        <div className="mt-8 space-y-6">
          {inbox.length === 0 ? (
            <Card className="text-center">
              <p className="text-4xl">📥</p>
              <h2 className="mt-4 text-xl font-extrabold text-ink-900">
                No jobs posted yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Post a job first — proposals from freelancers will land here.
              </p>
            </Card>
          ) : (
            inbox.map(({ job, proposals }) => (
              <ProposalList
                key={job.id}
                jobId={job.id}
                jobTitle={job.title}
                proposals={proposals}
                isEmployment={job.job_type != null}
              />
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
