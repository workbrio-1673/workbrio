"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LikeButtonProps = {
  postId: string;
  userId: string;
  initialLiked: boolean;
  initialCount: number;
  /** Keeps the parent card's count in sync (for instant UI updates). */
  onToggle?: (liked: boolean, count: number) => void;
};

/** Heart-style like toggle with optimistic count. */
export function LikeButton({
  postId,
  userId,
  initialLiked,
  initialCount,
  onToggle,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    // Optimistic update
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      const supabase = createClient();
      if (next) {
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      }
      onToggle?.(next, count + (next ? 1 : -1));
    } catch {
      // Roll back on failure
      setLiked(!next);
      setCount((c) => c + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this post" : "Like this post"}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
        liked
          ? "bg-flare-500/10 text-flare-600 hover:bg-flare-500/15"
          : "text-slate-500 hover:bg-slate-100 hover:text-ink-900"
      }`}
    >
      <span aria-hidden className={liked ? "scale-110" : ""}>
        {liked ? "❤️" : "🤍"}
      </span>
      {count > 0 && <span>{count}</span>}
      <span className="hidden sm:inline">{liked ? "Liked" : "Like"}</span>
    </button>
  );
}
