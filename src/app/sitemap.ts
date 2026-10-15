import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Public sitemap. Update SITE_URL in src/lib/site.ts once the
 * production domain is connected. */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/login", "/signup", "/jobs", "/feed"];
  const now = new Date();
  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "daily",
    priority: route === "/" ? 1 : 0.7,
  }));
}
