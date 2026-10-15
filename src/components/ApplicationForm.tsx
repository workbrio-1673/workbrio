"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "./Input";
import { Button } from "./Button";
import { Card } from "./Card";
import type { BudgetType, ProposalStatus } from "@/lib/supabase/types";

/** Freelancer applies to a job: cover note + bid. */
export function ApplicationForm({
  jobId,
  userId,
  jobBudgetType,
  existingStatus,
}: {
  jobId: string;
  userId: string;
  jobBudgetType: BudgetType;
  existingStatus: ProposalStatus | null;
}) {
  const router = useRouter();
  const [coverNote, setCoverNote] = useState("");
  const [bid, setBid] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (existingStatus) {
    const messages: Record<ProposalStatus, string> = {
      pending: "You already applied to this job. The client hasn't responded yet.",
      accepted: "Congratulations! The client accepted your proposal for this job.",
      declined: "The client declined your proposal for this job.",
    };
    return (
      <Card className="border-brand-500/30 bg-gradient-to-r from-brand-500/5 via-grape-500/5 to-flare-500/5">
        <p className="text-sm font-semibold text-ink-900">
          {messages[existingStatus]}
        </p>
      </Card>
    );
  }

  const submit = async () => {
    setError(null);
    const amount = bid.trim() === "" ? null : Number(bid);
    if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
      setError("Please enter a valid bid amount, or leave it empty.");
      return;
    }
    if (cvFile) {
      if (cvFile.type !== "application/pdf") {
        setError("CV must be a PDF file.");
        return;
      }
      if (cvFile.size > 5 * 1024 * 1024) {
        setError("CV must be smaller than 5 MB.");
        return;
      }
    }
    setSending(true);
    try {
      const supabase = createClient();
      let cvUrl: string | null = null;
      if (cvFile) {
        const path = `${userId}/${jobId}-${Date.now()}.pdf`;
        const { error: upErr } = await supabase.storage
          .from("cvs")
          .upload(path, cvFile, { contentType: "application/pdf", upsert: true });
        if (upErr) throw upErr;
        // NOTE: the `cvs` bucket is private, so we store the storage path
        // (not a public URL) and generate a signed URL when viewing.
        cvUrl = path;
      }
      const { error: inErr } = await supabase.from("proposals").insert({
        job_id: jobId,
        freelancer_id: userId,
        cover_note: coverNote.trim() || null,
        bid_amount: amount,
        cv_url: cvUrl,
      });
      if (inErr) throw inErr;
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not send your proposal. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-extrabold text-ink-900">Apply to this job</h2>
      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="apply-cover-note"
            className="mb-1.5 block text-sm font-semibold text-ink-900"
          >
            Cover note
          </label>
          <textarea
            id="apply-cover-note"
            rows={5}
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            placeholder="Why are you the right person for this job? Share relevant experience…"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[0.95rem] text-ink-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          />
        </div>
        <Input
          label={
            jobBudgetType === "hourly"
              ? "Your hourly rate (USD, optional)"
              : "Your bid (USD, optional)"
          }
          type="number"
          min="1"
          step="any"
          placeholder="e.g. 450"
          value={bid}
          onChange={(e) => setBid(e.target.value)}
        />
        <div>
          <label
            htmlFor="apply-cv"
            className="mb-1.5 block text-sm font-semibold text-ink-900"
          >
            Your CV (PDF, max 5 MB)
          </label>
          <input
            id="apply-cv"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[0.95rem] text-ink-900 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-brand-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          />
          {cvFile && (
            <p className="mt-1.5 text-xs text-slate-500">
              📎 {cvFile.name} ({(cvFile.size / 1024).toFixed(0)} KB)
            </p>
          )}
        </div>
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        <Button onClick={submit} disabled={sending}>
          {sending ? "Sending…" : "Send proposal"}
        </Button>
      </div>
    </Card>
  );
}
