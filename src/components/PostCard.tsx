"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "./Card";
import { LikeButton } from "./LikeButton";
import { CommentList } from "./CommentList";
import { SaveButton } from "./SaveButton";
import { ReportButton } from "./ReportButton";
import { timeAgo, type PostWithAuthor } from "@/lib/supabase/types";

type PostCardProps = {
  post: PostWithAuthor;
  userId: string;
  onDeleted: (postId: string) => void;
};

/** One feed post: author header, content, image, like + comments, delete-own. */
export function PostCard({ post, userId, onDeleted }: PostCardProps) {
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMine = post.author_id === userId;

  const remove = async () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    setError(null);
    try {
      const supabase = createClient();
      // Best-effort: remove the uploaded image too (ignore storage errors).
      if (post.image_url) {
        try {
          const marker = "/post-images/";
          const idx = post.image_url.indexOf(marker);
          if (idx !== -1) {
            const path = decodeURIComponent(
              post.image_url.slice(idx + marker.length).split("?")[0]
            );
            await supabase.storage.from("post-images").remove([path]);
          }
        } catch {
          /* image cleanup is optional */
        }
      }
      const { error: delErr } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id)
        .eq("author_id", userId);
      if (delErr) throw delErr;
      onDeleted(post.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the post."
      );
      setDeleting(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/profile/${post.author_id}`}
          className="flex min-w-0 items-center gap-3"
        >
          {post.author_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.author_avatar}
              alt={post.author_name ?? "Author"}
              className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-brand-500/20"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-lg font-extrabold text-white"
            >
              {(post.author_name ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-[0.95rem] font-bold text-ink-900 hover:text-brand-600">
              {post.author_name ?? "Workbrio member"}
            </span>
            {post.author_headline && (
              <span className="block truncate text-xs text-slate-500">
                {post.author_headline}
              </span>
            )}
            <span className="block text-xs text-slate-400">
              {timeAgo(post.created_at)}
            </span>
          </span>
        </Link>
        {isMine ? (
          <button
            type="button"
            onClick={() => void remove()}
            disabled={deleting}
            aria-label="Delete your post"
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        ) : (
          <ReportButton targetType="post" targetId={post.id} userId={userId} />
        )}
      </div>

      <p className="mt-3 whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-ink-900">
        {post.content}
      </p>

      {post.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image_url}
          alt="Post attachment"
          className="mt-3 max-h-96 w-full rounded-xl object-cover"
          loading="lazy"
        />
      )}

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2">
        <LikeButton
          postId={post.id}
          userId={userId}
          initialLiked={post.liked_by_me}
          initialCount={post.like_count}
        />
        <CommentList
          postId={post.id}
          userId={userId}
          initialCount={commentCount}
          onCountChange={setCommentCount}
        />
        <SaveButton postId={post.id} userId={userId} />
      </div>
    </Card>
  );
}
