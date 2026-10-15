"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "./LanguageProvider";

/** LinkedIn-style app navbar for signed-in users: search + Home/Jobs/Messaging/Notifications/Me. */
export function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const TABS = [
    {
      label: t("nav.home"),
      href: "/feed",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M12 3l9 8h-3v9h-4v-6H10v6H6v-9H3l9-8z" />
        </svg>
      ),
    },
    {
      label: t("nav.jobs"),
      href: "/jobs",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M9 4a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h4V4zm2 1v1h2V5h-2zM7 9v9h10V9H7z" />
        </svg>
      ),
    },
    {
      label: t("nav.services"),
      href: "/services",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M7 3h10a1 1 0 011 1v4h3v13a1 1 0 01-1 1H4a1 1 0 01-1-1V8h3V4a1 1 0 011-1zm2 2v3h6V5H9zm-4 6v9h14v-9H5z" />
        </svg>
      ),
    },
    {
      label: t("nav.messaging"),
      href: "/messages",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M4 4h16a1 1 0 011 1v12a1 1 0 01-1 1H8l-4 4V5a1 1 0 011-1zm2 4v2h12V8H6zm0 4v2h8v-2H6z" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      setAvatar((data?.avatar_url as string | null) ?? null);
    });
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/jobs${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/feed" aria-label="Workbrio home" className="shrink-0">
          <Logo />
        </Link>

        {/* Job search — the fastest way to find work */}
        <form onSubmit={submitSearch} className="relative hidden sm:block">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("nav.searchJobs")}
            aria-label={t("nav.searchJobs")}
            className="h-9 w-44 rounded-md bg-slate-100 ps-9 pe-3 text-sm text-ink-900 placeholder:text-slate-500 focus:w-64 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 lg:w-56 transition-all"
          />
        </form>

        <div className="ms-auto flex items-center">
          <Link
            href="/jobs/new"
            className="me-1 hidden items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 md:flex"
          >
            <span aria-hidden>💼</span> {t("nav.postAJob")}
          </Link>
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-w-[64px] flex-col items-center px-2 py-1 text-[11px] font-medium transition-colors sm:min-w-[76px] ${
                isActive(tab.href)
                  ? "text-ink-900"
                  : "text-slate-500 hover:text-ink-900"
              }`}
            >
              <span className={isActive(tab.href) ? "text-ink-900" : ""}>
                {tab.icon}
              </span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span
                className={`mt-0.5 h-0.5 w-10 rounded-full ${
                  isActive(tab.href) ? "bg-ink-900" : "bg-transparent"
                }`}
              />
            </Link>
          ))}

          <div className="flex min-w-[64px] flex-col items-center px-2 py-1 text-[11px] font-medium text-slate-500 sm:min-w-[76px]">
            <NotificationBell />
            <span className="hidden sm:inline">{t("nav.notifications")}</span>
          </div>

          <LanguageSwitcher compact />

          {/* Me menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex min-w-[64px] flex-col items-center px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-ink-900 sm:min-w-[76px]"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={t("nav.me")}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" />
                </svg>
              )}
              <span className="hidden items-center gap-0.5 sm:flex">
                {t("nav.me")}
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                  <path d="M7 10l5 5 5-5H7z" />
                </svg>
              </span>
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute end-0 top-full mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
              >
                <Link
                  href={userId ? `/profile/${userId}` : "/feed"}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-ink-700 hover:bg-slate-50"
                >
                  {t("nav.viewProfile")}
                </Link>
                <Link
                  href="/settings/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-ink-700 hover:bg-slate-50"
                >
                  {t("nav.settings")}
                </Link>
                <button
                  onClick={signOut}
                  className="block w-full px-4 py-2 text-start text-sm text-ink-700 hover:bg-slate-50"
                >
                  {t("nav.signOut")}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      {/* Mobile job search */}
      <form onSubmit={submitSearch} className="border-t border-slate-100 px-4 py-2 sm:hidden">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("nav.searchJobs")}
          aria-label={t("nav.searchJobs")}
          className="h-9 w-full rounded-md bg-slate-100 px-3 text-sm text-ink-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </form>
    </header>
  );
}
