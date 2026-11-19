import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, detectLang, isLangCode } from "@/lib/i18n/languages";

/**
 * Refreshes the Supabase auth session on every request and enforces
 * the protected-route rules for M0/M1:
 *  - Signed-out visitors to /dashboard* /settings* (and future app routes) → /login
 *  - /jobs (the list) is PUBLIC: anyone can browse jobs; only /jobs/new
 *    (posting) and applying need sign-in
 *  - /profile/[id] stays PUBLIC so profiles can be shared
 *  - Signed-in users visiting /login or /signup → /dashboard
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Auto-detect language: if the user hasn't picked one, use their
  // browser/country language (Accept-Language) and remember it.
  const existingLang = request.cookies.get(LANG_COOKIE)?.value;
  const autoLang =
    existingLang && isLangCode(existingLang)
      ? null
      : detectLang(request.headers.get("accept-language"));
  const withLang = (res: NextResponse) => {
    if (autoLang) {
      res.cookies.set(LANG_COOKIE, autoLang, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
    }
    return res;
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase not configured yet (fresh clone): let the request through;
  // pages that need auth will show the configuration hint instead.
  if (!url || !anonKey) {
    return withLang(supabaseResponse);
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password");
  const isProtected = ["/dashboard", "/settings", "/feed", "/messages", "/notifications"].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  // /jobs/new stays protected (posting a job needs sign-in) even though
  // the /jobs list itself is public.
  const isProtectedJobRoute = pathname === "/jobs/new";

  // Public detail pages: a single /jobs/<id> or /services/<id> is viewable
  // without signing in, so the page (and its Open Graph tags) reach
  // logged-out visitors and link-preview crawlers (Facebook/WhatsApp).
  // The /jobs list itself is public too; only /jobs/new stays protected,
  // as does /services/new.
  const isPublicDetail =
    (/^\/jobs\/[^/]+$/.test(pathname) && pathname !== "/jobs/new") ||
    (/^\/services\/[^/]+$/.test(pathname) && pathname !== "/services/new");

  if (!user && (isProtected || isProtectedJobRoute) && !isPublicDetail) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    // Preserve the full original path (including ?peer= / ?conversation=
    // deep links) so post-login redirects land back in the right place.
    loginUrl.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search
    );
    return withLang(NextResponse.redirect(loginUrl));
  }

  if (user && isAuthPage) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.search = "";
    return withLang(NextResponse.redirect(dashUrl));
  }

  return withLang(supabaseResponse);
}
