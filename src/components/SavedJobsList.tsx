"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "./Card";
import { budgetLabel } from "@/lib/supabase/types";

type SavedJobRow = {
  job_id: string;
  job: {
    id: string;
    title: string;
    budget_type: "fixed" | "hourly";
    budget_amount: number;
  } | null;
};

/** Lists the user's bookmarked jobs. */
export function SavedJobsList({ userId }: { userId: string }) {
  const [jobs, setJobs] = useState<SavedJobRow["job"][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("saved_jobs")
      .select("job_id, job:job_id(id, title, budget_type, budget_amount)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as SavedJobRow[];
        setJobs(rows.map((r) => r.job).filter(Boolean) as SavedJobRow["job"][]);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <Card className="text-center">
        <p className="text-sm text-slate-500">Loading saved jobs…</p>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-4xl">💼</p>
        <p className="mt-4 font-bold text-ink-900">No saved jobs yet</p>
        <p className="mt-2 text-sm text-slate-600">
          Tap “Save” on any job to keep it here for later.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map(
        (j) =>
          j && (
            <Link key={j.id} href={`/jobs/${j.id}`}>
              <Card hover className="p-4">
                <p className="font-bold text-ink-900">{j.title}</p>
                <p className="mt-1 text-sm font-bold text-emerald-600">
                  {budgetLabel(j.budget_type, j.budget_amount)}
                </p>
              </Card>
            </Link>
          )
      )}
    </div>
  );
}
