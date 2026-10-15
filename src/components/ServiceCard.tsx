import Link from "next/link";
import { Card } from "./Card";
import { SkillChip } from "./SkillChip";
import type { ServiceWithFreelancer } from "@/lib/supabase/types";
import { servicePriceLabel, deliveryLabel, timeAgo } from "@/lib/supabase/types";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  paused: "bg-slate-500/10 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
};

/** Service (gig) listing card in the Workbrio style. */
export function ServiceCard({ service }: { service: ServiceWithFreelancer }) {
  return (
    <Link href={`/services/${service.id}`} className="block h-full">
      <Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-extrabold leading-snug text-ink-900">
            {service.title}
          </h3>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold capitalize ${
              STATUS_STYLES[service.status] ?? STATUS_STYLES.paused
            }`}
          >
            {STATUS_LABELS[service.status] ?? service.status}
          </span>
        </div>

        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-brand-600">
          {service.category}
        </p>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {service.description}
        </p>

        {service.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {service.skills.slice(0, 4).map((s) => (
              <SkillChip key={s} name={s} />
            ))}
            {service.skills.length > 4 && (
              <span className="text-xs font-semibold text-slate-400">
                +{service.skills.length - 4} more
              </span>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            {service.freelancer_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={service.freelancer_avatar}
                alt={service.freelancer_name ?? "Freelancer"}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-brand text-xs font-extrabold text-white">
                {(service.freelancer_name ?? "W")[0]?.toUpperCase()}
              </span>
            )}
            <span className="max-w-32 truncate text-sm font-semibold text-slate-600">
              {service.freelancer_name ?? "Freelancer"}
            </span>
          </div>
          <div className="text-right">
            <p className="text-base font-extrabold text-ink-900">
              {servicePriceLabel(service.price)}
            </p>
            <p className="text-xs text-slate-400">
              ⏱ {deliveryLabel(service.delivery_days)} · {timeAgo(service.created_at)}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
