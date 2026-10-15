"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import type { ProposalStatus, ProposalWithJob } from "@/lib/supabase/types";
import { budgetLabel } from "@/lib/supabase/types";

const STATUS_STYLES: Record<ProposalStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  accepted: "bg-emerald-500/10 text-emerald-600",
  declined: "bg-slate-500/10 text-slate-500",
};

/** Freelancer's sent proposals, with withdraw for pending ones. */
export function ApplicationsList({
  initial,
}: {
  initial: ProposalWithJob[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  const withdraw = async (id: string) => {
    if (!window.confirm("Withdraw this proposal?")) return;
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("proposals").delete().eq("id", id);
      if (error) throw error;
      setItems((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-4xl">📨</p>
        <h2 className="mt-4 text-xl font-extrabold text-ink-900">
          You haven't applied to any jobs yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Browse open jobs and send your first proposal.
        </p>
        <p className="mt-4">
          <Button href="/jobs" size="sm">
            Browse jobs
          </Button>
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((p) => (
        <Card key={p.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/jobs/${p.job_id_ref}`}
                  className="text-lg font-extrabold text-ink-900 hover:text-brand-600"
                >
                  {p.job_title ?? "Job"}
                </Link>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${STATUS_STYLES[p.status]}`}
                >
                  {p.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {p.job_budget_type && p.job_budget_amount != null
                  ? budgetLabel(p.job_budget_type, p.job_budget_amount)
                  : "Budget not shown"}{" "}
                · {p.client_name ?? "Client"} · applied{" "}
                {new Date(p.created_at).toLocaleDateString("en-US")}
                {p.bid_amount != null && (
                  <>
                    {" "}· your bid:{" "}
                    <span className="font-bold text-ink-900">
                      ${Number(p.bid_amount).toLocaleString("en-US")}
                    </span>
                  </>
                )}
              </p>
              {p.cover_note && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                  {p.cover_note}
                </p>
              )}
              {p.status === "accepted" && (
                <p className="mt-2 text-sm font-semibold text-emerald-600">
                  🎉 Accepted! The client will be in touch soon.
                </p>
              )}
            </div>
            {p.status === "pending" && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busyId === p.id}
                onClick={() => withdraw(p.id)}
              >
                Withdraw
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
