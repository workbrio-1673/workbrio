"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageProvider";
const STATS = [
  { value: "120+", label: "Countries" },
  { value: "40k+", label: "Freelancers" },
  { value: "8k+", label: "Projects posted" },
  { value: "4.9", label: "Average rating" },
];

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

const JOBS = [
  {
    title: "Mobile App UI Design",
    budget: "$1,200",
    type: "Fixed price",
    skills: ["Figma", "UI Design", "Mobile"],
  },
  {
    title: "React Admin Dashboard",
    budget: "$2,500",
    type: "Fixed price",
    skills: ["React", "TypeScript", "Dashboards"],
  },
  {
    title: "Blog Articles (10x)",
    budget: "$350",
    type: "Fixed price",
    skills: ["Writing", "SEO", "Research"],
  },
  {
    title: "Logo & Brand Identity",
    budget: "$800",
    type: "Fixed price",
    skills: ["Branding", "Illustrator", "Logo"],
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

const TESTIMONIALS = [
  {
    quote:
      "I landed my first three clients within two weeks of completing my profile. The proposal flow is the simplest I've used anywhere.",
    name: "Daniel Okafor",
    role: "Web Developer · Lagos, Nigeria",
  },
  {
    quote:
      "Hiring used to mean weeks of back-and-forth. On Workbrio I posted a job in the morning and was chatting with shortlisted designers by lunch.",
    name: "Sofia Marchetti",
    role: "Startup Founder · Milan, Italy",
  },
  {
    quote:
      "The feed keeps me visible even between projects. Clients find me through my posts — it's networking that actually works.",
    name: "Priya Sharma",
    role: "Content Strategist · Bengaluru, India",
  },
];

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

export function LandingContent() {
  const { t } = useLanguage();
  const [howAud, setHowAud] = useState<"client" | "freelancer">("client");
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
            <Button href="/signup" size="lg">
              {t("hero.findWork")}
            </Button>
            <Button
              href="/signup"
              size="lg"
              variant="secondary"
              className="border-white/20 bg-white/10 text-white hover:border-white/40 hover:text-white"
            >
              Hire Talent
            </Button>
          </div>
          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => (
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

      {/* ————— SAMPLE PROFILE + JOBS ————— */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-flare-600">
              A taste of Workbrio
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink-900">
              Talent meets opportunity
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-5">
            {/* Sample freelancer profile */}
            <Card className="lg:col-span-2">
              <div className="flex items-start gap-4">
                <Image
                  src="/avatar-sample.jpg"
                  alt="Sample freelancer avatar"
                  width={72}
                  height={72}
                  className="rounded-2xl object-cover"
                />
                <div>
                  <h3 className="text-xl font-bold text-ink-900">Maya Chen</h3>
                  <p className="text-sm text-slate-600">
                    UI/UX Designer &amp; Brand Specialist · Berlin, Germany
                  </p>
                  <p className="mt-1 text-sm font-semibold text-amber-500">
                    ★ 4.9{" "}
                    <span className="font-normal text-slate-500">
                      (212 reviews)
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Figma", "UI Design", "Branding", "Prototyping"].map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                  <span className="text-lg font-extrabold text-ink-900">
                    $45
                  </span>
                  /hr
                </p>
                <Button size="sm">View Profile</Button>
              </div>
            </Card>

            {/* Sample jobs */}
            <div className="space-y-4 lg:col-span-3">
              {JOBS.map((j) => (
                <Card key={j.title} hover className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-ink-900">{j.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{j.type}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {j.skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-600"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-600">
                      {j.budget}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
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

      {/* ————— TESTIMONIALS ————— */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-flare-600">
              Early members
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink-900">
              People are already working with brio
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="flex flex-col">
                <p className="text-2xl text-gradient" aria-hidden>
                  ★★★★★
                </p>
                <blockquote className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-slate-600">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <footer className="mt-6 border-t border-slate-100 pt-4">
                  <p className="font-bold text-ink-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </footer>
              </Card>
            ))}
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
