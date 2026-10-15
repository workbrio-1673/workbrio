"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "./Input";
import { Button } from "./Button";
import { SkillChip } from "./SkillChip";
import { SERVICE_CATEGORIES } from "@/lib/supabase/types";
import type { Service, Skill } from "@/lib/supabase/types";

type ServiceFormProps = {
  userId: string;
  allSkills: Skill[];
  initialService?: Service;
  /** Where to go after saving. Defaults to /services. */
  redirectTo?: string;
  submitLabel?: string;
  /** Called after a successful save instead of navigating. */
  onSaved?: () => void;
};

/** Create / edit a service (gig). Saves through the browser Supabase client (RLS enforced). */
export function ServiceForm({
  userId,
  allSkills,
  initialService,
  redirectTo = "/services",
  submitLabel,
  onSaved,
}: ServiceFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialService?.title ?? "");
  const [description, setDescription] = useState(initialService?.description ?? "");
  const [category, setCategory] = useState<string>(
    initialService?.category ?? "Design"
  );
  const [price, setPrice] = useState(
    initialService ? String(initialService.price) : ""
  );
  const [deliveryDays, setDeliveryDays] = useState(
    initialService ? String(initialService.delivery_days) : "3"
  );
  const [skills, setSkills] = useState<string[]>(initialService?.skills ?? []);
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
    const amount = Number(price);
    const days = Number(deliveryDays);
    if (cleanTitle.length < 8) {
      setError("Please give your service a clear title (at least 8 characters).");
      return;
    }
    if (cleanDescription.length < 30) {
      setError(
        "Please describe your service in a bit more detail (at least 30 characters)."
      );
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid starting price greater than 0.");
      return;
    }
    if (!Number.isInteger(days) || days <= 0) {
      setError("Please enter a valid delivery time in days (whole number).");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        freelancer_id: userId,
        title: cleanTitle,
        description: cleanDescription,
        category,
        price: amount,
        delivery_days: days,
        skills,
      };
      if (initialService) {
        const { error: upErr } = await supabase
          .from("services")
          .update(payload)
          .eq("id", initialService.id);
        if (upErr) throw upErr;
      } else {
        const { error: inErr } = await supabase.from("services").insert(payload);
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
        err instanceof Error
          ? err.message
          : "Could not save the service. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Input
        label="Service title"
        placeholder="e.g. I will design a modern logo for your brand"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
      />

      <div>
        <label
          htmlFor="serviceform-description"
          className="mb-1.5 block text-sm font-semibold text-ink-900"
        >
          Description
        </label>
        <textarea
          id="serviceform-description"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's included? Deliverables, revisions, what you need from the buyer…"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[0.95rem] text-ink-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="serviceform-category"
            className="mb-1.5 block text-sm font-semibold text-ink-900"
          >
            Category
          </label>
          <select
            id="serviceform-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-[0.95rem] text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          >
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Starting price (USD)"
          type="number"
          min="1"
          step="any"
          placeholder="50"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Input
          label="Delivery (days)"
          type="number"
          min="1"
          step="1"
          placeholder="3"
          value={deliveryDays}
          onChange={(e) => setDeliveryDays(e.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor="serviceform-skill"
          className="mb-1.5 block text-sm font-semibold text-ink-900"
        >
          Skills / tags
        </label>
        <div className="relative">
          <input
            id="serviceform-skill"
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
        {saving
          ? "Saving…"
          : submitLabel ?? (initialService ? "Save changes" : "Publish service")}
      </Button>
    </div>
  );
}
