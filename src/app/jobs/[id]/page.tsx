import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { SkillChip } from "@/components/SkillChip";
import { ApplicationForm } from "@/components/ApplicationForm";
import { JobCommentList } from "@/components/JobCommentList";
import { ReportButton } from "@/components/ReportButton";
import { SaveJobButton } from "@/components/SaveJobButton";
import { ShareButtons } from "@/components/ShareButtons";
import { RelatedJobs } from "@/components/RelatedJobs";
import type {
  JobWithClient,
  ProposalStatus,
} from "@/lib/supabase/types";
import {
  deadlineLabel,
  isJobExpired,
  JOB_TYPE_LABELS,
  salaryLabel,
  timeAgo,
} from "@/lib/supabase/types";

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
    budget_amount:
      row.budget_amount != null ? Number(row.budget_amount) : null,
    skills_required: (row.skills_required as string[] | null) ?? [],
    status: row.status as "open" | "closed" | "in_progress",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    company_name: (row.company_name as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    apply_url: (row.apply_url as string | null) ?? null,
    deadline:
      row.deadline != null ? String(row.deadline).slice(0, 10) : null,
    job_type: (row.job_type as JobWithClient["job_type"]) ?? null,
    source_name: (row.source_name as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    salary_text: (row.salary_text as string | null) ?? null,
    client_name: (client?.full_name as string | null) ?? null,
    client_avatar: (client?.avatar_url as string | null) ?? null,
    client_headline: (client?.headline as string | null) ?? null,
    client_location: (client?.location as string | null) ?? null,
  };
}

/** Per-job Open Graph/Twitter tags so a shared job previews as THE JOB
    (its title, description and image) instead of the generic site card.
    Runs without a session: jobs are publicly readable, and crawlers
    (Facebook/WhatsApp) never have one. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!isSupabaseConfigured()) return {};
  const job = await loadJob(id);
  if (!job) return {};
  const baseTitle = job.company_name
    ? `${job.title} — ${job.company_name}`
    : job.title;
  // Country/place rides along in the preview title when it fits, so a
  // shared job always says where it is. Long multi-city locations stay
  // out of the title (they still lead the description below).
  const locSuffix = job.location ? ` · ${job.location}` : "";
  const metaTitle =
    `${baseTitle}${locSuffix}`.length <= 100 ? baseTitle + locSuffix : baseTitle;
  const cleanDescription = job.description.replace(/\s+/g, " ").trim();
  const body =
    cleanDescription.length > 0
      ? cleanDescription.slice(0, 150)
      : salaryLabel(job);
  // Location first, so the place + country shows with the job everywhere.
  const metaDescription = [job.location, body]
    .filter(Boolean)
    .join(" · ");
  const imageUrl = job.image_url ?? "/logo.png";
  const pageUrl = `${SITE_URL}/jobs/${job.id}`;
  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: pageUrl,
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: job.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [imageUrl],
    },
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

  const job = await loadJob(id);
  if (!job) notFound();

  // Viewing is public (so crawlers and logged-out visitors see the job);
  // only actions (apply / save / comment / report) need a signed-in user.
  const role = (user?.user_metadata?.role as string | undefined) ?? "freelancer";
  const isOwner = user != null && user.id === job.client_id;

  // Auto-expiry: the job stops accepting applications the day after its
  // deadline, even though its stored status is still "open".
  const expired = isJobExpired(job);
  const isOpen = job.status === "open" && !expired;

  // Has this freelancer already applied?
  let existingStatus: ProposalStatus | null = null;
  let proposalCount = 0;
  if (user && !isOwner && role === "freelancer") {
    const { data } = await supabase
      .from("proposals")
      .select("status")
      .eq("job_id", id)
      .eq("freelancer_id", user.id)
      .maybeSingle();
    if (data) existingStatus = data.status as ProposalStatus;
  }
  if (user && isOwner) {
    const { count } = await supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("job_id", id);
    proposalCount = count ?? 0;
  }

  // Comment count for the job (shown on every open job, own-posted or external).
  let commentCount = 0;
  if (user && job.status === "open") {
    const { count } = await supabase
      .from("job_comments")
      .select("id", { count: "exact", head: true })
      .eq("job_id", id);
    commentCount = count ?? 0;
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
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                    expired
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-emerald-500/10 text-emerald-600"
                  }`}
                >
                  {expired ? "Expired" : statusLabels[job.status]}
                </span>
                <span className="text-sm text-slate-400">
                  Posted {timeAgo(job.created_at)}
                </span>
                {!isOwner && user && (
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

              {/* Employment job facts (M6) — only shown when the poster added them. */}
              {(job.company_name || job.location || job.job_type || job.deadline) && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  {job.company_name && (
                    <span className="text-base font-extrabold text-ink-900">
                      {job.company_name}
                    </span>
                  )}
                  {job.location && (
                    <span className="text-slate-600">📍 {job.location}</span>
                  )}
                  {job.job_type && (
                    <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-600">
                      {JOB_TYPE_LABELS[job.job_type]}
                    </span>
                  )}
                  {job.deadline && (
                    <span className="font-bold text-amber-600">
                      {expired
                        ? `Closed on ${deadlineLabel(job.deadline)}`
                        : `Apply by ${deadlineLabel(job.deadline)}`}
                    </span>
                  )}
                </div>
              )}

              <p className="mt-2 text-xl font-extrabold text-gradient">
                {salaryLabel(job)}
              </p>

              {/* External apply: real employment jobs link out to the employer's
                  own page. Workbrio does not handle that application.
                  Like every apply path, the link is only shown once signed
                  in — logged-out visitors are asked to sign in first. */}
              {job.apply_url && isOpen && user != null && (
                <div className="mt-5">
                  <Button
                    href={job.apply_url}
                    target="_blank"
                  >
                    Apply here ↗
                  </Button>
                  <p className="mt-2 text-xs text-slate-500">
                    You apply on the employer&apos;s website — Workbrio does
                    not handle this application.
                    {job.source_name && (
                      <> Source: {job.source_name}.</>
                    )}
                  </p>
                </div>
              )}

              {/* Save + Share — ease of use */}
              {!isOwner && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {user ? (
                    <SaveJobButton jobId={job.id} userId={user.id} />
                  ) : (
                    <Button href="/login" variant="secondary" size="sm">
                      Sign in to save
                    </Button>
                  )}
                  <ShareButtons title={job.title} description={job.description} location={job.location ?? undefined} />
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
                    View {proposalCount}{" "}
                    {job.job_type != null ? "application" : "proposal"}
                    {proposalCount === 1 ? "" : "s"}
                  </Button>
                  <Button href="/dashboard/jobs" variant="ghost" size="sm">
                    Manage my jobs
                  </Button>
                </div>
              )}
            </Card>

            {/* Comments — signed-in users can ask questions about any open job,
                own-posted or external. */}
            {isOpen && (
              <Card>
                <h2 className="text-lg font-extrabold text-ink-900">
                  Questions &amp; comments
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ask about the role, the salary, or how to apply.
                </p>
                <div className="mt-3">
                  {user ? (
                    <JobCommentList
                      jobId={job.id}
                      userId={user.id}
                      initialCount={commentCount}
                    />
                  ) : (
                    <div>
                      <p className="text-sm text-slate-600">
                        Sign in to ask a question or comment on this job.
                      </p>
                      <div className="mt-3">
                        <Button href="/login" variant="secondary" size="sm">
                          Sign in
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
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

            {user != null && !isOwner && !job.apply_url && role === "freelancer" && isOpen && (
              <ApplicationForm
                jobId={job.id}
                userId={user.id}
                jobBudgetType={job.budget_type}
                existingStatus={existingStatus}
                isEmployment={job.job_type != null}
              />
            )}

            {/* Logged-out visitors: sign in to apply. After signing in they
                come back to this job (next=) so they can apply right away. */}
            {user == null && isOpen && (
              <Card>
                <p className="text-sm text-slate-600">
                  Sign in to apply to this job.
                </p>
                <div className="mt-3">
                  <Button
                    href={`/login?next=/jobs/${job.id}`}
                    variant="secondary"
                    size="sm"
                  >
                    Sign in to apply
                  </Button>
                </div>
              </Card>
            )}

            {/* Related jobs — discovery ease */}
            <RelatedJobs jobId={job.id} skills={job.skills_required} />

            {user != null && !isOwner && !job.apply_url && role !== "freelancer" && (
              <Card>
                <p className="text-sm text-slate-600">
                  Only freelancer accounts can apply to jobs. You signed up as
                  a {role}.
                </p>
              </Card>
            )}

            {!isOpen && !isOwner && (
              <Card>
                <p className="text-sm text-slate-600">
                  {expired
                    ? `This job's last date (${deadlineLabel(job.deadline)}) has passed, so it is no longer accepting applications.`
                    : `This job is ${statusLabels[job.status]?.toLowerCase()} and is
                  no longer accepting proposals.`}
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
