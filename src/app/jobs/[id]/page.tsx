import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { SkillChip } from "@/components/SkillChip";
import { ApplicationForm } from "@/components/ApplicationForm";
import { ReportButton } from "@/components/ReportButton";
import { SaveJobButton } from "@/components/SaveJobButton";
import { ShareButtons } from "@/components/ShareButtons";
import { RelatedJobs } from "@/components/RelatedJobs";
import type {
  JobWithClient,
  ProposalStatus,
} from "@/lib/supabase/types";
import { budgetLabel, timeAgo } from "@/lib/supabase/types";

/** Job detail page: /jobs/[id]. Session read via cookies(), dynamic. */
export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

async function loadJob(id: string): Promise<JobWithClient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, client:client_id(full_name, avatar_url, headline, location)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  const row = data as unknown as Record<string, unknown>;
  const client = (row.client as Record<string, unknown> | null) ?? null;
  return {
    id: String(row.id),
    client_id: String(row.client_id),
    title: String(row.title),
    description: String(row.description),
    budget_type: row.budget_type as "fixed" | "hourly",
    budget_amount: Number(row.budget_amount),
    skills_required: (row.skills_required as string[] | null) ?? [],
    status: row.status as "open" | "closed" | "in_progress",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    client_name: (client?.full_name as string | null) ?? null,
    client_avatar: (client?.avatar_url as string | null) ?? null,
    client_headline: (client?.headline as string | null) ?? null,
    client_location: (client?.location as string | null) ?? null,
  };
}

/** Job detail page: /jobs/[id] */
export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;

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

  const job = await loadJob(id);
  if (!job) notFound();

  const role = (user.user_metadata?.role as string | undefined) ?? "freelancer";
  const isOwner = user.id === job.client_id;

  // Has this freelancer already applied?
  let existingStatus: ProposalStatus | null = null;
  let proposalCount = 0;
  if (!isOwner && role === "freelancer") {
    const { data } = await supabase
      .from("proposals")
      .select("status")
      .eq("job_id", id)
      .eq("freelancer_id", user.id)
      .maybeSingle();
    if (data) existingStatus = data.status as ProposalStatus;
  }
  if (isOwner) {
    const { count } = await supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("job_id", id);
    proposalCount = count ?? 0;
  }

  const statusLabels: Record<string, string> = {
    open: "Open",
    in_progress: "In progress",
    closed: "Closed",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="mb-6">
          <Link
            href="/jobs"
            className="text-sm font-semibold text-brand-600 hover:text-brand-500"
          >
            ← Back to jobs
          </Link>
        </p>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold capitalize text-emerald-600">
                  {statusLabels[job.status]}
                </span>
                <span className="text-sm text-slate-400">
                  Posted {timeAgo(job.created_at)}
                </span>
                {!isOwner && (
                  <ReportButton
                    targetType="job"
                    targetId={job.id}
                    userId={user.id}
                    className="ml-auto"
                  />
                )}
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900">
                {job.title}
              </h1>
              <p className="mt-2 text-xl font-extrabold text-gradient">
                {budgetLabel(job.budget_type, job.budget_amount)}
              </p>

              {/* Save + Share — ease of use */}
              {!isOwner && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <SaveJobButton jobId={job.id} userId={user.id} />
                  <ShareButtons title={job.title} />
                </div>
              )}

              <h2 className="mt-8 text-lg font-extrabold text-ink-900">
                About this job
              </h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">
                {job.description}
              </p>

              {job.skills_required.length > 0 && (
                <>
                  <h2 className="mt-8 text-lg font-extrabold text-ink-900">
                    Skills required
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.skills_required.map((s) => (
                      <SkillChip key={s} name={s} />
                    ))}
                  </div>
                </>
              )}

              {isOwner && (
                <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
                  <Button href="/dashboard/proposals" variant="secondary" size="sm">
                    View {proposalCount} proposal{proposalCount === 1 ? "" : "s"}
                  </Button>
                  <Button href="/dashboard/jobs" variant="ghost" size="sm">
                    Manage my jobs
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                About the client
              </h2>
              <div className="mt-4 flex items-center gap-3">
                {job.client_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.client_avatar}
                    alt={job.client_name ?? "Client"}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-lg font-extrabold text-white">
                    {(job.client_name ?? "W")[0]?.toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/profile/${job.client_id}`}
                    className="block truncate font-bold text-ink-900 hover:text-brand-600"
                  >
                    {job.client_name ?? "Client"}
                  </Link>
                  {job.client_location && (
                    <p className="text-sm text-slate-500">📍 {job.client_location}</p>
                  )}
                </div>
              </div>
              {job.client_headline && (
                <p className="mt-3 text-sm text-slate-600">{job.client_headline}</p>
              )}
            </Card>

            {!isOwner && role === "freelancer" && job.status === "open" && (
              <ApplicationForm
                jobId={job.id}
                userId={user.id}
                jobBudgetType={job.budget_type}
                existingStatus={existingStatus}
              />
            )}

            {/* Related jobs — discovery ease */}
            <RelatedJobs jobId={job.id} skills={job.skills_required} />

            {!isOwner && role !== "freelancer" && (
              <Card>
                <p className="text-sm text-slate-600">
                  Only freelancer accounts can apply to jobs. You signed up as
                  a {role}.
                </p>
              </Card>
            )}

            {job.status !== "open" && !isOwner && (
              <Card>
                <p className="text-sm text-slate-600">
                  This job is {statusLabels[job.status]?.toLowerCase()} and is
                  no longer accepting proposals.
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
