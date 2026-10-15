"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "./Input";
import { Button } from "./Button";
import { SkillChip } from "./SkillChip";
import type { BudgetType, Job, Skill } from "@/lib/supabase/types";

type JobFormProps = {
  userId: string;
  allSkills: Skill[];
  initialJob?: Job;
  /** Where to go after saving. Defaults to /dashboard/jobs. */
  redirectTo?: string;
  submitLabel?: string;
  /** Called after a successful save instead of navigating. */
  onSaved?: () => void;
};

/** Create / edit a job. Saves through the browser Supabase client (RLS enforced). */
export function JobForm({
  userId,
  allSkills,
  initialJob,
  redirectTo = "/dashboard/jobs",
  submitLabel,
  onSaved,
}: JobFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialJob?.title ?? "");
  const [description, setDescription] = useState(initialJob?.description ?? "");
  const [budgetType, setBudgetType] = useState<BudgetType>(
    initialJob?.budget_type ?? "fixed"
  );
  const [budgetAmount, setBudgetAmount] = useState(
    initialJob ? String(initialJob.budget_amount) : ""
  );
  const [skills, setSkills] = useState<string[]>(initialJob?.skills_required ?? []);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const q = skillInput.trim().toLowerCase();
    if (q.length < 2) return [];
    const owned = new Set(skills.map((s) => s.toLowerCase()));
    return allSkills
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) &&
          !owned.has(s.name.toLowerCase())
      )
      .slice(0, 6);
  }, [skillInput, skills, allSkills]);

  const addSkill = (name: string) => {
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean) return;
    if (skills.some((s) => s.toLowerCase() === clean.toLowerCase())) return;
    setSkills((prev) => [...prev, clean]);
    setSkillInput("");
  };

  const save = async () => {
    setError(null);
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const amount = Number(budgetAmount);
    if (cleanTitle.length < 8) {
      setError("Please give your job a clear title (at least 8 characters).");
      return;
    }
    if (cleanDescription.length < 30) {
      setError("Please describe the job in a bit more detail (at least 30 characters).");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid budget amount greater than 0.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        client_id: userId,
        title: cleanTitle,
        description: cleanDescription,
        budget_type: budgetType,
        budget_amount: amount,
        skills_required: skills,
      };
      if (initialJob) {
        const { error: upErr } = await supabase
          .from("jobs")
          .update(payload)
          .eq("id", initialJob.id);
        if (upErr) throw upErr;
      } else {
        const { error: inErr } = await supabase.from("jobs").insert(payload);
        if (inErr) throw inErr;
      }
      if (onSaved) {
        onSaved();
      } else {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the job. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Input
        label="Job title"
        placeholder="e.g. Design a logo for my coffee brand"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
      />

      <div>
        <label
          htmlFor="jobform-description"
          className="mb-1.5 block text-sm font-semibold text-ink-900"
        >
          Description
        </label>
        <textarea
          id="jobform-description"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What needs to be done? Deliverables, timeline, anything the freelancer should know…"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[0.95rem] text-ink-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="jobform-budget-type"
            className="mb-1.5 block text-sm font-semibold text-ink-900"
          >
            Budget type
          </label>
          <div className="flex gap-2">
            {(["fixed", "hourly"] as BudgetType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBudgetType(t)}
                className={`h-11 flex-1 rounded-xl border px-4 text-sm font-semibold transition-colors ${
                  budgetType === t
                    ? "border-brand-500 bg-brand-500/10 text-brand-600"
                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                }`}
              >
                {t === "fixed" ? "Fixed price" : "Hourly rate"}
              </button>
            ))}
          </div>
        </div>
        <Input
          label={budgetType === "fixed" ? "Budget (USD)" : "Hourly rate (USD)"}
          type="number"
          min="1"
          step="any"
          placeholder={budgetType === "fixed" ? "500" : "25"}
          value={budgetAmount}
          onChange={(e) => setBudgetAmount(e.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor="jobform-skill"
          className="mb-1.5 block text-sm font-semibold text-ink-900"
        >
          Required skills
        </label>
        <div className="relative">
          <input
            id="jobform-skill"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill(suggestions[0]?.name ?? skillInput);
              }
            }}
            placeholder="Type a skill and press Enter"
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-[0.95rem] text-ink-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => addSkill(s.name)}
                    className="block w-full px-4 py-2 text-left text-sm text-ink-900 hover:bg-slate-50"
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((s) => (
              <SkillChip
                key={s}
                name={s}
                onRemove={() => setSkills((prev) => prev.filter((x) => x !== s))}
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : submitLabel ?? (initialJob ? "Save changes" : "Post job")}
      </Button>
    </div>
  );
}
