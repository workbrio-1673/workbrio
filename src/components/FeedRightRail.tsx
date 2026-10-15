"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

export type SuggestedProfile = {
  id: string;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
};

export type TrendingJob = {
  id: string;
  title: string;
  budget_type: "fixed" | "hourly";
  budget_amount: number;
};

/** Right rail on /feed — suggested people + trending jobs for easy discovery. */
export function FeedRightRail({
  suggestions,
  trendingJobs,
}: {
  suggestions: SuggestedProfile[];
  trendingJobs: TrendingJob[];
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-2">
      {/* Add to your feed */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-ink-900">{t("feed.addToFeed")}</h3>
        <div className="mt-3 space-y-4">
          {suggestions.length === 0 && (
            <p className="text-xs text-slate-500">{t("feed.newPeople")}</p>
          )}
          {suggestions.map((s) => (
            <div key={s.id} className="flex items-start gap-2">
              {s.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.avatar_url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                  {(s.full_name ?? "W").trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <Link
                  href={`/profile/${s.id}`}
                  className="block truncate text-sm font-semibold text-ink-900 hover:text-brand-600 hover:underline"
                >
                  {s.full_name ?? "Workbrio member"}
                </Link>
                {s.headline && (
                  <p className="line-clamp-2 text-xs text-slate-500">{s.headline}</p>
                )}
                <Link
                  href={`/profile/${s.id}`}
                  className="mt-1 inline-block rounded-full border border-slate-300 px-3 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t("feed.viewProfileBtn")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending jobs — one click to job search */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink-900">{t("feed.trendingJobs")}</h3>
          <Link href="/jobs" className="text-xs font-semibold text-brand-600 hover:underline">
            {t("feed.seeAll")}
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {trendingJobs.length === 0 && (
            <p className="text-xs text-slate-500">
              {t("feed.noJobs")} —{" "}
              <Link href="/jobs/new" className="font-semibold text-brand-600 hover:underline">
                {t("feed.postFirst")}
              </Link>
              .
            </p>
          )}
          {trendingJobs.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`} className="block group">
              <p className="truncate text-sm font-semibold text-ink-900 group-hover:text-brand-600 group-hover:underline">
                {j.title}
              </p>
              <p className="text-xs text-slate-500">
                {j.budget_type === "hourly" ? t("jobs.hourly") : t("jobs.fixed")} · $
                {Number(j.budget_amount).toLocaleString()}
                {j.budget_type === "hourly" ? "/hr" : ""}
              </p>
            </Link>
          ))}
        </div>
        <Link
          href="/jobs"
          className="mt-3 block rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
        >
          🔍 {t("feed.searchAllJobs")}
        </Link>
        <Link
          href="/jobs/new"
          className="mt-2 block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-ink-700 hover:bg-slate-50"
        >
          💼 {t("feed.postAJobBtn")}
        </Link>
      </div>
    </div>
  );
}
