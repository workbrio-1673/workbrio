/** The 10 languages Workbrio supports. */
export type LangCode =
  | "en"
  | "ur"
  | "hi"
  | "ar"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "tr"
  | "zh";

export type Language = {
  code: LangCode;
  /** Name shown in the switcher, in its own language. */
  nativeName: string;
  /** English name (for clarity). */
  name: string;
  rtl: boolean;
};

export const LANGUAGES: Language[] = [
  { code: "en", nativeName: "English", name: "English", rtl: false },
  { code: "ur", nativeName: "اردو", name: "Urdu", rtl: true },
  { code: "hi", nativeName: "हिन्दी", name: "Hindi", rtl: false },
  { code: "ar", nativeName: "العربية", name: "Arabic", rtl: true },
  { code: "es", nativeName: "Español", name: "Spanish", rtl: false },
  { code: "fr", nativeName: "Français", name: "French", rtl: false },
  { code: "de", nativeName: "Deutsch", name: "German", rtl: false },
  { code: "pt", nativeName: "Português", name: "Portuguese", rtl: false },
  { code: "tr", nativeName: "Türkçe", name: "Turkish", rtl: false },
  { code: "zh", nativeName: "中文", name: "Chinese", rtl: false },
];

export const DEFAULT_LANG: LangCode = "en";
export const LANG_COOKIE = "wb-lang";

export function isLangCode(v: string | null | undefined): v is LangCode {
  return LANGUAGES.some((l) => l.code === v);
}

/**
 * Map a browser Accept-Language header (or locale like "ur-PK") to one of
 * our 10 languages. Falls back to English.
 */
export function detectLang(header: string | null | undefined): LangCode {
  if (!header) return DEFAULT_LANG;
  const first = header.split(",")[0].trim().toLowerCase();
  const base = first.split("-")[0].split("_")[0];
  // Direct matches
  if (isLangCode(base)) return base;
  // Common aliases → our languages
  const aliases: Record<string, LangCode> = {
    pa: "ur", // Punjabi speakers in PK often read Urdu
    bn: "hi", // Bengali → closest supported South-Asian script coverage
    zh_tw: "zh",
    "zh-hk": "zh",
  };
  if (aliases[base]) return aliases[base];
  if (aliases[first]) return aliases[first];
  return DEFAULT_LANG;
}
