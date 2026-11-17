import Link from "next/link";
import { Card } from "./Card";
import { SkillChip } from "./SkillChip";
import type { JobWithClient } from "@/lib/supabase/types";
import {
  budgetLabel,
  deadlineLabel,
  JOB_TYPE_LABELS,
  timeAgo,
} from "@/lib/supabase/types";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-emerald-500/10 text-emerald-600",
  in_progress: "bg-amber-500/10 text-amber-600",
  closed: "bg-slate-500/10 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  closed: "Closed",
};

/** Job listing card in the Workbrio style. */
export function JobCard({ job }: { job: JobWithClient }) {
  return (
    <Link href={`/jobs/${job.id}`} className="block h-full">
      <Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
        {job.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={job.image_url}
            alt={job.title}
            loading="lazy"
            className="-mx-6 -mt-6 mb-5 aspect-[16/9] w-full shrink-0 rounded-t-2xl object-cover"
          />
        )}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-extrabold leading-snug text-ink-900">
            {job.title}
          </h3>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold capitalize ${
              STATUS_STYLES[job.status] ?? STATUS_STYLES.closed
            }`}
          >
            {STATUS_LABELS[job.status] ?? job.status}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {job.description}
        </p>

        {(job.company_name || job.location || job.job_type || job.deadline) && (
          <div className="mt-3 space-y-1 text-sm">
            {job.company_name && (
              <p className="font-bold text-slate-700">{job.company_name}</p>
            )}
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500">
              {job.location && <span>📍 {job.location}</span>}
              {job.job_type && (
                <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-bold text-brand-600">
                  {JOB_TYPE_LABELS[job.job_type]}
                </span>
              )}
              {job.deadline && (
                <span className="font-semibold text-amber-600">
                  Apply by {deadlineLabel(job.deadline)}
                </span>
              )}
            </p>
          </div>
        )}

        {job.skills_required.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skills_required.slice(0, 4).map((s) => (
              <SkillChip key={s} name={s} />
            ))}
            {job.skills_required.length > 4 && (
              <span className="text-xs font-semibold text-slate-400">
                +{job.skills_required.length - 4} more
              </span>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            {job.client_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={job.client_avatar}
                alt={job.client_name ?? "Client"}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-brand text-xs font-extrabold text-white">
                {(job.client_name ?? "W")[0]?.toUpperCase()}
              </span>
            )}
            <span className="max-w-32 truncate text-sm font-semibold text-slate-600">
              {job.client_name ?? "Client"}
            </span>
          </div>
          <div className="text-right">
            <p className="text-base font-extrabold text-ink-900">
              {budgetLabel(job.budget_type, job.budget_amount)}
            </p>
            <p className="text-xs text-slate-400">{timeAgo(job.created_at)}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
