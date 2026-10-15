import Link from "next/link";
import { Card } from "@/components/Card";
import { SkillChip } from "@/components/SkillChip";
import type { Profile } from "@/lib/supabase/types";

type ProfileCardProps = {
  profile: Profile;
  skills?: string[];
  avgRating?: number | null;
  reviewCount?: number;
};

function initials(name: string | null) {
  if (!name) return "W";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Compact profile summary card linking to the full public profile. */
export function ProfileCard({ profile, skills = [], avgRating, reviewCount }: ProfileCardProps) {
  const visibleSkills = skills.slice(0, 5);
  const extra = skills.length - visibleSkills.length;

  return (
    <Link href={`/profile/${profile.id}`} className="block h-full">
      <Card hover className="flex h-full flex-col">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.full_name ?? "Profile photo"}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-500/20"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-lg font-extrabold text-white">
              {initials(profile.full_name)}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="truncate font-bold text-ink-900">
              {profile.full_name ?? "Workbrio member"}
            </h3>
            {profile.headline && (
              <p className="truncate text-sm text-slate-500">{profile.headline}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-brand-500/10 px-2.5 py-1 font-bold capitalize text-brand-600">
            {profile.role}
          </span>
          {profile.location && <span>📍 {profile.location}</span>}
          {profile.hourly_rate != null && (
            <span className="font-semibold text-ink-900">
              ${Number(profile.hourly_rate).toFixed(0)}/hr
            </span>
          )}
          {avgRating != null && (
            <span className="font-semibold text-amber-500">
              ★ {avgRating.toFixed(1)}
              {reviewCount != null && reviewCount > 0 && (
                <span className="font-normal text-slate-400"> ({reviewCount})</span>
              )}
            </span>
          )}
        </div>

        {visibleSkills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {visibleSkills.map((s) => (
              <SkillChip key={s} name={s} />
            ))}
            {extra > 0 && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-500">
                +{extra} more
              </span>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
