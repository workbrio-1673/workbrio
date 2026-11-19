"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./Button";
import { timeAgo, type JobCommentWithAuthor } from "@/lib/supabase/types";

type JobCommentListProps = {
  jobId: string;
  userId: string;
  initialCount: number;
  onCountChange?: (count: number) => void;
};

/** Expandable comments under a job: lazy-load, add, delete own.
 * Mirrors CommentList (feed posts) but reads/writes job_comments. */
export function JobCommentList({
  jobId,
  userId,
  initialCount,
  onCountChange,
}: JobCommentListProps) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<JobCommentWithAuthor[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const count = comments ? comments.length : initialCount;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: qErr } = await supabase
        .from("job_comments")
        .select(
          "id, job_id, author_id, content, created_at, author:author_id(full_name, avatar_url)"
        )
        .eq("job_id", jobId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (qErr) throw qErr;
      const mapped: JobCommentWithAuthor[] = (data ?? []).map(
        (row: Record<string, unknown>) => {
          const author = (row.author as Record<string, unknown> | null) ?? null;
          return {
            id: String(row.id),
            job_id: String(row.job_id),
            author_id: String(row.author_id),
            content: String(row.content),
            created_at: String(row.created_at),
            author_name: (author?.full_name as string | null) ?? null,
            author_avatar: (author?.avatar_url as string | null) ?? null,
          };
        }
      );
      setComments(mapped);
      onCountChange?.(mapped.length);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load comments."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && comments === null) void load();
  };

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: inErr } = await supabase
        .from("job_comments")
        .insert({ job_id: jobId, author_id: userId, content: text })
        .select("id, job_id, author_id, content, created_at")
        .single();
      if (inErr) throw inErr;

      // Fetch my profile bits for the new row's display.
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .single();

      const fresh: JobCommentWithAuthor = {
        id: String(data.id),
        job_id: String(data.job_id),
        author_id: userId,
        content: String(data.content),
        created_at: String(data.created_at),
        author_name:
          (profile?.full_name as string | null) ?? "You",
        author_avatar: (profile?.avatar_url as string | null) ?? null,
      };
      setComments((prev) => {
        const next = [...(prev ?? []), fresh];
        onCountChange?.(next.length);
        return next;
      });
      setDraft("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not post your comment."
      );
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      const supabase = createClient();
      const { error: delErr } = await supabase
        .from("job_comments")
        .delete()
        .eq("id", id)
        .eq("author_id", userId);
      if (delErr) throw delErr;
      setComments((prev) => {
        const next = (prev ?? []).filter((c) => c.id !== id);
        onCountChange?.(next.length);
        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the comment."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-ink-900"
      >
        <span aria-hidden>💬</span>
        {count > 0 ? `${count} comment${count === 1 ? "" : "s"}` : "Comment"}
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
          {loading && (
            <p className="text-sm text-slate-500">Loading comments…</p>
          )}
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          {comments?.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              {c.author_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.author_avatar}
                  alt={c.author_name ?? "Commenter"}
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs font-extrabold text-white"
                >
                  {(c.author_name ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1 rounded-2xl bg-slate-100 px-3.5 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-bold text-ink-900">
                    {c.author_name ?? "Workbrio member"}
                  </p>
                  <span className="shrink-0 text-xs text-slate-400">
                    {timeAgo(c.created_at)}
                  </span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink-800">
                  {c.content}
                </p>
              </div>
              {c.author_id === userId && (
                <button
                  type="button"
                  onClick={() => void remove(c.id)}
                  disabled={deletingId === c.id}
                  aria-label="Delete your comment"
                  className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  {deletingId === c.id ? "…" : "Delete"}
                </button>
              )}
            </div>
          ))}
          {comments !== null && comments.length === 0 && !loading && (
            <p className="text-sm text-slate-500">
              No comments yet — ask a question about this job.
            </p>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              placeholder="Ask a question about this job…"
              maxLength={2000}
              className="h-10 w-full rounded-full border border-slate-300 bg-white px-4 text-sm text-ink-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            />
            <Button onClick={send} disabled={sending || !draft.trim()} size="sm">
              {sending ? "…" : "Send"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
