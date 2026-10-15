"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANG,
  LANG_COOKIE,
  LANGUAGES,
  detectLang,
  isLangCode,
  type LangCode,
} from "@/lib/i18n/languages";
import { translate } from "@/lib/i18n/translations";

type LangContextValue = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  /** t("nav.home") → translated string (English fallback). */
  t: (key: string, vars?: Record<string, string | number>) => string;
  rtl: boolean;
};

const LangContext = createContext<LangContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (k, vars) => translate(DEFAULT_LANG, k, vars),
  rtl: false,
});

function readCookie(): LangCode | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]*)`));
  const v = m ? decodeURIComponent(m[1]) : null;
  return isLangCode(v) ? v : null;
}

/** Provides the current language + t() to the whole app. Handles RTL. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);

  // Initial: cookie → else detect from browser language.
  useEffect(() => {
    const fromCookie = readCookie();
    if (fromCookie) {
      setLangState(fromCookie);
    } else {
      const detected = detectLang(navigator.language);
      setLangState(detected);
      document.cookie = `${LANG_COOKIE}=${detected}; path=/; max-age=31536000`;
    }
  }, []);

  // Keep <html lang> and dir in sync (RTL for Urdu/Arabic).
  useEffect(() => {
    const meta = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.rtl ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000`;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(lang, key, vars),
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      rtl: (LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]).rtl,
    }),
    [lang, setLang, t]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLanguage() {
  return useContext(LangContext);
}
