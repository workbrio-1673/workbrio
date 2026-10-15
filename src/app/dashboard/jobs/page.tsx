import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { MyJobsList } from "./MyJobsList";
import type { Job, Skill } from "@/lib/supabase/types";

/** My posted jobs: /dashboard/jobs (clients). Session via cookies(), dynamic. */
export const instant = false;

export default async function MyJobsPage() {
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

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const { data: allSkills } = await supabase
    .from("skills")
    .select("id, name")
    .order("name");

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
              My jobs
            </h1>
            <p className="mt-1 text-slate-600">
              Jobs you've posted as a client.
            </p>
          </div>
          <Button href="/jobs/new" size="sm">
            + Post a job
          </Button>
        </div>

        <div className="mt-8">
          <MyJobsList
            initialJobs={(jobs ?? []) as Job[]}
            allSkills={(allSkills ?? []) as Skill[]}
            userId={user.id}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
