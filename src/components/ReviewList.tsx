import { Card } from "@/components/Card";
import type { ReviewWithReviewer } from "@/lib/supabase/types";

type ReviewListProps = {
  reviews: ReviewWithReviewer[];
  avgRating: number | null;
  reviewCount: number;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-slate-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

/** Average-rating summary plus the list of written reviews. */
export function ReviewList({ reviews, avgRating, reviewCount }: ReviewListProps) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <p className="text-5xl font-extrabold text-ink-900">
          {avgRating != null ? avgRating.toFixed(1) : "—"}
        </p>
        <div>
          {avgRating != null ? (
            <Stars rating={Math.round(avgRating)} />
          ) : (
            <p className="text-sm text-slate-400">No ratings yet</p>
          )}
          <p className="mt-1 text-sm text-slate-500">
            {reviewCount} review{reviewCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
          No written reviews yet. Work with this member and be the first to
          leave one.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center gap-3">
                {r.reviewer_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.reviewer_avatar}
                    alt={r.reviewer_name ?? "Reviewer"}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                    {(r.reviewer_name ?? "?")[0]?.toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="text-sm font-bold text-ink-900">
                    {r.reviewer_name ?? "A Workbrio member"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className="ml-auto">
                  <Stars rating={r.rating} />
                </span>
              </div>
              {r.comment && (
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {r.comment}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
