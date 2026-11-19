import type { Metadata } from "next";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { JobCard } from "@/components/JobCard";
import { JobFilters } from "@/components/JobFilters";
import { JobsHeader } from "@/components/JobsHeader";
import type { JobWithClient, Skill } from "@/lib/supabase/types";
import { todayISO } from "@/lib/supabase/types";
import { mapJobRow, splitJobs } from "@/lib/jobs";

export const metadata: Metadata = {
  title: "Browse Jobs",
  description:
    "Browse open jobs on Workbrio — freelance gigs and real employment jobs from Pakistan and around the world. Search by skill, budget and place, and apply.",
};

/** Browse page: /jobs — search + filters. Session read via cookies(),
 * so it renders dynamically per request. */
export const instant = false;

type SearchParams = {
  q?: string;
  skill?: string;
  budget_type?: string;
  min?: string;
  max?: string;
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

async function loadJobs(params: SearchParams): Promise<JobWithClient[]> {
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select("*, client:client_id(full_name, avatar_url, headline, location)")
    .eq("status", "open")
    // Auto-expiry: a job vanishes from the board the day after its
    // deadline. No deadline = never expires. No cron needed — the
    // date comparison does it on every load.
    .or(`deadline.is.null,deadline.gte.${todayISO()}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (params.q?.trim()) {
    const q = params.q.trim().replace(/,/g, " ");
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (params.skill) {
    query = query.contains("skills_required", [params.skill]);
  }
  if (params.budget_type === "fixed" || params.budget_type === "hourly") {
    query = query.eq("budget_type", params.budget_type);
  }
  const min = Number(params.min);
  if (Number.isFinite(min) && min > 0) query = query.gte("budget_amount", min);
  const max = Number(params.max);
  if (Number.isFinite(max) && max > 0) query = query.lte("budget_amount", max);

  const { data, error } = await query;
  if (error) {
    // Tables not created yet (migration not run) → show empty state, not a crash.
    return [];
  }
  return (data ?? []).map((row) =>
    mapJobRow(row as unknown as Record<string, unknown>)
  );
}

/** One of the two jobs sections: Pakistani jobs or International jobs. */
function JobSection({
  title,
  jobs,
  emptyText,
}: {
  title: string;
  jobs: JobWithClient[];
  emptyText: string;
}) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">
          {title}
        </h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
        </span>
      </div>
      {jobs.length > 0 ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
          {emptyText}
        </p>
      )}
    </section>
  );
}

/** Protected browse page: /jobs */
export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams;

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

  const [jobs, allSkills] = await Promise.all([
    loadJobs(params),
    (async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("skills")
        .select("id, name")
        .order("name");
      return (data ?? []) as Skill[];
    })(),
  ]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = (user?.user_metadata?.role as string | undefined) ?? "freelancer";

  // Two sections: Pakistani jobs and International jobs. The search and
  // filters above already narrowed the list; the split only groups it.
  const { pakistani, international } = splitJobs(jobs);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <JobsHeader count={jobs.length} isClient={role === "client"} />

        <div className="mt-6">
          <JobFilters
            initial={{
              q: params.q ?? "",
              skill: params.skill ?? "",
              budget_type: params.budget_type ?? "",
              min: params.min ?? "",
              max: params.max ?? "",
            }}
            allSkills={allSkills}
          />
        </div>

        {jobs.length > 0 ? (
          <>
            <JobSection
              title="🇵🇰 Pakistani Jobs"
              jobs={pakistani}
              emptyText="No Pakistani jobs match your search right now — try clearing the filters."
            />
            <JobSection
              title="🌍 International Jobs"
              jobs={international}
              emptyText="No international jobs match your search right now — try clearing the filters."
            />
          </>
        ) : (
          <Card className="mt-8 text-center">
            <p className="text-4xl">🔍</p>
            <h2 className="mt-4 text-xl font-extrabold text-ink-900">
              No jobs match your search
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Try different keywords or clear the filters. If the jobs tables
              haven't been created yet, ask the workspace owner to run the M2
              SQL migration.
            </p>
            <p className="mt-4">
              <Link
                href="/jobs"
                className="text-sm font-semibold text-brand-600 hover:text-brand-500"
              >
                Clear all filters
              </Link>
            </p>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
