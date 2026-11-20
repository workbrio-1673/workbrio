"use client";

import Link from "next/link";
import { Button } from "./Button";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "./LanguageProvider";

/** Public site navbar — white, sticky, with brand CTA. */
export function Navbar() {
  const { t } = useLanguage();
  const LINKS = [
    { label: t("nav.findWork"), href: "/#how-it-works" },
    { label: t("nav.hireTalent"), href: "/#how-it-works" },
    { label: t("nav.features"), href: "/#features" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
        <Logo height={36} />
        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-base font-semibold text-ink-700 transition-colors hover:text-brand-600"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <NotificationBell />
          <LanguageSwitcher compact />
          <Button href="/login" variant="ghost" size="sm" className="whitespace-nowrap px-3 sm:px-4">
            {t("nav.signIn")}
          </Button>
          <Button href="/signup" size="sm" className="whitespace-nowrap px-3 sm:px-4">
            {t("nav.join")}
          </Button>
        </div>
      </nav>
    </header>
  );
}
