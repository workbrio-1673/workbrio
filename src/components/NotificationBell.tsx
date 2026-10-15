"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UnreadBadge } from "./UnreadBadge";

/**
 * Bell icon with a live unread-count badge. Self-contained: renders
 * nothing when signed out, so it can live in the public Navbar.
 * Count refreshes on mount, on window focus, and live via realtime.
 */
export function NotificationBell() {
  const [userId, setUserId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const load = async (uid: string) => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid)
        .is("read_at", null);
      if (!cancelled) setUnread(count ?? 0);
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return;
      setUserId(user.id);
      load(user.id);

      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => setUnread((n) => n + 1)
        )
        .subscribe();

      const onFocus = () => load(user.id);
      window.addEventListener("focus", onFocus);

      // Not a full cleanup of auth listeners (page-lifetime component);
      // channel removal on unmount is the important part.
      return () => {
        window.removeEventListener("focus", onFocus);
        supabase.removeChannel(channel);
      };
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!userId) return null;

  return (
    <Link
      href="/notifications"
      aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-slate-100"
      onClick={() => setUnread(0)}
    >
      <span className="text-xl">🔔</span>
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5">
          <UnreadBadge count={unread} />
        </span>
      )}
    </Link>
  );
}
