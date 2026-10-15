"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "./Input";
import { Button } from "./Button";
import { SkillChip } from "./SkillChip";
import type { Skill } from "@/lib/supabase/types";
import { useLanguage } from "./LanguageProvider";

type Filters = {
  q: string;
  category: string;
  skill: string;
  max: string;
};

const EMPTY: Filters = { q: "", category: "", skill: "", max: "" };

/** Search + filter bar for /services. Pushes the filters into the URL query. */
export function ServiceFilters({
  initial,
  allSkills,
  categories,
}: {
  initial: Filters;
  allSkills: Skill[];
  categories: string[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [f, setF] = useState<Filters>(initial);
  const [skillInput, setSkillInput] = useState(initial.skill);

  const set = (patch: Partial<Filters>) =>
    setF((prev) => ({ ...prev, ...patch }));

  const suggestions =
    skillInput.trim().length >= 2
      ? allSkills
          .filter(
            (s) =>
              s.name.toLowerCase().includes(skillInput.trim().toLowerCase()) &&
              s.name.toLowerCase() !== f.skill.toLowerCase()
          )
          .slice(0, 6)
      : [];

  const apply = (overrides?: Partial<Filters>) => {
    const next = { ...f, ...overrides };
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.category) params.set("category", next.category);
    if (next.skill) params.set("skill", next.skill);
    if (next.max) params.set("max", next.max);
    const qs = params.toString();
    router.push(`/services${qs ? `?${qs}` : ""}`);
  };

  const clear = () => {
    setF(EMPTY);
    setSkillInput("");
    router.push("/services");
  };

  const hasActive =
    f.q.trim() || f.category || f.skill || f.max;

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Input
          label={t("services.searchLabel")}
          placeholder={t("services.keywordsPh")}
          value={f.q}
          onChange={(e) => set({ q: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
        <div>
          <label
            htmlFor="servicefilter-category"
            className="mb-1.5 block text-sm font-semibold text-ink-900"
          >
            {t("services.categoryLabel")}
          </label>
          <select
            id="servicefilter-category"
            value={f.category}
            onChange={(e) => {
              set({ category: e.target.value });
              apply({ category: e.target.value });
            }}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-[0.95rem] text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          >
            <option value="">{t("services.allCategories")}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="servicefilter-skill"
            className="mb-1.5 block text-sm font-semibold text-ink-900"
          >
            {t("services.skillLabel")}
          </label>
          <div className="relative">
            <input
              id="servicefilter-skill"
              value={skillInput}
              onChange={(e) => {
                setSkillInput(e.target.value);
                if (e.target.value === "") set({ skill: "" });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const pick = suggestions[0];
                  if (pick) {
                    set({ skill: pick.name });
                    setSkillInput(pick.name);
                  }
                  apply({ skill: pick?.name ?? "" });
                }
              }}
              placeholder="e.g. Logo design"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-[0.95rem] text-ink-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        set({ skill: s.name });
                        setSkillInput(s.name);
                        apply({ skill: s.name });
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-ink-900 hover:bg-slate-50"
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {f.skill && (
            <div className="mt-2">
              <SkillChip
                name={f.skill}
                onRemove={() => {
                  set({ skill: "" });
                  setSkillInput("");
                  apply({ skill: "" });
                }}
              />
            </div>
          )}
        </div>
        <Input
          label={t("services.maxPriceLabel")}
          type="number"
          min="0"
          placeholder="Any"
          value={f.max}
          onChange={(e) => set({ max: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
      </div>
      <div className="mt-4 flex gap-3">
        <Button size="sm" onClick={() => apply()}>
          {t("services.searchBtn")}
        </Button>
        {hasActive && (
          <Button size="sm" variant="ghost" onClick={clear}>
            {t("services.clearBtn")}
          </Button>
        )}
      </div>
    </div>
  );
}
