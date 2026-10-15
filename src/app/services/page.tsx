import type { Metadata } from "next";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ServiceCard } from "@/components/ServiceCard";
import { ServiceFilters } from "@/components/ServiceFilters";
import type { ServiceWithFreelancer, Skill } from "@/lib/supabase/types";
import { SERVICE_CATEGORIES } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Browse Freelance Services",
  description:
    "Browse ready-to-order freelance services on Workbrio — 0% commission, order directly from talented freelancers.",
};

/** Browse page: /services — search + category/price filters. Session read via cookies(), dynamic. */
export const instant = false;

type SearchParams = {
  q?: string;
  category?: string;
  skill?: string;
  max?: string;
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

function mapService(row: Record<string, unknown>): ServiceWithFreelancer {
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

async function loadServices(params: SearchParams): Promise<ServiceWithFreelancer[]> {
  const supabase = await createClient();

  let query = supabase
    .from("services")
    .select(
      "*, freelancer:freelancer_id(full_name, avatar_url, headline, location, hourly_rate)"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(100);

  if (params.q?.trim()) {
    const q = params.q.trim().replace(/,/g, " ");
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (params.category) {
    query = query.eq("category", params.category);
  }
  if (params.skill) {
    query = query.contains("skills", [params.skill]);
  }
  const max = Number(params.max);
  if (Number.isFinite(max) && max > 0) query = query.lte("price", max);

  const { data, error } = await query;
  if (error) {
    // Table not created yet (migration not run) → show empty state, not a crash.
    return [];
  }
  return (data ?? []).map((row) =>
    mapService(row as unknown as Record<string, unknown>)
  );
}

/** Protected browse page: /services */
export default async function ServicesPage({ searchParams }: PageProps) {
  const params = await searchParams;

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

  const [services, allSkills] = await Promise.all([
    loadServices(params),
    (async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("skills")
        .select("id, name")
        .order("name");
      return (data ?? []) as Skill[];
    })(),
  ]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = (user?.user_metadata?.role as string | undefined) ?? "freelancer";

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
              Services
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Ready-to-order gigs from talented freelancers —{" "}
              <span className="font-bold text-emerald-600">0% commission</span>,
              order directly, no bidding.
              {services.length > 0 && (
                <>
                  {" "}
                  <span className="font-semibold text-ink-900">
                    {services.length} service{services.length === 1 ? "" : "s"}
                  </span>{" "}
                  available.
                </>
              )}
            </p>
          </div>
          {role === "freelancer" && (
            <Button href="/services/new" size="sm">
              + Offer a service
            </Button>
          )}
        </div>

        <div className="mt-6">
          <ServiceFilters
            initial={{
              q: params.q ?? "",
              category: params.category ?? "",
              skill: params.skill ?? "",
              max: params.max ?? "",
            }}
            allSkills={allSkills}
            categories={[...SERVICE_CATEGORIES]}
          />
        </div>

        {services.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <Card className="mt-8 text-center">
            <p className="text-4xl">🛍️</p>
            <h2 className="mt-4 text-xl font-extrabold text-ink-900">
              No services found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Try different keywords or clear the filters. Freelancers: be the
              first to offer a service here!
            </p>
            <p className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/services"
                className="text-sm font-semibold text-brand-600 hover:text-brand-500"
              >
                Clear all filters
              </Link>
              {role === "freelancer" && (
                <Link
                  href="/services/new"
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-500"
                >
                  + Offer a service
                </Link>
              )}
            </p>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
