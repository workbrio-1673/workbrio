import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { Card } from "@/components/Card";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { SkillChip } from "@/components/SkillChip";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { ReviewList } from "@/components/ReviewList";
import { ReportButton } from "@/components/ReportButton";
import { Button } from "@/components/Button";
import type { ProfileFull } from "@/lib/supabase/types";
import { toSkillList } from "@/lib/supabase/types";

/** Public profile page. Reads the session via cookies(), so it renders
 * dynamically per request. */
export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

async function loadProfile(id: string): Promise<ProfileFull | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (!profile) return null;

  const [{ data: skillRows }, { data: portfolio }, { data: reviews }] =
    await Promise.all([
      supabase
        .from("profile_skills")
        .select("skills(id, name)")
        .eq("profile_id", id),
      supabase
        .from("portfolio_items")
        .select("*")
        .eq("profile_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("reviews")
        .select("*, reviewer:reviewer_id(full_name, avatar_url)")
        .eq("profile_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const skills = toSkillList(skillRows);

  const mappedReviews = (reviews ?? []).map((r) => {
    const reviewer = (r as { reviewer?: { full_name: string | null; avatar_url: string | null } | null }).reviewer;
    return {
      id: r.id,
      profile_id: r.profile_id,
      reviewer_id: r.reviewer_id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      reviewer_name: reviewer?.full_name ?? null,
      reviewer_avatar: reviewer?.avatar_url ?? null,
    };
  });

  const reviewCount = mappedReviews.length;
  const avgRating =
    reviewCount > 0
      ? mappedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

  return {
    ...profile,
    skills,
    portfolio: portfolio ?? [],
    reviews: mappedReviews,
    avg_rating: avgRating,
    review_count: reviewCount,
  };
}

/** Public profile page: /profile/[id] */
export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;

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

  const profile = await loadProfile(id);
  if (!profile) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwn = user?.id === profile.id;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Header card */}
        <Card>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? "Profile photo"}
                className="h-28 w-28 shrink-0 rounded-3xl object-cover ring-4 ring-brand-500/20"
              />
            ) : (
              <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-gradient-brand text-4xl font-extrabold text-white">
                {(profile.full_name ?? "W")[0]?.toUpperCase()}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
                  {profile.full_name ?? "Workbrio member"}
                </h1>
                <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold capitalize text-brand-600">
                  {profile.role}
                </span>
              </div>
              {profile.headline && (
                <p className="mt-2 text-lg text-slate-600">{profile.headline}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                {profile.location && <span>📍 {profile.location}</span>}
                {profile.role === "freelancer" && profile.hourly_rate != null && (
                  <span className="font-bold text-ink-900">
                    ${Number(profile.hourly_rate).toFixed(0)}/hour
                  </span>
                )}
                {profile.avg_rating != null && (
                  <span className="font-semibold text-amber-500">
                    ★ {profile.avg_rating.toFixed(1)}
                    <span className="font-normal text-slate-400">
                      {" "}
                      ({profile.review_count} review
                      {profile.review_count === 1 ? "" : "s"})
                    </span>
                  </span>
                )}
                {profile.website && (
                  <a
                    href={
                      profile.website.startsWith("http")
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-brand-600 hover:text-brand-500"
                  >
                    🌐 Website ↗
                  </a>
                )}
              </div>
            </div>

            {isOwn ? (
              <Button href="/settings/profile" variant="secondary" size="sm" className="shrink-0">
                Edit profile
              </Button>
            ) : (
              user && (
                <span className="flex shrink-0 items-center gap-1">
                  <Button
                    href={`/messages?peer=${profile.id}`}
                    size="sm"
                  >
                    💬 Message
                  </Button>
                  <ReportButton
                    targetType="profile"
                    targetId={profile.id}
                    userId={user.id}
                  />
                </span>
              )
            )}
          </div>
        </Card>

        {/* About */}
        {profile.bio && (
          <Card className="mt-6">
            <h2 className="text-lg font-extrabold text-ink-900">About</h2>
            <p className="mt-3 whitespace-pre-line text-slate-600">{profile.bio}</p>
          </Card>
        )}

        {/* Skills */}
        <Card className="mt-6">
          <h2 className="text-lg font-extrabold text-ink-900">Skills</h2>
          {profile.skills.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <SkillChip key={s.id} name={s.name} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No skills listed yet.</p>
          )}
        </Card>

        {/* Portfolio */}
        <div className="mt-6">
          <h2 className="mb-4 text-lg font-extrabold text-ink-900">Portfolio</h2>
          <PortfolioGrid items={profile.portfolio} />
        </div>

        {/* Reviews */}
        <Card className="mt-6">
          <h2 className="text-lg font-extrabold text-ink-900">Reviews</h2>
          <div className="mt-4">
            <ReviewList
              reviews={profile.reviews}
              avgRating={profile.avg_rating}
              reviewCount={profile.review_count}
            />
          </div>
        </Card>

        <p className="mt-8 text-center">
          <Link href="/" className="text-sm font-semibold text-brand-600 hover:text-brand-500">
            ← Back to Workbrio home
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
