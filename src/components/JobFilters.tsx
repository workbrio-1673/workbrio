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
  skill: string;
  budget_type: string;
  min: string;
  max: string;
};

const EMPTY: Filters = { q: "", skill: "", budget_type: "", min: "", max: "" };

/** Search + filter bar for /jobs. Pushes the filters into the URL query. */
export function JobFilters({
  // eslint-disable-next-line
  initial,
  allSkills,
}: {
  initial: Filters;
  allSkills: Skill[];
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
    if (next.skill) params.set("skill", next.skill);
    if (next.budget_type) params.set("budget_type", next.budget_type);
    if (next.min) params.set("min", next.min);
    if (next.max) params.set("max", next.max);
    const qs = params.toString();
    router.push(`/jobs${qs ? `?${qs}` : ""}`);
  };

  const clear = () => {
    setF(EMPTY);
    setSkillInput("");
    router.push("/jobs");
  };

  const hasActive =
    f.q.trim() || f.skill || f.budget_type || f.min || f.max;

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Input
          label={t("jobs.searchLabel")}
          placeholder={t("jobs.keywordsPh")}
          value={f.q}
          onChange={(e) => set({ q: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
        <div>
          <label
            htmlFor="jobfilter-skill"
            className="mb-1.5 block text-sm font-semibold text-ink-900"
          >
            {t("jobs.skillLabel")}
          </label>
          <div className="relative">
            <input
              id="jobfilter-skill"
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
              placeholder="e.g. React"
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
        <div>
          <label
            htmlFor="jobfilter-budget-type"
            className="mb-1.5 block text-sm font-semibold text-ink-900"
          >
            {t("jobs.budgetTypeLabel")}
          </label>
          <select
            id="jobfilter-budget-type"
            value={f.budget_type}
            onChange={(e) => {
              set({ budget_type: e.target.value });
              apply({ budget_type: e.target.value });
            }}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-[0.95rem] text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          >
            <option value="">{t("jobs.any")}</option>
            <option value="fixed">{t("jobs.fixedPrice")}</option>
            <option value="hourly">{t("jobs.hourly")}</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Min $"
            type="number"
            min="0"
            placeholder="0"
            value={f.min}
            onChange={(e) => set({ min: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && apply()}
          />
          <Input
            label="Max $"
            type="number"
            min="0"
            placeholder="Any"
            value={f.max}
            onChange={(e) => set({ max: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && apply()}
          />
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Button size="sm" onClick={() => apply()}>
          Search jobs
        </Button>
        {hasActive && (
          <Button size="sm" variant="ghost" onClick={clear}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
