/** Shared job helpers: Pakistani vs International split + row mapping.
 * Single source of truth for every page that lists jobs. */

import type { JobWithClient } from "@/lib/supabase/types";

/**
 * A job counts as Pakistani when its location names Pakistan
 * ("Lahore, Pakistan", "Remote (Pakistan)", "Remote (Islamabad, Pakistan)").
 * Everything else — including bare "Remote" worldwide roles and null
 * locations — counts as International. Grounded in the live table:
 * every Pakistani location contains the word "Pakistan".
 */
export function isPakistaniJob(job: { location: string | null }): boolean {
  return (job.location ?? "").toLowerCase().includes("pakistan");
}

/** Split a job list into Pakistani jobs and International jobs. */
export function splitJobs<T extends { location: string | null }>(jobs: T[]): {
  pakistani: T[];
  international: T[];
} {
  const pakistani: T[] = [];
  const international: T[] = [];
  for (const job of jobs) {
    if (isPakistaniJob(job)) pakistani.push(job);
    else international.push(job);
  }
  return { pakistani, international };
}

/** Map one raw Supabase jobs row (with optional embedded client) to a
 * JobWithClient. Same shape the /jobs page used to map inline. */
export function mapJobRow(row: Record<string, unknown>): JobWithClient {
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
