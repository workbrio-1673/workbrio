"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { JobCard } from "@/components/JobCard";
import { useLanguage } from "@/components/LanguageProvider";
import type { JobWithClient } from "@/lib/supabase/types";

/** Fiverr-style popular service categories → job search. */
const POPULAR_CATEGORIES = [
  { emoji: "🎨", skill: "Design" },
  { emoji: "💻", skill: "Development" },
  { emoji: "✍️", skill: "Writing" },
  { emoji: "📱", skill: "Marketing" },
  { emoji: "🎬", skill: "Video Editing" },
  { emoji: "🌐", skill: "Translation" },
];

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
  latestPakistani,
  latestInternational,
  openJobsCount,
  memberCount,
}: {
  /** Latest live jobs, already split. Empty when Supabase is unreachable. */
  latestPakistani: JobWithClient[];
  latestInternational: JobWithClient[];
  /** Real live counts for the hero stats. Zero = do not show that stat. */
  openJobsCount: number;
  memberCount: number;
}) {
  const { t } = useLanguage();
  const [howAud, setHowAud] = useState<"client" | "freelancer">("client");

  // Hero stats: live counts first (only when we truly know them),
  // then the two policy facts that are always true.
  const stats = [
    ...(openJobsCount > 0
      ? [{ value: String(openJobsCount), label: "Open jobs" }]
      : []),
    ...(memberCount > 0
      ? [{ value: String(memberCount), label: "Members" }]
      : []),
    { value: "100%", label: "Free forever" },
    { value: "0%", label: "Commission" },
  ];
  return (
    <>
      <Navbar />

      {/* ————— HERO ————— */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 10%, rgba(46,124,246,.35), transparent 70%), radial-gradient(50% 45% at 85% 20%, rgba(236,72,153,.28), transparent 70%), radial-gradient(45% 40% at 60% 90%, rgba(139,92,246,.30), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-300">
            <span className="inline-block h-2 w-2 rounded-full bg-gradient-brand" />
            {t("hero.eyebrow")}
          </p>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
            Work with <span className="text-gradient">Brio!</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            {t("hero.subtitle")}
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1.5 text-sm font-bold text-emerald-300">
            <span aria-hidden>✅</span>
            {t("hero.freeBadge")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/jobs" size="lg">
              {t("feed.browseJobs")}
            </Button>
            <Button
              href="/signup"
              size="lg"
              variant="secondary"
              className="border-white/20 bg-white/10 text-white hover:border-white/40 hover:text-white"
            >
              {t("auth.createAccount")}
            </Button>
          </div>
          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dd className="text-3xl font-extrabold text-white">{s.value}</dd>
                <dt className="mt-1 text-sm text-slate-400">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        <div
          className="relative h-16 bg-gradient-to-b from-transparent to-white"
          aria-hidden
        />
      </section>

      {/* ————— LATEST JOBS (real, live — no sample jobs) ————— */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-flare-600">
              Fresh jobs, updated daily
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
              Latest jobs
            </h2>
            <p className="mt-3 text-slate-600">
              Real jobs from Pakistan and around the world — new ones added
              every day.
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-extrabold text-ink-900">
                🇵🇰 Pakistani Jobs
              </h3>
              {latestPakistani.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {latestPakistani.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
                  No Pakistani jobs right now — check back soon.
                </p>
              )}
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-ink-900">
                🌍 International Jobs
              </h3>
              {latestInternational.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {latestInternational.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
                  No international jobs right now — check back soon.
                </p>
              )}
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button href="/jobs" size="lg">
              {t("feed.browseJobs")}
            </Button>
          </div>
        </div>
      </section>

      {/* ————— POPULAR CATEGORIES (Fiverr-style) ————— */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-flare-600">
              {t("landing.popularKicker")}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
              {t("landing.popularTitle")}
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {POPULAR_CATEGORIES.map((c) => (
              <Link
                key={c.skill}
                href={`/jobs?skill=${encodeURIComponent(c.skill)}`}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"
              >
                <span className="text-4xl transition group-hover:scale-110 inline-block">
                  {c.emoji}
                </span>
                <span className="mt-3 block text-sm font-bold text-ink-900">
                  {c.skill}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ————— FEATURES ————— */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-flare-600">
              Everything you need
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink-900">
              One network for the whole freelance journey
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title} hover>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-2xl">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-ink-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {f.text}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ————— HOW IT WORKS ————— */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-flare-600">
              {t("landing.howKicker")}
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink-900">
              {t("landing.howTitle")}
            </h2>
            {/* Audience tabs — Upwork style */}
            <div className="mt-8 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
              {(["client", "freelancer"] as const).map((aud) => (
                <button
                  key={aud}
                  type="button"
                  onClick={() => setHowAud(aud)}
                  className={`rounded-full px-6 py-2.5 text-sm font-bold transition ${
                    howAud === aud
                      ? "bg-ink-900 text-white shadow"
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
                className="rounded-2xl bg-ink-950 p-8 text-white"
              >
                <span className="text-gradient text-5xl font-extrabold">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-xl font-bold">{t(s.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {t(s.text)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— EARLY COMMUNITY (honest: no fake testimonials) ————— */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-flare-600">
              Just launched
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink-900">
              Join our early community
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Workbrio is brand new — be among the first freelancers and clients
              shaping a 100% free professional network. Your story could be
              featured here soon.
            </p>
            <div className="mt-8">
              <a
                href="/signup"
                className="inline-block rounded-full bg-flare-600 px-8 py-3 font-bold text-white shadow-lg transition hover:bg-flare-700"
              >
                Get started — it&rsquo;s free
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ————— WHY WORKBRIO (comparison) ————— */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-flare-600">
              {t("landing.whyKicker")}
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink-900">
              {t("landing.whyTitle")}
            </h2>
          </div>
          <div className="mt-12 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 font-bold text-slate-500"></th>
                  <th className="px-6 py-4 text-center">
                    <span className="inline-block rounded-full bg-gradient-brand px-4 py-1.5 font-extrabold text-white">
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
                    <td className="bg-brand-50/50 px-6 py-4 text-center text-lg font-extrabold text-brand-600">
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
          <p className="mt-6 text-center text-sm text-slate-500">
            {t("landing.whyNote")}
          </p>
        </div>
      </section>

      {/* ————— FAQ ————— */}
      <section id="faq" className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-flare-600">
              Questions, answered
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink-900">
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
                      className="text-xl text-brand-600 transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ————— CTA ————— */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-ink-950 px-6 py-16 text-center text-white sm:px-12">
          <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            {t("cta.subtitle")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/signup" size="lg">
              {t("cta.join")}
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
