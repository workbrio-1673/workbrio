import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";

/** POST /api/track — logs one page view (fire-and-forget, no PII stored).
 *  Body: { path: string }. The visitor key is a one-way hash of IP + date,
 *  so unique visitors can be counted without storing any personal data. */
export async function POST(req: Request) {
  try {
    const { path } = (await req.json().catch(() => ({}))) as {
      path?: string;
    };
    const cleanPath =
      typeof path === "string" && path.startsWith("/")
        ? path.slice(0, 200)
        : "/";

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const day = new Date().toISOString().slice(0, 10);
    const visitorKey = createHash("sha256")
      .update(`${ip}|${day}|workbrio`)
      .digest("hex")
      .slice(0, 32);

    const supabase = await createClient();
    await supabase.from("page_views").insert({
      path: cleanPath,
      visitor_key: visitorKey,
    });
  } catch {
    // Tracking must never break the page — fail silently.
  }
  return NextResponse.json({ ok: true });
}
