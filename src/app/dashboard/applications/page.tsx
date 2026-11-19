import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { ApplicationsList } from "./ApplicationsList";
import type { ProposalWithJob } from "@/lib/supabase/types";

/** My applications: /dashboard/applications (freelancers). Dynamic. */
export const instant = false;

export default async function ApplicationsPage() {
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

  const { data } = await supabase
    .from("proposals")
    .select(
      "*, job:job_id(title, status, budget_type, budget_amount, salary_text, job_type, client:client_id(full_name))"
    )
    .eq("freelancer_id", user.id)
    .order("created_at", { ascending: false });

  const items: ProposalWithJob[] = ((data ?? []) as unknown as Record<string, unknown>[]).map(
    (p) => {
      const job = (p.job as Record<string, unknown> | null) ?? null;
      const client = (job?.client as Record<string, unknown> | null) ?? null;
      return {
        id: String(p.id),
        job_id: String(p.job_id),
        freelancer_id: String(p.freelancer_id),
        cover_note: (p.cover_note as string | null) ?? null,
        bid_amount: p.bid_amount != null ? Number(p.bid_amount) : null,
        cv_url: (p.cv_url as string | null) ?? null,
        status: p.status as "pending" | "accepted" | "declined",
        created_at: String(p.created_at),
        job_title: (job?.title as string | null) ?? null,
        job_status: (job?.status as "open" | "closed" | "in_progress" | null) ?? null,
        job_budget_type: (job?.budget_type as "fixed" | "hourly" | null) ?? null,
        job_budget_amount: job?.budget_amount != null ? Number(job.budget_amount) : null,
        job_salary_text: (job?.salary_text as string | null) ?? null,
        job_type: (job?.job_type as ProposalWithJob["job_type"]) ?? null,
        job_id_ref: String(p.job_id),
        client_name: (client?.full_name as string | null) ?? null,
      };
    }
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          My applications
        </h1>
        <p className="mt-1 text-slate-600">
          Proposals you've sent to clients, with their current status.
        </p>

        <div className="mt-8">
          <ApplicationsList initial={items} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
