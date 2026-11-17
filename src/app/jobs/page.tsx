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

function mapJob(row: Record<string, unknown>): JobWithClient {
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
    client_name: (client?.full_name as string | null) ?? null,
    client_avatar: (client?.avatar_url as string | null) ?? null,
    client_headline: (client?.headline as string | null) ?? null,
    client_location: (client?.location as string | null) ?? null,
  };
}

async function loadJobs(params: SearchParams): Promise<JobWithClient[]> {
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select("*, client:client_id(full_name, avatar_url, headline, location)")
    .eq("status", "open")
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
    mapJob(row as unknown as Record<string, unknown>)
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
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
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
