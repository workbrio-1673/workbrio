"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { SkillChip } from "@/components/SkillChip";
import { JobForm } from "@/components/JobForm";
import type { Job, JobStatus, Skill } from "@/lib/supabase/types";
import { budgetLabel, timeAgo } from "@/lib/supabase/types";

const STATUS_LABELS: Record<JobStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  closed: "Closed",
};

/** Client's own posted jobs: edit, close/reopen, delete. */
export function MyJobsList({
  initialJobs,
  allSkills,
  userId,
}: {
  initialJobs: Job[];
  allSkills: Skill[];
  userId: string;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setStatus = async (id: string, status: JobStatus) => {
    setError(null);
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error: upErr } = await supabase
        .from("jobs")
        .update({ status })
        .eq("id", id);
      if (upErr) throw upErr;
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the job.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this job and all its proposals? This cannot be undone.")) {
      return;
    }
    setError(null);
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error: delErr } = await supabase.from("jobs").delete().eq("id", id);
      if (delErr) throw delErr;
      setJobs((prev) => prev.filter((j) => j.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the job.");
    } finally {
      setBusyId(null);
    }
  };

  if (jobs.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-4xl">💼</p>
        <h2 className="mt-4 text-xl font-extrabold text-ink-900">
          You haven't posted any jobs yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Post your first job and freelancers from around the world will apply.
        </p>
        <p className="mt-4">
          <Button href="/jobs/new" size="sm">
            + Post a job
          </Button>
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      {jobs.map((job) =>
        editingId === job.id ? (
          <Card key={job.id}>
            <h2 className="mb-4 text-lg font-extrabold text-ink-900">
              Edit job
            </h2>
            <JobForm
              userId={userId}
              allSkills={allSkills}
              initialJob={job}
              submitLabel="Save changes"
              onSaved={() => {
                setEditingId(null);
                router.refresh();
              }}
            />
            <p className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </Button>
            </p>
          </Card>
        ) : (
          <Card key={job.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-extrabold text-ink-900">
                    {job.title}
                  </h2>
                  <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-bold capitalize text-slate-600">
                    {STATUS_LABELS[job.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {budgetLabel(job.budget_type, job.budget_amount)} · posted{" "}
                  {timeAgo(job.created_at)}
                </p>
                {job.skills_required.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.skills_required.slice(0, 5).map((s) => (
                      <SkillChip key={s} name={s} />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingId(job.id)}
                >
                  Edit
                </Button>
                {job.status === "open" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId === job.id}
                    onClick={() => setStatus(job.id, "closed")}
                  >
                    Close
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyId === job.id}
                    onClick={() => setStatus(job.id, "open")}
                  >
                    Reopen
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busyId === job.id}
                  onClick={() => remove(job.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        )
      )}
    </div>
  );
}
