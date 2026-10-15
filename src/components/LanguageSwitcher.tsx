"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUAGES } from "@/lib/i18n/languages";
import { useLanguage } from "./LanguageProvider";

/** Globe button with a dropdown of the 10 supported languages. */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t("common.language")}
        className={`flex items-center gap-1.5 rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-ink-900 ${
          compact ? "p-2" : "px-3 py-2 text-sm font-medium"
        }`}
      >
        <span aria-hidden className="text-lg leading-none">
          🌍
        </span>
        {!compact && <span>{current.nativeName}</span>}
        {!compact && (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
            <path d="M7 10l5 5 5-5H7z" />
          </svg>
        )}
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={t("common.language")}
          className="absolute end-0 top-full z-50 mt-1 max-h-80 w-48 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === lang}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 ${
                l.code === lang
                  ? "font-bold text-brand-600"
                  : "text-ink-700"
              }`}
            >
              <span>{l.nativeName}</span>
              {l.code === lang && <span aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
