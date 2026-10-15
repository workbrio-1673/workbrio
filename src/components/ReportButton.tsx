"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./Button";
import {
  REPORT_REASONS,
  type ReportTargetType,
} from "@/lib/supabase/types";

type ReportButtonProps = {
  targetType: ReportTargetType;
  targetId: string;
  userId: string | null;
  className?: string;
};

const TARGET_LABELS: Record<ReportTargetType, string> = {
  post: "post",
  job: "job",
  profile: "profile",
  message: "message",
};

/** "Report" button + modal. Signed-in members file reports as themselves. */
export function ReportButton({
  targetType,
  targetId,
  userId,
  className = "",
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!userId) return null;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: insErr } = await supabase.from("reports").insert({
        reporter_id: userId,
        target_type: targetType,
        target_id: targetId,
        reason,
        details: details.trim() || null,
      });
      if (insErr) throw insErr;
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit the report."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setOpen(false);
    setDone(false);
    setError(null);
    setDetails("");
    setReason(REPORT_REASONS[0]);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Report this ${TARGET_LABELS[targetType]}`}
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 ${className}`}
      >
        Report
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Report this ${TARGET_LABELS[targetType]}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <>
                <h2 className="text-xl font-extrabold text-ink-900">
                  Thanks — report received
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Our team will review this {TARGET_LABELS[targetType]}. We
                  keep reports confidential.
                </p>
                <div className="mt-6 flex justify-end">
                  <Button size="sm" onClick={close}>
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-extrabold text-ink-900">
                  Report this {TARGET_LABELS[targetType]}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tell us what&apos;s wrong — we review every report.
                </p>

                <label
                  htmlFor="report-reason"
                  className="mt-5 block text-sm font-bold text-ink-900"
                >
                  Reason
                </label>
                <select
                  id="report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <label
                  htmlFor="report-details"
                  className="mt-4 block text-sm font-bold text-ink-900"
                >
                  Details <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="report-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Add any context that helps us review…"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-ink-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
                />

                {error && (
                  <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={close}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => void submit()} disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit report"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
