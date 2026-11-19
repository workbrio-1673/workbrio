import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { todayISO } from "@/lib/supabase/types";

/** Public sitemap. Update SITE_URL in src/lib/site.ts once the
 * production domain is connected. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes = ["/", "/login", "/signup", "/jobs", "/feed"];
  const entries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "daily",
    priority: route === "/" ? 1 : 0.7,
  }));

  // Live job + service detail pages, so Google can find the real
  // listings (not just the static shell). Only live rows: open jobs
  // whose deadline has not passed, and active services. If Supabase
  // is unavailable the sitemap still returns the static routes.
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const [jobsRes, servicesRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("id, updated_at")
          .eq("status", "open")
          .or(`deadline.is.null,deadline.gte.${todayISO()}`)
          .order("updated_at", { ascending: false })
          .limit(1000),
        supabase
          .from("services")
          .select("id, updated_at")
          .eq("status", "active")
          .order("updated_at", { ascending: false })
          .limit(1000),
      ]);
      const jobs = (jobsRes.data ?? []) as {
        id: string;
        updated_at: string | null;
      }[];
      const services = (servicesRes.data ?? []) as {
        id: string;
        updated_at: string | null;
      }[];
      for (const job of jobs) {
        entries.push({
          url: `${SITE_URL}/jobs/${job.id}`,
          lastModified: job.updated_at ? new Date(job.updated_at) : now,
          changeFrequency: "daily",
          priority: 0.6,
        });
      }
      for (const service of services) {
        entries.push({
          url: `${SITE_URL}/services/${service.id}`,
          lastModified: service.updated_at
            ? new Date(service.updated_at)
            : now,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    } catch {
      // Fall through with the static routes only.
    }
  }

  return entries;
}
