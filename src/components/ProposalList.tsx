"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateConversation } from "@/lib/supabase/messaging";
import { Card } from "./Card";
import { Button } from "./Button";
import type { ProposalWithFreelancer } from "@/lib/supabase/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  accepted: "bg-emerald-500/10 text-emerald-600",
  declined: "bg-slate-500/10 text-slate-500",
};

/** Storage path of a CV inside the private `cvs` bucket. */
const BUCKET = "cvs";

/**
 * The `cv_url` column historically held a (broken) public URL; new rows hold
 * the plain storage path. Normalize both to a path for signed-URL viewing.
 */
function cvPathFromStored(value: string): string {
  const marker = `/${BUCKET}/`;
  const idx = value.indexOf(marker);
  if (idx >= 0) return value.slice(idx + marker.length);
  return value;
}

/**
 * "View CV (PDF)" button. Generates a short-lived signed URL on click so the
 * PDF opens from the private bucket for the signed-in viewer.
 */
function CvLink({ stored }: { stored: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(cvPathFromStored(stored), 3600);
      if (signErr || !data?.signedUrl)
        throw signErr ?? new Error("Could not open CV.");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open CV.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="mt-2 inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-slate-200 disabled:opacity-60"
      >
        📄 {busy ? "Opening…" : "View CV (PDF)"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}

type ProposalListProps = {
  jobId: string;
  jobTitle: string;
  proposals: ProposalWithFreelancer[];
};

/**
 * Client's applicant inbox for one job.
 * Accepting sets the job to in_progress and declines the other proposals.
 */
export function ProposalList({ jobId, jobTitle, proposals }: ProposalListProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Open (or start) a chat with the freelancer about this job. */
  const messageFreelancer = async (freelancerId: string) => {
    setError(null);
    setBusyId(`msg-${freelancerId}`);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(`/jobs/${jobId}`)}`);
        return;
      }
      const conversationId = await getOrCreateConversation(
        supabase,
        user.id,
        freelancerId,
        jobId
      );
      router.push(`/messages?conversation=${conversationId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not open the conversation."
      );
    } finally {
      setBusyId(null);
    }
  };

  const decline = async (proposalId: string) => {
    setError(null);
    setBusyId(proposalId);
    try {
      const supabase = createClient();
      const { error: upErr } = await supabase
        .from("proposals")
        .update({ status: "declined" })
        .eq("id", proposalId);
      if (upErr) throw upErr;
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not decline the proposal.");
    } finally {
      setBusyId(null);
    }
  };

  const accept = async (proposalId: string) => {
    setError(null);
    setBusyId(proposalId);
    try {
      const supabase = createClient();
      // 1. Accept this proposal.
      const { error: accErr } = await supabase
        .from("proposals")
        .update({ status: "accepted" })
        .eq("id", proposalId);
      if (accErr) throw accErr;
      // 2. Decline all other pending proposals on this job.
      const { error: decErr } = await supabase
        .from("proposals")
        .update({ status: "declined" })
        .eq("job_id", jobId)
        .neq("id", proposalId)
        .eq("status", "pending");
      if (decErr) throw decErr;
      // 3. Mark the job as in progress.
      const { error: jobErr } = await supabase
        .from("jobs")
        .update({ status: "in_progress" })
        .eq("id", jobId);
      if (jobErr) throw jobErr;
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept the proposal.");
    } finally {
      setBusyId(null);
    }
  };

  if (proposals.length === 0) {
    return (
      <Card>
        <h3 className="font-extrabold text-ink-900">{jobTitle}</h3>
        <p className="mt-2 text-sm text-slate-500">
          No proposals yet. Freelancers will appear here when they apply.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-ink-900">{jobTitle}</h3>
        <span className="text-sm text-slate-500">
          {proposals.length} proposal{proposals.length === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <ul className="mt-4 divide-y divide-slate-100">
        {proposals.map((p) => (
          <li key={p.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                {p.freelancer_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.freelancer_avatar}
                    alt={p.freelancer_name ?? "Freelancer"}
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-sm font-extrabold text-white">
                    {(p.freelancer_name ?? "W")[0]?.toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/profile/${p.freelancer_id}`}
                      className="font-bold text-ink-900 hover:text-brand-600"
                    >
                      {p.freelancer_name ?? "Freelancer"}
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${STATUS_STYLES[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  {p.freelancer_headline && (
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {p.freelancer_headline}
                    </p>
                  )}
                  {p.cover_note && (
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                      {p.cover_note}
                    </p>
                  )}
                  {p.cv_url && <CvLink stored={p.cv_url} />}
                  <p className="mt-1.5 text-sm text-slate-500">
                    {p.bid_amount != null && (
                      <span className="font-bold text-ink-900">
                        ${Number(p.bid_amount).toLocaleString("en-US")}
                      </span>
                    )}{" "}
                    · applied {new Date(p.created_at).toLocaleDateString("en-US")}
                  </p>
                </div>
              </div>

              {p.status === "pending" ? (
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    onClick={() => accept(p.id)}
                    disabled={busyId !== null}
                  >
                    {busyId === p.id ? "Working…" : "Accept"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => decline(p.id)}
                    disabled={busyId !== null}
                  >
                    Decline
                  </Button>
                </div>
              ) : (
                p.status === "accepted" && (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => messageFreelancer(p.freelancer_id)}
                      disabled={busyId !== null}
                    >
                      {busyId === `msg-${p.freelancer_id}`
                        ? "Opening…"
                        : "💬 Message"}
                    </Button>
                  </div>
                )
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
