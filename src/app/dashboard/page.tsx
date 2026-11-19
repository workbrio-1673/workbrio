import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { Card } from "@/components/Card";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";
import { NotificationBell } from "@/components/NotificationBell";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { StatsDisplay } from "@/components/StatsDisplay";
import { ADMIN_EMAIL } from "@/lib/site";
import { mapJobRow, splitJobs } from "@/lib/jobs";
import {
  salaryLabel,
  todayISO,
  type JobWithClient,
} from "@/lib/supabase/types";

/** This page reads the live session via cookies(), so it is always rendered dynamically. */

/** Compact latest-jobs block for the dashboard strip. */
function JobStrip({
  title,
  jobs,
}: {
  title: string;
  jobs: JobWithClient[];
}) {
  return (
    <Card>
      <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      {jobs.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-100">
          {jobs.map((job) => (
            <li key={job.id} className="py-3 first:pt-0 last:pb-0">
              <Link href={`/jobs/${job.id}`} className="group block">
                <span className="font-bold text-ink-900 group-hover:text-brand-600">
                  {job.title}
                </span>
                <span className="mt-0.5 block text-sm text-slate-500">
                  {[job.company_name, job.location]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-ink-900">
                  {salaryLabel(job)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No jobs here right now — check back soon.
        </p>
      )}
    </Card>
  );
}

/** Protected home for signed-in members. Reads the session via cookies(),
 * so it renders dynamically per request. */
export const instant = false;
export default async function DashboardPage() {
  // Fresh clone without Supabase keys: show a setup hint instead of crashing.
  // (The proxy also lets the request through when unconfigured.)
  if (!isSupabaseConfigured()) {
    return (
      <>
        <AppNavbar />
        <main className="mx-auto flex max-w-3xl flex-1 px-4 py-20 sm:px-6">
          <Card className="w-full text-center">
            <p className="text-4xl">🔑</p>
            <h1 className="mt-4 text-2xl font-extrabold text-ink-900">
              Supabase is not connected yet
            </h1>
            <p className="mx-auto mt-3 max-w-md text-slate-600">
              Copy <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">.env.example</code> to{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">.env.local</code> and
              add your <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> from
              the Supabase dashboard (Settings → API). See README.md for the
              full setup guide.
            </p>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt & braces: the proxy normally redirects signed-out visitors to /login.
  if (!user) redirect("/login");

  const role = (user.user_metadata?.role as string | undefined) ?? "member";

  // Site analytics are admin-only: only the owner account sees them.
  const isAdmin =
    (user.email ?? "").toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Website visit stats for the "Kitne log aaye?" card (admin only).
  let statTotal = 0;
  let statToday = 0;
  let statUnique7d = 0;
  if (isAdmin) {
    try {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [{ count: tc }, { count: tdc }, { data: wr }] = await Promise.all([
        supabase.from("page_views").select("id", { count: "exact", head: true }),
        supabase
          .from("page_views")
          .select("id", { count: "exact", head: true })
          .gte("created_at", dayStart.toISOString()),
        supabase
          .from("page_views")
          .select("visitor_key")
          .gte("created_at", weekAgo.toISOString())
          .limit(5000),
      ]);
      statTotal = tc ?? 0;
      statToday = tdc ?? 0;
      statUnique7d = new Set((wr ?? []).map((r) => r.visitor_key)).size;
    } catch {
      /* page_views table not created yet → zeros */
    }
  }

  // Latest live jobs for the strip below (same split as /jobs).
  let latestJobs: JobWithClient[] = [];
  try {
    const { data } = await supabase
      .from("jobs")
      .select("*, client:client_id(full_name, avatar_url, headline, location)")
      .eq("status", "open")
      .or(`deadline.is.null,deadline.gte.${todayISO()}`)
      .order("created_at", { ascending: false })
      .limit(12);
    latestJobs = (data ?? []).map((row) =>
      mapJobRow(row as unknown as Record<string, unknown>)
    );
  } catch {
    latestJobs = [];
  }
  const { pakistani, international } = splitJobs(latestJobs);

  // Next steps, tailored to the member's role.
  const nextSteps =
    role === "client"
      ? [
          {
            n: "1",
            title: "Post a job",
            text: "Describe the work, set a budget, and publish it to the network.",
            href: "/jobs/new",
            cta: "Post a job",
          },
          {
            n: "2",
            title: "Review applicants",
            text: "Applications land in your inbox — accept the best fit.",
            href: "/dashboard/proposals",
            cta: "View applications",
          },
          {
            n: "3",
            title: "Chat & hire",
            text: "Message the freelancer, agree terms, and get the work done.",
            href: "/messages",
            cta: "Open messages",
          },
        ]
      : [
          {
            n: "1",
            title: "Complete your profile",
            text: "Add your skills, photo and portfolio so clients can find you.",
            href: "/settings/profile",
            cta: "Edit profile",
          },
          {
            n: "2",
            title: "Find a job",
            text: "Browse Pakistani and international jobs and pick what fits you.",
            href: "/jobs",
            cta: "Browse jobs",
          },
          {
            n: "3",
            title: "Apply & track",
            text: "Send a proposal with your cover note and CV, then follow it in My applications.",
            href: "/dashboard/applications",
            cta: "My applications",
          },
        ];

  const quickLinks =
    role === "client"
      ? [
          { label: "Community feed", href: "/feed" },
          { label: "Messages", href: "/messages" },
          { label: "Browse jobs", href: "/jobs" },
          { label: "My jobs", href: "/dashboard/jobs" },
          { label: "Proposals", href: "/dashboard/proposals" },
          { label: "+ Post a job", href: "/jobs/new" },
        ]
      : [
          { label: "Community feed", href: "/feed" },
          { label: "Messages", href: "/messages" },
          { label: "Browse jobs", href: "/jobs" },
          { label: "My applications", href: "/dashboard/applications" },
          { label: "My profile", href: `/profile/${user.id}` },
          { label: "Edit profile", href: "/settings/profile" },
        ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo height={36} />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="hidden text-sm text-slate-500 sm:block">
              {user.email}
            </span>
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold capitalize text-brand-600">
              {role}
            </span>
            <a
              href={`/profile/${user.id}`}
              className="hidden text-sm font-semibold text-brand-600 hover:text-brand-500 sm:block"
            >
              My profile
            </a>
            <a
              href="/settings/profile"
              className="hidden text-sm font-semibold text-slate-600 hover:text-ink-900 sm:block"
            >
              Edit
            </a>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-ink-950 p-8 text-white sm:p-12">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome to Workbrio,{" "}
            <span className="text-gradient">
              {user.email?.split("@")[0] ?? "friend"}
            </span>
            !
          </h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Find real jobs, hire talent, and grow your freelance career —
            all in one place, 100% free.
          </p>
        </div>

        {isAdmin && (
          <div className="mt-6">
            <StatsDisplay
              total={statTotal}
              today={statToday}
              unique7d={statUnique7d}
            />
          </div>
        )}

        <h2 className="mt-12 text-xl font-extrabold text-ink-900">
          Quick links
        </h2>        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-3xl border border-slate-200/70 bg-white p-5 font-bold text-ink-900 shadow-sm transition-shadow hover:shadow-lg"
            >
              {l.label} →
            </a>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-extrabold text-ink-900">
          Latest jobs
        </h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <JobStrip title="🇵🇰 Pakistani Jobs" jobs={pakistani.slice(0, 3)} />
          <JobStrip
            title="🌍 International Jobs"
            jobs={international.slice(0, 3)}
          />
        </div>
        <p className="mt-6">
          <Link
            href="/jobs"
            className="text-sm font-semibold text-brand-600 hover:text-brand-500"
          >
            Browse all jobs →
          </Link>
        </p>

        <h2 className="mt-12 text-xl font-extrabold text-ink-900">
          Your next steps
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {nextSteps.map((s) => (
            <Card key={s.title}>
              <span className="text-gradient text-4xl font-extrabold">
                {s.n}
              </span>
              <h3 className="mt-3 text-lg font-bold text-ink-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {s.text}
              </p>
              <p className="mt-4">
                <Link
                  href={s.href}
                  className="text-sm font-semibold text-brand-600 hover:text-brand-500"
                >
                  {s.cta} →
                </Link>
              </p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
