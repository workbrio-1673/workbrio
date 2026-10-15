"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./Button";
import { useLanguage } from "./LanguageProvider";
import type { PostWithAuthor } from "@/lib/supabase/types";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

type PostComposerProps = {
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  userHeadline: string | null;
  /** Called with the freshly created post so the feed can prepend it instantly.
   *  Optional — the composer also dispatches a "workbrio:post-created" window
   *  event that FeedList listens for, so pages may omit this. */
  onPosted?: (post: PostWithAuthor) => void;
};

/** LinkedIn-style composer: "Start a post" pill that expands into the editor. */
export function PostComposer({
  userId,
  userName,
  userAvatar,
  userHeadline,
  onPosted,
}: PostComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError("Please choose a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("Image must be smaller than 5 MB.");
      return;
    }
    setError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setExpanded(true);
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const cancel = () => {
    setContent("");
    clearFile();
    setError(null);
    setExpanded(false);
  };

  const submit = async () => {
    const text = content.trim();
    if (!text && !file) {
      setError("Write something or add a photo first.");
      return;
    }
    setError(null);
    setPosting(true);
    try {
      const supabase = createClient();
      let imageUrl: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("post-images").getPublicUrl(path).data
          .publicUrl;
      }

      const { data, error: insertError } = await supabase
        .from("posts")
        .insert({ author_id: userId, content: text, image_url: imageUrl })
        .select("id, author_id, content, image_url, created_at, updated_at")
        .single();
      if (insertError) throw insertError;

      const freshPost: PostWithAuthor = {
        id: String(data.id),
        author_id: userId,
        content: String(data.content),
        image_url: (data.image_url as string | null) ?? null,
        created_at: String(data.created_at),
        updated_at: String(data.updated_at),
        author_name: userName,
        author_avatar: userAvatar,
        author_headline: userHeadline,
        like_count: 0,
        comment_count: 0,
        liked_by_me: false,
      };
      onPosted?.(freshPost);
      // Notify the feed list (sibling component) so it prepends instantly.
      window.dispatchEvent(
        new CustomEvent<PostWithAuthor>("workbrio:post-created", {
          detail: freshPost,
        })
      );

      setContent("");
      clearFile();
      setExpanded(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not publish your post."
      );
    } finally {
      setPosting(false);
    }
  };

  const avatarEl = userAvatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={userAvatar}
      alt={userName ?? "You"}
      className="h-12 w-12 shrink-0 rounded-full object-cover"
    />
  ) : (
    <span
      aria-hidden
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xl font-extrabold text-white"
    >
      {(userName ?? "W").charAt(0).toUpperCase()}
    </span>
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-4 pt-3">
        {avatarEl}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="h-12 flex-1 rounded-full border border-slate-300 px-4 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-100"
        >
          {t("feed.startPost")}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pt-3">
          <textarea
            rows={4}
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an update, a win, or something you learned…"
            maxLength={5000}
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-[0.95rem] text-ink-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          />
          {previewUrl && (
            <div className="relative mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Post preview"
                className="max-h-64 w-full rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={clearFile}
                aria-label="Remove photo"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/70 text-white transition hover:bg-ink-950"
              >
                ✕
              </button>
            </div>
          )}
          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={cancel}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              {t("common.cancel")}
            </button>
            <Button onClick={submit} disabled={posting} size="sm">
              {posting ? t("common.posting") : t("common.post")}
            </Button>
          </div>
        </div>
      )}

      {/* Action row — LinkedIn style */}
      <div className="flex items-center justify-around px-4 py-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          <span aria-hidden className="text-lg">🖼️</span> {t("feed.photo")}
        </button>
        <Link
          href="/jobs/new"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          <span aria-hidden className="text-lg">💼</span> {t("feed.postAJob")}
        </Link>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
