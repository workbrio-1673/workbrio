"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "./Card";
import { Button } from "./Button";
import { timeAgo, type NotificationItem } from "@/lib/supabase/types";

const TYPE_ICON: Record<string, string> = {
  proposal_received: "📨",
  proposal_accepted: "🎉",
  proposal_declined: "📭",
  new_message: "💬",
};

/** /notifications page body: list, mark-read on open, mark-all-read. */
export function NotificationsList({
  initial,
  userId,
}: {
  initial: NotificationItem[];
  userId: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>(initial);
  const [busy, setBusy] = useState(false);

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids)
      .eq("user_id", userId);
  };

  const openOne = async (n: NotificationItem) => {
    if (!n.read_at) {
      await markRead([n.id]);
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x
        )
      );
    }
    if (n.link_url) router.push(n.link_url);
  };

  const markAllRead = async () => {
    setBusy(true);
    try {
      const unreadIds = items.filter((n) => !n.read_at).map((n) => n.id);
      await markRead(unreadIds);
      setItems((prev) =>
        prev.map((n) =>
          n.read_at ? n : { ...n, read_at: new Date().toISOString() }
        )
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <Card>
        <div className="py-10 text-center">
          <p className="text-4xl">🔔</p>
          <p className="mt-3 font-bold text-ink-900">All caught up!</p>
          <p className="mt-1 text-sm text-slate-500">
            Proposals, messages and updates will appear here.
          </p>
        </div>
      </Card>
    );
  }

  const unreadCount = items.filter((n) => !n.read_at).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
            : "Everything is read."}
        </p>
        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" onClick={markAllRead} disabled={busy}>
            {busy ? "Working…" : "Mark all as read"}
          </Button>
        )}
      </div>

      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => openOne(n)}
              className={`block w-full rounded-3xl border p-4 text-left transition-shadow hover:shadow-md ${
                n.read_at
                  ? "border-slate-200/70 bg-white"
                  : "border-brand-500/30 bg-brand-500/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{TYPE_ICON[n.type] ?? "🔔"}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-ink-900">{n.title}</p>
                    <span className="shrink-0 text-xs text-slate-400">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {n.body}
                    </p>
                  )}
                  {!n.read_at && (
                    <span className="mt-2 inline-block h-2 w-2 rounded-full bg-flare-500" />
                  )}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
