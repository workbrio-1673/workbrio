"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./Button";
import { Card } from "./Card";
import { PostCard } from "./PostCard";
import type { PostWithAuthor } from "@/lib/supabase/types";

const PAGE_SIZE = 10;

type RawPostRow = {
  id: unknown;
  author_id: unknown;
  content: unknown;
  image_url: unknown;
  created_at: unknown;
  updated_at: unknown;
  author: unknown;
};

function mapPost(
  row: RawPostRow,
  likeCounts: Map<string, number>,
  commentCounts: Map<string, number>,
  likedIds: Set<string>
): PostWithAuthor {
  const author = (row.author as Record<string, unknown> | null) ?? null;
  const id = String(row.id);
  return {
    id,
    author_id: String(row.author_id),
    content: String(row.content),
    image_url: (row.image_url as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    author_name: (author?.full_name as string | null) ?? null,
    author_avatar: (author?.avatar_url as string | null) ?? null,
    author_headline: (author?.headline as string | null) ?? null,
    like_count: likeCounts.get(id) ?? 0,
    comment_count: commentCounts.get(id) ?? 0,
    liked_by_me: likedIds.has(id),
  };
}

async function fetchBatch(
  userId: string,
  offset: number
): Promise<PostWithAuthor[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, author_id, content, image_url, created_at, updated_at, author:author_id(full_name, avatar_url, headline)")
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (error) throw error;
  const rows = (data ?? []) as unknown as RawPostRow[];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => String(r.id));

  const [likesRes, myLikesRes, commentsRes] = await Promise.all([
    supabase.from("post_likes").select("post_id").in("post_id", ids),
    supabase
      .from("post_likes")
      .select("post_id")
      .in("post_id", ids)
      .eq("user_id", userId),
    supabase.from("comments").select("post_id").in("post_id", ids),
  ]);

  const likeCounts = new Map<string, number>();
  for (const r of (likesRes.data ?? []) as { post_id: string }[]) {
    likeCounts.set(r.post_id, (likeCounts.get(r.post_id) ?? 0) + 1);
  }
  const likedIds = new Set(
    ((myLikesRes.data ?? []) as { post_id: string }[]).map((r) => r.post_id)
  );
  const commentCounts = new Map<string, number>();
  for (const r of (commentsRes.data ?? []) as { post_id: string }[]) {
    commentCounts.set(r.post_id, (commentCounts.get(r.post_id) ?? 0) + 1);
  }

  return rows.map((r) => mapPost(r, likeCounts, commentCounts, likedIds));
}

type FeedListProps = {
  initialPosts: PostWithAuthor[];
  userId: string;
  totalLoaded: number;
};

/** Feed post list with "Load more" pagination, live prepend/delete, and Top/Latest sorting. */
export function FeedList({ initialPosts, userId, totalLoaded }: FeedListProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(totalLoaded >= PAGE_SIZE);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"latest" | "top">("latest");

  const visiblePosts =
    sortBy === "top"
      ? [...posts].sort(
          (a, b) =>
            b.like_count + b.comment_count - (a.like_count + a.comment_count) ||
            +new Date(b.created_at) - +new Date(a.created_at)
        )
      : posts;

  // Prepend freshly composed posts (dispatched by PostComposer).
  useEffect(() => {
    const handler = (e: Event) => {
      const post = (e as CustomEvent<PostWithAuthor>).detail;
      if (!post?.id) return;
      setPosts((prev) =>
        prev.some((p) => p.id === post.id) ? prev : [post, ...prev]
      );
    };
    window.addEventListener("workbrio:post-created", handler);
    return () => window.removeEventListener("workbrio:post-created", handler);
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    setError(null);
    try {
      const batch = await fetchBatch(userId, posts.length);
      if (batch.length < PAGE_SIZE) setHasMore(false);
      const seen = new Set(posts.map((p) => p.id));
      setPosts((prev) => [
        ...prev,
        ...batch.filter((p) => !seen.has(p.id)),
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load more posts."
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (posts.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-4xl">📰</p>
        <h2 className="mt-4 text-xl font-extrabold text-ink-900">
          The feed is quiet… for now
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Be the first to post! Share a win, ask a question, or show off your
          latest work.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Sort toggle — LinkedIn style */}
      <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
        <span>Sort by:</span>
        <div className="flex rounded-full border border-slate-200 bg-white p-0.5">
          {(["latest", "top"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSortBy(opt)}
              className={`rounded-full px-3 py-1 font-semibold capitalize transition ${
                sortBy === opt
                  ? "bg-ink-900 text-white"
                  : "text-slate-500 hover:text-ink-900"
              }`}
            >
              {opt === "latest" ? "Latest" : "Top"}
            </button>
          ))}
        </div>
      </div>

      {visiblePosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          userId={userId}
          onDeleted={handleDeleted}
        />
      ))}

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {hasMore && (
        <div className="pt-2 text-center">
          <Button
            variant="secondary"
            onClick={() => void loadMore()}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : "Load more posts"}
          </Button>
        </div>
      )}
    </div>
  );
}
