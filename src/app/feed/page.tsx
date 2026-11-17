import type { Metadata } from "next";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { PostComposer } from "@/components/PostComposer";
import { FeedList } from "@/components/FeedList";
import { FeedProfileCard } from "@/components/FeedProfileCard";
import { FeedRightRail } from "@/components/FeedRightRail";
import type { PostWithAuthor } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Community Feed",
  description:
    "The Workbrio community feed — freelancers and clients sharing wins, insights and work in progress.",
};

/** Feed home: /feed — LinkedIn-style 3-column layout.
 *  Session is read via cookies(), so this renders dynamically. */
export const instant = false;

const PAGE_SIZE = 10;

type AuthorRow = {
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
};

async function loadInitialPosts(userId: string): Promise<PostWithAuthor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, author_id, content, image_url, created_at, updated_at, author:author_id(full_name, avatar_url, headline)"
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error || !data) {
    // Tables not created yet (migration not run) → show empty state, not a crash.
    return [];
  }

  const rows = data as unknown as {
    id: string;
    author_id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    updated_at: string;
    author: AuthorRow | null;
  }[];
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

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

  return rows.map((r) => ({
    id: r.id,
    author_id: r.author_id,
    content: r.content,
    image_url: r.image_url,
    created_at: r.created_at,
    updated_at: r.updated_at,
    author_name: r.author?.full_name ?? null,
    author_avatar: r.author?.avatar_url ?? null,
    author_headline: r.author?.headline ?? null,
    like_count: likeCounts.get(r.id) ?? 0,
    comment_count: commentCounts.get(r.id) ?? 0,
    liked_by_me: likedIds.has(r.id),
  }));
}

/** Protected feed page: /feed */
export default async function FeedPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <AppNavbar />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-slate-600">
            Supabase is not connected yet. See README.md for setup.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <AppNavbar />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-slate-600">Please sign in to view the feed.</p>
        </main>
        <Footer />
      </>
    );
  }

  const [
    { data: profile },
    initialPosts,
    { count: postCount },
    { count: memberCount },
    { data: suggestions },
    { data: trendingJobs },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, headline, location")
      .eq("id", user.id)
      .single(),
    loadInitialPosts(user.id),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id, full_name, headline, avatar_url")
      .neq("id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("jobs")
      .select("id, title, budget_type, budget_amount")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  return (
    <div className="min-h-screen bg-slate-100">
      <AppNavbar />
      <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
          {/* Left rail — profile card (stacked on top for mobile) */}
          <aside className="order-1">
            <div className="lg:sticky lg:top-20">
              <FeedProfileCard
                userId={user.id}
                fullName={(profile?.full_name as string | null) ?? null}
                headline={(profile?.headline as string | null) ?? null}
                location={(profile?.location as string | null) ?? null}
                avatarUrl={(profile?.avatar_url as string | null) ?? null}
                postCount={postCount ?? 0}
                memberCount={memberCount ?? 0}
              />
            </div>
          </aside>

          {/* Center — composer + posts */}
          <div className="order-2 min-w-0">
            <PostComposer
              userId={user.id}
              userName={(profile?.full_name as string | null) ?? null}
              userAvatar={(profile?.avatar_url as string | null) ?? null}
              userHeadline={(profile?.headline as string | null) ?? null}
            />
            <div className="mt-2">
              <FeedList
                initialPosts={initialPosts}
                userId={user.id}
                totalLoaded={initialPosts.length}
              />
            </div>
          </div>

          {/* Right rail — suggestions + trending jobs (below posts on mobile) */}
          <aside className="order-3">
            <div className="lg:sticky lg:top-20">
              <FeedRightRail
                suggestions={(suggestions ?? []).map((s) => ({
                  id: String(s.id),
                  full_name: (s.full_name as string | null) ?? null,
                  headline: (s.headline as string | null) ?? null,
                  avatar_url: (s.avatar_url as string | null) ?? null,
                }))}
                trendingJobs={(trendingJobs ?? []).map((j) => ({
                  id: String(j.id),
                  title: String(j.title),
                  budget_type: j.budget_type as "fixed" | "hourly",
                  budget_amount:
                    j.budget_amount != null ? Number(j.budget_amount) : null,
                }))}
              />
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
