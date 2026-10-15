import { createBrowserClient } from "@supabase/ssr";

/**
 * True when both Supabase env vars are present.
 * Pages check this before calling createClient() so `npm run build`
 * passes on a fresh clone without keys.
 */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Browser-side Supabase client (for Client Components and event handlers).
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * These are set in `.env.local` — see `.env.example`. They are only read
 * when this function is called (never at import time), so a missing key
 * fails with a clear message instead of a cryptic build error.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and fill in " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from your " +
        "Supabase project dashboard (Settings → API)."
    );
  }

  return createBrowserClient(url, anonKey);
}
