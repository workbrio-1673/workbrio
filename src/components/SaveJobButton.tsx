"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Bookmark toggle for a job — save jobs for later. */
export function SaveJobButton({ jobId, userId }: { jobId: string; userId: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("saved_jobs")
      .select("job_id")
      .eq("user_id", userId)
      .eq("job_id", jobId)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [jobId, userId]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    try {
      if (saved) {
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("user_id", userId)
          .eq("job_id", jobId);
        if (error) throw error;
        setSaved(false);
      } else {
        const { error } = await supabase
          .from("saved_jobs")
          .insert({ user_id: userId, job_id: jobId });
        if (error) throw error;
        setSaved(true);
      }
    } catch {
      /* table may not exist yet — fail silently */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      title={saved ? "Unsave job" : "Save job"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition ${
        saved
          ? "border-brand-500 bg-brand-50 text-brand-600"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink-900"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className="h-4 w-4"
      >
        <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" />
      </svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
