"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "./Input";
import { Button } from "./Button";
import { SkillChip } from "./SkillChip";
import type { BudgetType, Job, JobType, Skill } from "@/lib/supabase/types";
import { JOB_TYPES, JOB_TYPE_LABELS } from "@/lib/supabase/types";

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
    initialJob?.budget_amount != null ? String(initialJob.budget_amount) : ""
  );
  /* M6c: employer-stated pay as free text (a range a single number can't
     hold). Optional — empty stays null and the job shows "Salary not listed". */
  const [salaryText, setSalaryText] = useState(initialJob?.salary_text ?? "");
  /* M6 job-board fields — all optional; empty for classic freelance gigs. */
  const [company, setCompany] = useState(initialJob?.company_name ?? "");
  const [location, setLocation] = useState(initialJob?.location ?? "");
  const [jobType, setJobType] = useState<JobType | "">(
    initialJob?.job_type ?? ""
  );
  const [applyUrl, setApplyUrl] = useState(initialJob?.apply_url ?? "");
  const [deadline, setDeadline] = useState(
    initialJob?.deadline ? initialJob.deadline.slice(0, 10) : ""
  );
  const [source, setSource] = useState(initialJob?.source_name ?? "");
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
    const cleanCompany = company.trim();
    const cleanLocation = location.trim();
    const cleanApplyUrl = applyUrl.trim();
    const cleanSource = source.trim();
    /* Budget is optional: leave blank when the pay is not published —
       it shows as "Salary not listed", never an invented number. */
    const budgetText = budgetAmount.trim();
    const amount = budgetText === "" ? null : Number(budgetText);
    const cleanSalaryText = salaryText.trim();
    if (cleanTitle.length < 8) {
      setError("Please give your job a clear title (at least 8 characters).");
      return;
    }
    if (cleanDescription.length < 30) {
      setError("Please describe the job in a bit more detail (at least 30 characters).");
      return;
    }
    if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
      setError("Please enter a valid budget amount greater than 0, or leave it blank.");
      return;
    }
    if (
      cleanApplyUrl !== "" &&
      !/^https?:\/\/.+/.test(cleanApplyUrl)
    ) {
      setError("The apply link must start with http:// or https://");
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
        salary_text: cleanSalaryText === "" ? null : cleanSalaryText,
        skills_required: skills,
        company_name: cleanCompany === "" ? null : cleanCompany,
        location: cleanLocation === "" ? null : cleanLocation,
        job_type: jobType === "" ? null : jobType,
        apply_url: cleanApplyUrl === "" ? null : cleanApplyUrl,
        deadline: deadline === "" ? null : deadline,
        source_name: cleanSource === "" ? null : cleanSource,
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

      {/* Job-board details — for real employment jobs (Pakistan + international).
          All optional: leave empty for a classic freelance gig. */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-extrabold text-ink-900">
          Employment job details <span className="font-semibold text-slate-400">(optional)</span>
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          For a real job from an employer: add the company, place, apply link
          and last date. Only use real, published details — never invent a
          salary, deadline or link.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label="Company"
            placeholder="e.g. National Bank of Pakistan"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            maxLength={120}
          />
          <Input
            label="Location"
            placeholder="e.g. Lahore, Pakistan or Remote — Worldwide"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={120}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="jobform-type"
              className="mb-1.5 block text-sm font-semibold text-ink-900"
            >
              Job type
            </label>
            <select
              id="jobform-type"
              value={jobType}
              onChange={(e) => setJobType(e.target.value as JobType | "")}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-[0.95rem] text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            >
              <option value="">Not specified</option>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {JOB_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Last date to apply"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <Input
            label="Apply link"
            type="url"
            placeholder="https://… (the employer's real application page)"
            value={applyUrl}
            onChange={(e) => setApplyUrl(e.target.value)}
            maxLength={500}
          />
        </div>

        <div className="mt-4">
          <Input
            label="Source"
            placeholder="e.g. Rozee.pk — where this job was found"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            maxLength={120}
          />
        </div>
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
          label={
            budgetType === "fixed"
              ? "Budget (USD) — optional"
              : "Hourly rate (USD) — optional"
          }
          type="number"
          min="1"
          step="any"
          placeholder={budgetType === "fixed" ? "500" : "25"}
          value={budgetAmount}
          onChange={(e) => setBudgetAmount(e.target.value)}
        />
      </div>
      <p className="-mt-2 text-xs text-slate-500">
        Leave the budget blank when the pay is not published — the job will
        show “Salary not listed”.
      </p>

      <Input
        label="Salary (as stated, e.g. £32,073–£39,043 / year) — optional"
        placeholder="Copy the pay exactly as the employer states it"
        value={salaryText}
        onChange={(e) => setSalaryText(e.target.value)}
        maxLength={120}
      />
      <p className="-mt-2 text-xs text-slate-500">
        Use this when the pay is a range or in another currency — a single
        number can&apos;t hold it. Leave blank when no pay is published.
      </p>

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
