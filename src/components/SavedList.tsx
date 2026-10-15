"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PostCard } from "./PostCard";
import { Card } from "./Card";
import { useLanguage } from "./LanguageProvider";
import type { PostWithAuthor } from "@/lib/supabase/types";

type SavedRow = {
  post_id: string;
  created_at: string;
};

/** Lists the user's bookmarked posts, newest saved first. */
export function SavedList({ userId }: { userId: string }) {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: saved } = await supabase
        .from("saved_posts")
        .select("post_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      const rows = (saved ?? []) as SavedRow[];
      if (rows.length === 0) {
        setLoading(false);
        return;
      }
      const ids = rows.map((r) => r.post_id);
      const { data: postRows } = await supabase
        .from("posts")
        .select(
          "id, author_id, content, image_url, created_at, updated_at, author:author_id(full_name, avatar_url, headline)"
        )
        .in("id", ids);

      const order = new Map(ids.map((id, i) => [id, i]));
      const mapped: PostWithAuthor[] = ((postRows ?? []) as any[]).map((r) => ({
        id: String(r.id),
        author_id: String(r.author_id),
        content: String(r.content),
        image_url: (r.image_url as string | null) ?? null,
        created_at: String(r.created_at),
        updated_at: String(r.updated_at),
        author_name: (r.author?.full_name as string | null) ?? null,
        author_avatar: (r.author?.avatar_url as string | null) ?? null,
        author_headline: (r.author?.headline as string | null) ?? null,
        like_count: 0,
        comment_count: 0,
        liked_by_me: false,
      }));
      mapped.sort(
        (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
      );
      setPosts(mapped);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <Card className="text-center">
        <p className="text-sm text-slate-500">{t("saved.loading")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <Card className="text-center">
          <p className="text-4xl">🔖</p>
          <p className="mt-4 font-bold text-ink-900">{t("saved.empty")}</p>
          <p className="mt-2 text-sm text-slate-600">{t("saved.emptyHint")}</p>
        </Card>
      ) : (
        posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            userId={userId}
            onDeleted={(id) =>
              setPosts((prev) => prev.filter((x) => x.id !== id))
            }
          />
        ))
      )}
    </div>
  );
}
