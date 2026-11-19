"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "./Card";
import { salaryLabel, todayISO } from "@/lib/supabase/types";

type RelatedJob = {
  id: string;
  title: string;
  budget_type: "fixed" | "hourly";
  budget_amount: number | null;
  salary_text: string | null;
  skills_required: string[];
};

/** "Related jobs" — other open jobs sharing skills with this one. */
export function RelatedJobs({
  jobId,
  skills,
}: {
  jobId: string;
  skills: string[];
}) {
  const [jobs, setJobs] = useState<RelatedJob[]>([]);

  useEffect(() => {
    if (skills.length === 0) return;
    const supabase = createClient();
    supabase
      .from("jobs")
      .select("id, title, budget_type, budget_amount, salary_text, skills_required")
      .eq("status", "open")
      .neq("id", jobId)
      // Auto-expiry: never suggest a job whose deadline has passed.
      .or(`deadline.is.null,deadline.gte.${todayISO()}`)
      .overlaps("skills_required", skills)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) setJobs(data as unknown as RelatedJob[]);
      });
  }, [jobId, skills]);

  if (jobs.length === 0) return null;

  return (
    <Card>
      <h3 className="text-lg font-extrabold text-ink-900">💼 Related jobs</h3>
      <div className="mt-4 space-y-3">
        {jobs.map((j) => (
          <Link
            key={j.id}
            href={`/jobs/${j.id}`}
            className="block rounded-xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/50"
          >
            <p className="font-bold text-ink-900 line-clamp-1">{j.title}</p>
            <p className="mt-1 text-xs font-bold text-emerald-600">
              {salaryLabel(j)}
            </p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
