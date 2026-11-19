import type { Metadata } from "next";
import { LandingContent } from "@/components/LandingContent";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mapJobRow, splitJobs } from "@/lib/jobs";
import { todayISO } from "@/lib/supabase/types";
import type { JobWithClient } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Workbrio — Work with Brio!",
  description:
    "Join Workbrio, the international freelancers network. Create your profile, browse jobs, hire talent, and grow your freelance career — free to join.",
  openGraph: {
    title: "Workbrio — Work with Brio!",
    description:
      "The international professional network built for freelancers. Profiles, jobs, feed and messaging — free to join.",
  },
};

/** Latest live jobs for the homepage, split the same way as /jobs.
 * Only real Supabase rows — never invented. Empty arrays on any error. */
async function loadLatestJobs(): Promise<JobWithClient[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*, client:client_id(full_name, avatar_url, headline, location)")
      .eq("status", "open")
      .or(`deadline.is.null,deadline.gte.${todayISO()}`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return (data as unknown as Record<string, unknown>[]).map(mapJobRow);
  } catch {
    return [];
  }
}

/** Real live counts for the hero stats — open jobs and members.
 * Zero when Supabase is unreachable, so the hero never shows a number
 * it cannot stand behind. */
async function loadHeroCounts(): Promise<{
  openJobs: number;
  members: number;
}> {
  if (!isSupabaseConfigured()) return { openJobs: 0, members: 0 };
  try {
    const supabase = await createClient();
    const [{ count: jobsCount }, { count: membersCount }] = await Promise.all([
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "open")
        .or(`deadline.is.null,deadline.gte.${todayISO()}`),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    return { openJobs: jobsCount ?? 0, members: membersCount ?? 0 };
  } catch {
    return { openJobs: 0, members: 0 };
  }
}

/** Live Supabase reads via cookies(), so this route renders dynamically
 * per request — fresh jobs and counts on every load. */
export const instant = false;

export default async function LandingPage() {
  const [jobs, counts] = await Promise.all([
    loadLatestJobs(),
    loadHeroCounts(),
  ]);
  // Full live arrays (not sliced): the homepage search and category
  // filters run client-side over all of them. LandingContent shows
  // the first 4 + 4 by default and all matches once filtering starts.
  const { pakistani, international } = splitJobs(jobs);
  return (
    <LandingContent
      allPakistani={pakistani}
      allInternational={international}
      openJobsCount={counts.openJobs}
      memberCount={counts.members}
    />
  );
}
