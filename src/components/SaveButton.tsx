"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "./LanguageProvider";

/** Bookmark toggle for a post — LinkedIn-style "Save". */
export function SaveButton({ postId, userId }: { postId: string; userId: string }) {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [postId, userId]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    try {
      if (saved) {
        const { error } = await supabase
          .from("saved_posts")
          .delete()
          .eq("user_id", userId)
          .eq("post_id", postId);
        if (error) throw error;
        setSaved(false);
      } else {
        const { error } = await supabase
          .from("saved_posts")
          .insert({ user_id: userId, post_id: postId });
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
      title={t("post.save")}
      aria-pressed={saved}
      className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition ${
        saved
          ? "text-brand-600 hover:bg-brand-50"
          : "text-slate-500 hover:bg-slate-100 hover:text-ink-900"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className="h-5 w-5"
      >
        <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" />
      </svg>
      <span className="hidden sm:inline">
        {saved ? t("post.saved") : t("post.save")}
      </span>
    </button>
  );
}
