"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { JobCard } from "@/components/JobCard";
import { useLanguage } from "@/components/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n/languages";
import { isPakistaniJob } from "@/lib/jobs";
import type { JobWithClient } from "@/lib/supabase/types";
import { salaryLabel, timeAgo } from "@/lib/supabase/types";

/** ————————————————————————————————
 *  Homepage in the front-page design concept style:
 *  Plus Jakarta Sans + Fraunces, green (#0A7A5E) palette,
 *  announcement bar, hero search, category grid, live jobs.
 *  Every job and number is real Supabase data — nothing invented.
 *  ———————————————————————————————— */

/** Browse categories. Keywords match against a job's title,
 * description, skills and company (lowercased). Deliberately
 * phrase-based — bare "ai"/"ui"/"app" would false-match words
 * like "available", "building" or "apply". */
const CATEGORIES: {
  id: string;
  label: string;
  emoji: string;
  sub: string;
  keywords: string[];
}[] = [
  {
    id: "dev",
    label: "Development & IT",
    emoji: "💻",
    sub: "Web · Apps · Shopify · WordPress",
    keywords: [
      "develop", "react", "shopify", "wordpress", "software", "web",
      "frontend", "backend", "full stack", "python", "javascript", "node",
      "php", "laravel", "html", "css", "programmer", "coding", "network",
      "isp", "system", "technical support", "data engineer", "typescript",
    ],
  },
  {
    id: "design",
    label: "Design & Creative",
    emoji: "🎨",
    sub: "Logo · Branding · UI/UX",
    keywords: [
      "design", "logo", "brand", "ui/ux", "ui design", "ux design",
      "graphic", "illustrator", "figma", "draftsman", "autocad", "drawing",
      "revit",
    ],
  },
  {
    id: "video",
    label: "Video & AI",
    emoji: "🎬",
    sub: "Editing · AI Videos · Animation",
    keywords: [
      "video", "youtube", "shorts", "reels", "animation", "ai video",
      "ai engineer", "ai trainer", "llm", "multi-agent", "adobe premiere",
      "davinci", "ai tools",
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    emoji: "📈",
    sub: "Social Media · Ads · SEO",
    keywords: [
      "marketing", "seo", "google ads", "meta ads", "social media",
      "digital marketing", "sales", "e-commerce", "ecommerce", "advertis",
    ],
  },
  {
    id: "writing",
    label: "Writing",
    emoji: "✍️",
    sub: "Blogs · Copywriting · Translation",
    keywords: [
      "writing", "writer", "blog", "copywriting", "content", "translation",
      "english", "teaching", "teacher", "instructor", "proofreading",
    ],
  },
  {
    id: "data",
    label: "Data & Admin",
    emoji: "📊",
    sub: "Excel · Virtual Assistant",
    keywords: [
      "data", "excel", "admin", "virtual assistant", "analyst", "quality",
      "chemist", "laboratory", "storekeeper", "inventory", "accounting",
      "bookkeeping", "manager", "management", "operations", "team lead",
    ],
  },
  {
    id: "music",
    label: "Music & Audio",
    emoji: "🎵",
    sub: "Voice-over · Mixing",
    keywords: [
      "music", "audio", "voice", "voice-over", "voiceover", "podcast",
      "mixing", "singer",
    ],
  },
  {
    id: "all",
    label: "All Jobs",
    emoji: "🌍",
    sub: "Every category, one place",
    keywords: [],
  },
];

/** Popular searches — every chip matches at least one real live job. */
const POPULAR_SEARCHES = [
  { emoji: "🎬", label: "Video Editing", q: "video editing" },
  { emoji: "🔍", label: "SEO", q: "seo" },
  { emoji: "🩺", label: "Nursing", q: "nursing" },
  { emoji: "🎓", label: "Teaching", q: "teaching" },
  { emoji: "📊", label: "Data", q: "data" },
];

function jobHaystack(job: JobWithClient): string {
  return [
    job.title,
    job.description,
    job.company_name ?? "",
    job.location ?? "",
    job.skills_required.join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function categoryMatches(job: JobWithClient, catId: string): boolean {
  if (catId === "all") return true;
  const cat = CATEGORIES.find((c) => c.id === catId);
  if (!cat) return true;
  const hay = jobHaystack(job);
  return cat.keywords.some((k) => hay.includes(k));
}

/** Every query word must match the start of a word in the job
 * (so "ai" matches the skill "AI" but not "available"). */
function queryMatches(job: JobWithClient, query: string): boolean {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (terms.length === 0) return true;
  const words = jobHaystack(job).split(/[^a-z0-9]+/).filter(Boolean);
  return terms.every((term) => words.some((w) => w.startsWith(term)));
}

const FEATURES = [
  {
    icon: "👤",
    title: "Rich Profiles",
    text: "Showcase your skills, portfolio, hourly rate and verified reviews — your professional identity, built for freelancers.",
  },
  {
    icon: "💼",
    title: "Jobs & Proposals",
    text: "Clients post projects with clear budgets. Freelancers apply with a cover note and bid. Hiring, minus the chaos.",
  },
  {
    icon: "📰",
    title: "Professional Feed",
    text: "Share wins, insights and work in progress. Like and comment — a LinkedIn-style feed for the freelance world.",
  },
  {
    icon: "💬",
    title: "Realtime Messaging",
    text: "Chat one-to-one with clients or freelancers, tied to each job. No lost emails, no missed DMs.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Create your profile",
    text: "Sign up free as a freelancer or a client. Add your skills, photo and portfolio in minutes.",
  },
  {
    n: "2",
    title: "Connect & apply",
    text: "Browse jobs that match your skills, send proposals — or post a project and review applicants.",
  },
  {
    n: "3",
    title: "Work with brio",
    text: "Chat, collaborate and deliver great work. Build your reputation with every five-star review.",
  },
];

/** Upwork-style dual-audience steps: translation keys per audience. */
const HOW_STEPS = {
  client: [
    { title: "landing.howC1t", text: "landing.howC1d" },
    { title: "landing.howC2t", text: "landing.howC2d" },
    { title: "landing.howC3t", text: "landing.howC3d" },
  ],
  freelancer: [
    { title: "landing.howF1t", text: "landing.howF1d" },
    { title: "landing.howF2t", text: "landing.howF2d" },
    { title: "landing.howF3t", text: "landing.howF3d" },
  ],
};

/** Workbrio vs competitors — translation keys per row. */
const COMPARE_ROWS = [
  {
    label: "landing.cmpFee",
    us: "landing.cmpFree",
    fiverr: "landing.cmp20",
    upwork: "landing.cmp10",
    linkedin: "landing.cmpPaid",
  },
  {
    label: "landing.cmpPost",
    us: "landing.cmpFree",
    fiverr: "landing.cmpNa",
    upwork: "landing.cmpFree",
    linkedin: "landing.cmpPaid",
  },
  {
    label: "landing.cmpLang",
    us: "landing.cmp10lang",
    fiverr: "landing.cmpFew",
    upwork: "landing.cmpFew",
    linkedin: "landing.cmpMany",
  },
  {
    label: "landing.cmpAll",
    us: "landing.cmpYes",
    fiverr: "landing.cmpNo",
    upwork: "landing.cmpNo",
    linkedin: "landing.cmpNo",
  },
];

const FAQS = [
  {
    q: "Is Workbrio free to join?",
    a: "Yes — signing up, creating your profile, browsing jobs and sending proposals are all free. We'll always keep a generous free plan.",
  },
  {
    q: "Who can join Workbrio?",
    a: "Freelancers and clients from anywhere in the world. Whether you're a designer in Berlin, a developer in Lahore, or a founder in Toronto — you're welcome.",
  },
  {
    q: "How do I find work as a freelancer?",
    a: "Complete your profile with your skills, portfolio and rate, then browse open jobs, filter by what fits you, and send a proposal with your cover note and bid.",
  },
  {
    q: "How do I hire a freelancer?",
    a: "Post your project with a clear budget and the skills you need. Review applicants in your inbox, chat with the best fits, and accept the proposal you like.",
  },
  {
    q: "How do payments work?",
    a: "Workbrio connects you and keeps the conversation in one place. For now, you agree payment terms directly with your client or freelancer — built-in escrow is on our roadmap.",
  },
  {
    q: "Is my information safe?",
    a: "Your profile is public by design so clients can find you — and you control exactly what it shows. Anything abusive can be reported with one click, and we review every report.",
  },
];

export function LandingContent({
  allPakistani,
  allInternational,
  openJobsCount,
  memberCount,
}: {
  /** All live jobs, already split. Empty when Supabase is unreachable. */
  allPakistani: JobWithClient[];
  allInternational: JobWithClient[];
  /** Real live counts for the hero stats. Zero = do not show that stat. */
  openJobsCount: number;
  memberCount: number;
}) {
  const { t } = useLanguage();
  const [howAud, setHowAud] = useState<"client" | "freelancer">("client");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const allJobs = useMemo(
    () => [...allPakistani, ...allInternational],
    [allPakistani, allInternational]
  );

  // Live counts per category, computed from the real jobs.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allJobs.length };
    for (const c of CATEGORIES) {
      if (c.id === "all") continue;
      counts[c.id] = allJobs.filter((j) => categoryMatches(j, c.id)).length;
    }
    return counts;
  }, [allJobs]);

  const filterActive = category !== "all" || query.trim() !== "";

  const filteredJobs = useMemo(
    () =>
      allJobs.filter(
        (j) => categoryMatches(j, category) && queryMatches(j, query)
      ),
    [allJobs, category, query]
  );

  // Default view: 4 + 4. Filtering: every match, still split.
  const shownPakistani = filterActive
    ? filteredJobs.filter(isPakistaniJob)
    : allPakistani.slice(0, 4);
  const shownInternational = filterActive
    ? filteredJobs.filter((j) => !isPakistaniJob(j))
    : allInternational.slice(0, 4);

  // Newest live job, for the hero feature card.
  const newestJob = useMemo(
    () =>
      allJobs.reduce<JobWithClient | null>(
        (best, j) =>
          !best || j.created_at > best.created_at ? j : best,
        null
      ),
    [allJobs]
  );

  const scrollToJobs = () =>
    document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" });

  const pickCategory = (catId: string) => {
    setCategory(catId);
    scrollToJobs();
  };

  const runSearch = (q: string, catId: string) => {
    setQuery(q);
    setCategory(catId);
    scrollToJobs();
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
  };

  // Hero stats: live counts first (only when we truly know them),
  // then the policy facts that are always true.
  const stats = [
    ...(openJobsCount > 0
      ? [{ value: String(openJobsCount), label: "Open jobs" }]
      : []),
    ...(memberCount > 0
      ? [{ value: String(memberCount), label: "Members" }]
      : []),
    { value: "100%", label: "Free forever" },
    { value: "0%", label: "Commission" },
    { value: "10", label: "Languages incl. Urdu" },
  ];

  const activeCategoryLabel =
    CATEGORIES.find((c) => c.id === category)?.label ?? "All Jobs";

  return (
    <div className="bg-mist font-jakarta text-ink-900">
      {/* ————— ANNOUNCEMENT BAR ————— */}
      <div className="bg-ink-950 px-4 py-2.5 text-center text-[13.5px] font-semibold text-white">
        ✦ <span className="font-extrabold text-emerald-300">100% FREE — 0% COMMISSION</span>
        <span className="opacity-75"> · No fees for freelancers. No fees for clients. Ever.</span>
      </div>

      <Navbar />

      {/* ————— HERO ————— */}
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16">
        <div className="grid items-center gap-11 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-pine-500/25 bg-pine-100 px-3.5 py-1.5 text-[13px] font-extrabold text-pine-700">
              <span className="inline-block h-2 w-2 rounded-full bg-pine-500" />
              International Freelancers Network
            </p>
            <h1 className="mt-5 font-fraunces text-[clamp(38px,5.2vw,58px)] font-extrabold leading-[0.98] tracking-[-0.02em]">
              Freelance work with{" "}
              <span className="text-pine-600">0% commission.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[17.5px] leading-relaxed text-slate-600">
              Post a job or find work —{" "}
              <b className="text-ink-900">open to clients and freelancers worldwide</b>.
              Chat directly, hire directly, and{" "}
              <b className="text-ink-900">keep every dollar you earn</b> — Workbrio
              takes nothing.
            </p>

            {/* Hero search — filters the real live jobs below. */}
            <form
              className="mt-6 flex gap-2 rounded-2xl border-[1.5px] border-slate-200 bg-white p-2 shadow-[0_10px_30px_rgba(10,60,45,0.08)]"
              onSubmit={(e) => {
                e.preventDefault();
                scrollToJobs();
              }}
            >
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try “video editor”, “nurse”, “SEO”…"
                aria-label="Search jobs"
                className="min-w-0 flex-1 bg-transparent px-3 text-[15.5px] text-ink-900 outline-none placeholder:text-slate-400"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Category"
                className="max-w-[150px] rounded-[10px] bg-slate-100 px-2.5 text-sm font-bold text-ink-900 outline-none"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="pine">
                Search Jobs
              </Button>
            </form>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-500">Popular:</span>
              {POPULAR_SEARCHES.map((chip) => (
                <button
                  key={chip.q}
                  type="button"
                  onClick={() => runSearch(chip.q, "all")}
                  className="min-h-9 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-bold transition hover:border-pine-500 hover:text-pine-600"
                >
                  {chip.emoji} {chip.label}
                </button>
              ))}
            </div>

            <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5"
                >
                  <dd className="text-xl font-extrabold tracking-[-0.02em]">{s.value}</dd>
                  <dt className="mt-0.5 text-xs font-semibold leading-snug text-slate-500">
                    {s.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero visual — newest REAL job + honest escrow note. */}
          <div>
            {newestJob ? (
              <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(10,60,45,0.08)]">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-pine-600">
                  Newest job
                </p>
                <h3 className="mt-2 text-lg font-extrabold leading-snug">
                  <Link href={`/jobs/${newestJob.id}`} className="hover:text-pine-600">
                    {newestJob.title}
                  </Link>
                </h3>
                <p className="mt-1.5 text-sm font-semibold text-slate-500">
                  {newestJob.company_name ? `${newestJob.company_name} · ` : ""}
                  {newestJob.location ?? "Remote"} · {timeAgo(newestJob.created_at)}
                </p>
                {newestJob.skills_required.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {newestJob.skills_required.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-200 pt-4">
                  <p className="text-lg font-extrabold">{salaryLabel(newestJob)}</p>
                  <Link
                    href={`/jobs/${newestJob.id}`}
                    className="text-sm font-extrabold text-pine-600 hover:text-pine-700"
                  >
                    View job →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500">
                New jobs are added every day — check back soon.
              </div>
            )}

            <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-soft p-4 text-[13.5px] font-semibold leading-relaxed text-ink-900">
              <span aria-hidden>🛡️</span>
              <span>
                <b>Escrow Protection — Coming Soon.</b> Planned: payments stay
                safe, fee $0. Escrow does not exist yet — for now, agree payment
                terms directly with your client or freelancer.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ————— BROWSE BY CATEGORY ————— */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="mb-5">
          <h2 className="font-fraunces text-[clamp(26px,3.4vw,34px)] font-extrabold leading-[1.08] tracking-[-0.025em]">
            Browse by category
          </h2>
          <p className="mt-2 max-w-xl text-[15.5px] text-slate-600">
            One click — that category&rsquo;s live jobs, with real counts.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pickCategory(c.id)}
              className={`rounded-2xl border bg-white p-[18px] text-left transition hover:-translate-y-0.5 hover:border-pine-500 hover:shadow-lg ${
                category === c.id
                  ? "border-pine-500 ring-2 ring-pine-500/30"
                  : "border-slate-200"
              }`}
            >
              <span className="block text-2xl" aria-hidden>{c.emoji}</span>
              <span className="mt-2.5 block text-[15.5px] font-extrabold">{c.label}</span>
              <span className="mt-0.5 block text-xs font-semibold text-slate-500">{c.sub}</span>
              <span className="mt-2.5 inline-block rounded-full bg-pine-100 px-2.5 py-1 text-xs font-extrabold text-pine-700">
                {categoryCounts[c.id] ?? 0}{" "}
                {(categoryCounts[c.id] ?? 0) === 1 ? "job" : "jobs"}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ————— LATEST JOBS (real, live — no sample jobs) ————— */}
      <section id="jobs" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="font-fraunces text-[clamp(26px,3.4vw,34px)] font-extrabold leading-[1.08] tracking-[-0.025em]">
              Latest jobs — open to everyone
            </h2>
            <p className="mt-2 max-w-xl text-[15.5px] text-slate-600">
              Real jobs from Pakistan and around the world — new ones added
              every day. No account needed to look.
            </p>
          </div>
          <Link href="/jobs" className="whitespace-nowrap text-sm font-extrabold text-pine-600 hover:text-pine-700">
            View all jobs →
          </Link>
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-pine-100 p-4 text-sm font-semibold leading-relaxed">
          <span aria-hidden>👀</span>
          <span>
            <b>Browse without signing in.</b> Found one you like? Create a free
            account and apply in one click — no paywall, no hidden steps.
          </span>
        </div>

        {/* Category filter chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`min-h-10 rounded-full px-4 py-2.5 text-[13.5px] font-extrabold transition ${
                category === c.id
                  ? "bg-ink-900 text-white"
                  : "border border-slate-200 bg-white hover:border-pine-500 hover:text-pine-600"
              }`}
            >
              {c.id === "all" ? "All Jobs" : `${c.emoji} ${c.label}`} ({categoryCounts[c.id] ?? 0})
            </button>
          ))}
        </div>

        {filterActive && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <p className="font-semibold text-slate-600">
              {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}
              {query.trim() !== "" && (
                <> matching &ldquo;{query.trim()}&rdquo;</>
              )}
              {category !== "all" && <> in {activeCategoryLabel}</>}
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-extrabold hover:border-pine-500 hover:text-pine-600"
            >
              Clear filters ✕
            </button>
          </div>
        )}

        {filteredJobs.length === 0 && filterActive ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-4xl" aria-hidden>🔍</p>
            <h3 className="mt-3 text-lg font-extrabold">No jobs match this search</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Try different keywords or another category — new real jobs are
              added every day.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-full bg-pine-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-pine-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="text-xl font-extrabold">🇵🇰 Pakistani Jobs</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {shownPakistani.length} {shownPakistani.length === 1 ? "job" : "jobs"}
                  {!filterActive && allPakistani.length > 4 && ` of ${allPakistani.length}`}
                </span>
              </div>
              {shownPakistani.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {shownPakistani.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
                  {filterActive
                    ? "No Pakistani jobs match this search — try clearing the filters."
                    : "No Pakistani jobs right now — check back soon."}
                </p>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="text-xl font-extrabold">🌍 International Jobs</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {shownInternational.length} {shownInternational.length === 1 ? "job" : "jobs"}
                  {!filterActive && allInternational.length > 4 && ` of ${allInternational.length}`}
                </span>
              </div>
              {shownInternational.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {shownInternational.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
                  {filterActive
                    ? "No international jobs match this search — try clearing the filters."
                    : "No international jobs right now — check back soon."}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-10 text-center">
          <Button href="/jobs" size="lg" variant="pine">
            {t("feed.browseJobs")}
          </Button>
        </div>
      </section>

      {/* ————— FEATURES ————— */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-pine-600">
            Everything you need
          </p>
          <h2 className="mt-3 font-fraunces text-4xl font-extrabold tracking-tight">
            One network for the whole freelance journey
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title} hover>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-pine-100 text-2xl">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ————— HOW IT WORKS ————— */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-pine-600">
            {t("landing.howKicker")}
          </p>
          <h2 className="mt-3 font-fraunces text-4xl font-extrabold tracking-tight">
            {t("landing.howTitle")}
          </h2>
          <div className="mt-8 inline-flex rounded-full border border-slate-200 bg-white p-1">
            {(["client", "freelancer"] as const).map((aud) => (
              <button
                key={aud}
                type="button"
                onClick={() => setHowAud(aud)}
                className={`rounded-full px-6 py-2.5 text-sm font-bold transition ${
                  howAud === aud
                    ? "bg-pine-600 text-white shadow"
                    : "text-slate-500 hover:text-ink-900"
                }`}
              >
                {t(`landing.howTab${aud === "client" ? "Client" : "Freelancer"}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {HOW_STEPS[howAud].map((s, i) => (
            <div
              key={s.title}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pine-600 text-lg font-extrabold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-xl font-bold">{t(s.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(s.text)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ————— EARLY COMMUNITY (honest: no fake testimonials) ————— */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-[22px] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm sm:px-12">
          <p className="text-sm font-bold uppercase tracking-widest text-pine-600">
            Just launched
          </p>
          <h2 className="mt-3 font-fraunces text-4xl font-extrabold tracking-tight">
            Join our early community
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Workbrio is brand new — be among the first freelancers and clients
            shaping a 100% free professional network. Your story could be
            featured here soon.
          </p>
          <div className="mt-8">
            <Button href="/signup" variant="pine" size="lg">
              Get started — it&rsquo;s free
            </Button>
          </div>
        </div>
      </section>

      {/* ————— WHY WORKBRIO (comparison) ————— */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-pine-600">
            {t("landing.whyKicker")}
          </p>
          <h2 className="mt-3 font-fraunces text-4xl font-extrabold tracking-tight">
            {t("landing.whyTitle")}
          </h2>
        </div>
        <div className="mt-12 overflow-x-auto rounded-[20px] border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 font-bold text-slate-500"></th>
                <th className="px-6 py-4 text-center">
                  <span className="inline-block rounded-full bg-pine-600 px-4 py-1.5 font-extrabold text-white">
                    Workbrio
                  </span>
                </th>
                <th className="px-6 py-4 text-center font-bold text-slate-500">Fiverr</th>
                <th className="px-6 py-4 text-center font-bold text-slate-500">Upwork</th>
                <th className="px-6 py-4 text-center font-bold text-slate-500">LinkedIn</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((r) => (
                <tr key={r.label} className="border-t border-slate-100">
                  <td className="px-6 py-4 font-semibold text-ink-900">{t(r.label)}</td>
                  <td className="bg-pine-50/60 px-6 py-4 text-center text-lg font-extrabold text-pine-600">
                    {t(r.us)}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-500">{t(r.fiverr)}</td>
                  <td className="px-6 py-4 text-center text-slate-500">{t(r.upwork)}</td>
                  <td className="px-6 py-4 text-center text-slate-500">{t(r.linkedin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">{t("landing.whyNote")}</p>
      </section>

      {/* ————— LANGUAGES ————— */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-fraunces text-[clamp(26px,3.4vw,34px)] font-extrabold leading-[1.08] tracking-[-0.025em]">
            International — and Urdu too 🇵🇰
          </h2>
          <p className="mt-2 max-w-xl text-[15.5px] text-slate-600">
            10 languages. Urdu front and centre for Pakistani freelancers.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <span
              key={lang.code}
              className={`rounded-full border bg-white px-4 py-2.5 text-sm font-bold ${
                lang.code === "ur"
                  ? "border-pine-500 bg-pine-100 text-pine-700"
                  : "border-slate-200 text-ink-900"
              }`}
            >
              {lang.nativeName}
              {lang.code === "ur" ? " — Urdu ★" : ""}
            </span>
          ))}
        </div>
      </section>

      {/* ————— FAQ ————— */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-pine-600">
            Questions, answered
          </p>
          <h2 className="mt-3 font-fraunces text-4xl font-extrabold tracking-tight">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-slate-200 bg-white px-6 py-4 open:shadow-sm"
            >
              <summary className="cursor-pointer list-none font-bold text-ink-900 marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {f.q}
                  <span
                    aria-hidden
                    className="text-xl text-pine-600 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ————— CTA ————— */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="rounded-[22px] bg-pine-600 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="mx-auto max-w-2xl font-fraunces text-4xl font-extrabold tracking-tight">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-emerald-100">{t("cta.subtitle")}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-bold text-pine-700 shadow-lg transition hover:brightness-95"
            >
              {t("cta.join")}
            </Link>
          </div>
          <p className="mt-4 text-[13px] font-semibold text-emerald-100">
            No credit card · No commission · Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
