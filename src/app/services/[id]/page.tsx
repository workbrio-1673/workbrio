import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { SkillChip } from "@/components/SkillChip";
import { ShareButtons } from "@/components/ShareButtons";
import { OrderServiceButton } from "@/components/OrderServiceButton";
import type { ServiceWithFreelancer } from "@/lib/supabase/types";
import { servicePriceLabel, deliveryLabel, timeAgo } from "@/lib/supabase/types";

/** Service detail page: /services/[id]. Session read via cookies(), dynamic. */
export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

async function loadService(id: string): Promise<ServiceWithFreelancer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "*, freelancer:freelancer_id(full_name, avatar_url, headline, location, hourly_rate)"
    )
    .eq("id", id)
    .single();
  if (error || !data) return null;
  const row = data as unknown as Record<string, unknown>;
  const freelancer = (row.freelancer as Record<string, unknown> | null) ?? null;
  return {
    id: String(row.id),
    freelancer_id: String(row.freelancer_id),
    title: String(row.title),
    description: String(row.description),
    category: String(row.category ?? "Other"),
    price: Number(row.price),
    delivery_days: Number(row.delivery_days ?? 3),
    skills: (row.skills as string[] | null) ?? [],
    status: row.status as "active" | "paused",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    freelancer_name: (freelancer?.full_name as string | null) ?? null,
    freelancer_avatar: (freelancer?.avatar_url as string | null) ?? null,
    freelancer_headline: (freelancer?.headline as string | null) ?? null,
    freelancer_location: (freelancer?.location as string | null) ?? null,
    freelancer_rate: (freelancer?.hourly_rate as number | null) ?? null,
  };
}

/** Service detail page: /services/[id] */
export default async function ServiceDetailPage({ params }: PageProps) {
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = await loadService(id);
  if (!service) notFound();

  const isOwner = user.id === service.freelancer_id;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="mb-6">
          <Link
            href="/services"
            className="text-sm font-semibold text-brand-600 hover:text-brand-500"
          >
            ← Back to services
          </Link>
        </p>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-600">
                  {service.category}
                </span>
                <span className="text-sm text-slate-400">
                  Listed {timeAgo(service.created_at)}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900">
                {service.title}
              </h1>
              <p className="mt-2 text-xl font-extrabold text-gradient">
                {servicePriceLabel(service.price)}{" "}
                <span className="text-sm font-semibold text-slate-400">
                  starting price
                </span>
              </p>

              <div className="mt-4">
                <ShareButtons title={service.title} />
              </div>

              <h2 className="mt-8 text-lg font-extrabold text-ink-900">
                About this service
              </h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">
                {service.description}
              </p>

              {service.skills.length > 0 && (
                <>
                  <h2 className="mt-8 text-lg font-extrabold text-ink-900">
                    Skills
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {service.skills.map((s) => (
                      <SkillChip key={s} name={s} />
                    ))}
                  </div>
                </>
              )}

              <div className="mt-8 grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Delivery time
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-ink-900">
                    ⏱ {deliveryLabel(service.delivery_days)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Workbrio commission
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-emerald-600">
                    0% — always free
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Order this service
              </h2>
              <p className="mt-2 text-3xl font-extrabold text-ink-900">
                {servicePriceLabel(service.price)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                ⏱ Delivered in {deliveryLabel(service.delivery_days)}
              </p>
              <div className="mt-4">
                {isOwner ? (
                  <Button href="/services" variant="secondary" className="w-full">
                    This is your service
                  </Button>
                ) : service.status === "active" ? (
                  <OrderServiceButton
                    serviceTitle={service.title}
                    servicePrice={service.price}
                    freelancerId={service.freelancer_id}
                    buyerId={user.id}
                  />
                ) : (
                  <p className="text-sm text-slate-600">
                    This service is currently paused.
                  </p>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Ordering opens a chat with the freelancer. Payment is direct
                between you two — Workbrio takes 0%.
              </p>
            </Card>

            <Card>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                About the freelancer
              </h2>
              <div className="mt-4 flex items-center gap-3">
                {service.freelancer_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={service.freelancer_avatar}
                    alt={service.freelancer_name ?? "Freelancer"}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-lg font-extrabold text-white">
                    {(service.freelancer_name ?? "W")[0]?.toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/profile/${service.freelancer_id}`}
                    className="block truncate font-bold text-ink-900 hover:text-brand-600"
                  >
                    {service.freelancer_name ?? "Freelancer"}
                  </Link>
                  {service.freelancer_location && (
                    <p className="text-sm text-slate-500">
                      📍 {service.freelancer_location}
                    </p>
                  )}
                </div>
              </div>
              {service.freelancer_headline && (
                <p className="mt-3 text-sm text-slate-600">
                  {service.freelancer_headline}
                </p>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
