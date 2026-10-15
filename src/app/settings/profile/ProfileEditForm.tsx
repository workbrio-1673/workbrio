"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { SkillChip } from "@/components/SkillChip";
import { AvatarUpload } from "@/components/AvatarUpload";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import type {
  PortfolioItem,
  Profile,
  Skill,
} from "@/lib/supabase/types";
import { toSkillList } from "@/lib/supabase/types";

type ProfileEditFormProps = {
  userId: string;
  initialProfile: Profile;
  initialSkills: Skill[];
  initialPortfolio: PortfolioItem[];
  allSkills: Skill[];
};

type PortfolioDraft = {
  id?: string;
  title: string;
  description: string;
  link_url: string;
  image_url: string;
};

const EMPTY_DRAFT: PortfolioDraft = {
  title: "",
  description: "",
  link_url: "",
  image_url: "",
};

/** Full profile editor: details, avatar, skills, portfolio. */
export function ProfileEditForm({
  userId,
  initialProfile,
  initialSkills,
  initialPortfolio,
  allSkills,
}: ProfileEditFormProps) {
  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [headline, setHeadline] = useState(initialProfile.headline ?? "");
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [location, setLocation] = useState(initialProfile.location ?? "");
  const [hourlyRate, setHourlyRate] = useState(
    initialProfile.hourly_rate != null ? String(initialProfile.hourly_rate) : ""
  );
  const [website, setWebsite] = useState(initialProfile.website ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialProfile.avatar_url
  );

  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [skillInput, setSkillInput] = useState("");

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(initialPortfolio);
  const [draft, setDraft] = useState<PortfolioDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const portfolioFileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const q = skillInput.trim().toLowerCase();
    if (q.length < 2) return [];
    const owned = new Set(skills.map((s) => s.name.toLowerCase()));
    return allSkills
      .filter((s) => s.name.toLowerCase().includes(q) && !owned.has(s.name.toLowerCase()))
      .slice(0, 6);
  }, [skillInput, skills, allSkills]);

  const addSkill = (name: string) => {
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean) return;
    if (skills.some((s) => s.name.toLowerCase() === clean.toLowerCase())) return;
    const existing = allSkills.find(
      (s) => s.name.toLowerCase() === clean.toLowerCase()
    );
    setSkills((prev) => [
      ...prev,
      existing ?? { id: `new:${clean}`, name: clean },
    ]);
    setSkillInput("");
  };

  const removeSkill = (id: string) =>
    setSkills((prev) => prev.filter((s) => s.id !== id));

  const uploadPortfolioImage = async (file: File | undefined) => {
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/portfolio/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setDraft((d) => ({ ...d, image_url: data.publicUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const savePortfolioItem = async () => {
    if (!draft.title.trim()) {
      setError("Give your portfolio item a title.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const payload = {
        profile_id: userId,
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        link_url: draft.link_url.trim() || null,
        image_url: draft.image_url.trim() || null,
      };

      if (editingId) {
        const { data, error: upErr } = await supabase
          .from("portfolio_items")
          .update(payload)
          .eq("id", editingId)
          .select()
          .single();
        if (upErr) throw upErr;
        setPortfolio((prev) => prev.map((p) => (p.id === editingId ? data : p)));
      } else {
        const { data, error: inErr } = await supabase
          .from("portfolio_items")
          .insert(payload)
          .select()
          .single();
        if (inErr) throw inErr;
        setPortfolio((prev) => [data, ...prev]);
      }
      setDraft(EMPTY_DRAFT);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the item.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setDraft({
      id: item.id,
      title: item.title,
      description: item.description ?? "",
      link_url: item.link_url ?? "",
      image_url: item.image_url ?? "",
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const deletePortfolioItem = async (item: PortfolioItem) => {
    if (!window.confirm(`Delete "${item.title}" from your portfolio?`)) return;
    setError(null);
    try {
      const supabase = createClient();
      const { error: delErr } = await supabase
        .from("portfolio_items")
        .delete()
        .eq("id", item.id);
      if (delErr) throw delErr;
      setPortfolio((prev) => prev.filter((p) => p.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the item.");
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedAt(null);
    try {
      const supabase = createClient();

      const rate = hourlyRate.trim() === "" ? null : Number(hourlyRate.trim());
      if (rate !== null && (Number.isNaN(rate) || rate < 0)) {
        throw new Error("Hourly rate must be a positive number.");
      }

      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          headline: headline.trim() || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          hourly_rate: rate,
          website: website.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq("id", userId);
      if (profErr) throw profErr;

      // Sync skills: ensure every named skill exists, then replace the links.
      const skillIds: string[] = [];
      for (const s of skills) {
        if (s.id.startsWith("new:")) {
          const { data, error: insErr } = await supabase
            .from("skills")
            .insert({ name: s.name })
            .select("id")
            .single();
          if (insErr) {
            // Someone else may have added it a moment ago — fetch it.
            const { data: found } = await supabase
              .from("skills")
              .select("id")
              .ilike("name", s.name)
              .single();
            if (!found) throw insErr;
            skillIds.push(found.id);
          } else {
            skillIds.push(data.id);
          }
        } else {
          skillIds.push(s.id);
        }
      }

      const { error: delErr } = await supabase
        .from("profile_skills")
        .delete()
        .eq("profile_id", userId);
      if (delErr) throw delErr;

      if (skillIds.length > 0) {
        const { error: linkErr } = await supabase.from("profile_skills").insert(
          skillIds.map((skill_id) => ({ profile_id: userId, skill_id }))
        );
        if (linkErr) throw linkErr;
      }

      // Refresh local skill ids so subsequent saves are clean.
      const { data: fresh } = await supabase
        .from("profile_skills")
        .select("skills(id, name)")
        .eq("profile_id", userId);
      setSkills(toSkillList(fresh));

      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={saveProfile} className="space-y-8">
      {/* Avatar + name */}
      <div className="flex items-center gap-6">
        <AvatarUpload
          userId={userId}
          currentUrl={avatarUrl}
          onUploaded={setAvatarUrl}
        />
        <p className="max-w-xs text-sm text-slate-500">
          Click your photo to upload a new one. JPG, PNG, WebP or GIF up to
          5&nbsp;MB.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Full name"
          placeholder="Alex Morgan"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          label="Location"
          placeholder="Berlin, Germany"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <Input
        label="Headline"
        placeholder="UI/UX Designer crafting friendly products"
        value={headline}
        onChange={(e) => setHeadline(e.target.value)}
        hint="One line under your name — make it count."
      />

      <div>
        <label
          htmlFor="input-bio"
          className="mb-1.5 block text-sm font-semibold text-ink-900"
        >
          Bio
        </label>
        <textarea
          id="input-bio"
          rows={5}
          placeholder="Tell clients who you are, what you do best, and how you work…"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[0.95rem] text-ink-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Hourly rate (USD)"
          type="number"
          min="0"
          step="0.5"
          placeholder="45"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          hint="Freelancers only — shown on your public profile."
        />
        <Input
          label="Website"
          type="url"
          placeholder="https://your-portfolio.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {/* Skills */}
      <div>
        <span className="mb-1.5 block text-sm font-semibold text-ink-900">
          Skills
        </span>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <SkillChip key={s.id} name={s.name} onRemove={() => removeSkill(s.id)} />
          ))}
          {skills.length === 0 && (
            <p className="text-sm text-slate-400">No skills yet — add your first below.</p>
          )}
        </div>
        <div className="relative mt-3 flex gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill(skillInput);
              }
            }}
            placeholder="Type a skill and press Enter…"
            list="skill-suggestions"
            className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-[0.95rem] text-ink-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          />
          <datalist id="skill-suggestions">
            {suggestions.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
          <Button type="button" variant="secondary" onClick={() => addSkill(skillInput)}>
            Add
          </Button>
        </div>
      </div>

      {/* Portfolio */}
      <div>
        <span className="mb-1.5 block text-sm font-semibold text-ink-900">
          Portfolio
        </span>
        <PortfolioGrid
          items={portfolio}
          editable
          onEdit={startEdit}
          onDelete={deletePortfolioItem}
        />

        <div className="mt-5 rounded-2xl bg-slate-50 p-5">
          <h3 className="font-bold text-ink-900">
            {editingId ? "Edit portfolio item" : "Add a portfolio item"}
          </h3>
          <div className="mt-4 space-y-4">
            <Input
              label="Title"
              placeholder="E-commerce checkout redesign"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
            <div>
              <label
                htmlFor="input-portfolio-desc"
                className="mb-1.5 block text-sm font-semibold text-ink-900"
              >
                Description
              </label>
              <textarea
                id="input-portfolio-desc"
                rows={3}
                placeholder="What did you build, and what was the result?"
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[0.95rem] text-ink-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Link (optional)"
                type="url"
                placeholder="https://…"
                value={draft.link_url}
                onChange={(e) => setDraft((d) => ({ ...d, link_url: e.target.value }))}
              />
              <div>
                <span className="mb-1.5 block text-sm font-semibold text-ink-900">
                  Cover image (optional)
                </span>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={uploadingImage}
                    onClick={() => portfolioFileRef.current?.click()}
                  >
                    {uploadingImage ? "Uploading…" : "Upload image"}
                  </Button>
                  {draft.image_url && <span className="text-xs text-emerald-600">✓ Image attached</span>}
                </div>
                <input
                  ref={portfolioFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => uploadPortfolioImage(e.target.files?.[0])}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={savePortfolioItem} disabled={saving}>
                {editingId ? "Save changes" : "Add to portfolio"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setDraft(EMPTY_DRAFT);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {savedAt && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✓ Profile saved at {savedAt}.{" "}
          <Link href={`/profile/${userId}`} className="font-semibold underline">
            View your public profile
          </Link>
        </p>
      )}

      <div className="flex items-center gap-3 border-t border-slate-200 pt-6">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
        <Button href={`/profile/${userId}`} variant="secondary">
          View public profile
        </Button>
      </div>
    </form>
  );
}
