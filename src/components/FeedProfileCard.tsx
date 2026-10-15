"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

/** Left rail on /feed — LinkedIn-style profile card + quick links. */
export function FeedProfileCard({
  userId,
  fullName,
  headline,
  location,
  avatarUrl,
  postCount,
  memberCount,
}: {
  userId: string;
  fullName: string | null;
  headline: string | null;
  location: string | null;
  avatarUrl: string | null;
  postCount: number;
  memberCount: number;
}) {
  const { t } = useLanguage();
  const initial = (fullName ?? "W").trim().charAt(0).toUpperCase();
  return (
    <div className="space-y-2">
      {/* Profile card */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Link href={`/profile/${userId}`} className="block">
          <div className="h-14 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500" />
          <div className="-mt-8 px-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={fullName ?? "Profile"}
                className="h-16 w-16 rounded-full border-2 border-white object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-brand-100 text-2xl font-bold text-brand-700">
                {initial}
              </div>
            )}
          </div>
          <div className="px-4 pb-3 pt-2">
            <p className="font-semibold text-ink-900 hover:text-brand-600 hover:underline">
              {fullName ?? "Workbrio member"}
            </p>
            {headline && (
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{headline}</p>
            )}
            {location && (
              <p className="mt-0.5 text-xs text-slate-500">{location}</p>
            )}
          </div>
        </Link>
        <div className="border-t border-slate-100 px-4 py-2 text-xs">
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500">{t("feed.myPosts")}</span>
            <span className="font-semibold text-brand-600">{postCount}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500">{t("feed.peopleOn")}</span>
            <span className="font-semibold text-brand-600">{memberCount}</span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
        <nav className="space-y-2.5">
          <Link href="/jobs" className="flex items-center gap-2 font-medium text-ink-700 hover:text-brand-600">
            <span>💼</span> {t("feed.browseJobs")}
          </Link>
          <Link href="/jobs/new" className="flex items-center gap-2 font-medium text-ink-700 hover:text-brand-600">
            <span>➕</span> {t("feed.postAJobBtn")}
          </Link>
          <Link href="/messages" className="flex items-center gap-2 font-medium text-ink-700 hover:text-brand-600">
            <span>💬</span> {t("feed.messages")}
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 font-medium text-ink-700 hover:text-brand-600">
            <span>📊</span> {t("feed.myDashboard")}
          </Link>
          <Link href="/saved" className="flex items-center gap-2 font-medium text-ink-700 hover:text-brand-600">
            <span>🔖</span> {t("feed.savedItems")}
          </Link>
        </nav>
      </div>
    </div>
  );
}
