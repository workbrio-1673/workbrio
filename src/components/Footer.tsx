import Link from "next/link";
import { Logo } from "./Logo";
import { CurrentYear } from "./CurrentYear";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Talent",
    links: [
      { label: "Find Work", href: "/signup" },
      { label: "Browse Jobs", href: "/signup" },
      { label: "Success Stories", href: "/#features" },
    ],
  },
  {
    title: "Clients",
    links: [
      { label: "Hire Talent", href: "/signup" },
      { label: "Post a Job", href: "/signup" },
      { label: "How It Works", href: "/#how-it-works" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#features" },
      { label: "Contact", href: "mailto:hello@workbrio.com" },
      { label: "Terms & Privacy", href: "/#" },
    ],
  },
];

/** Deep-blue footer with the Workbrio brand. */
export function Footer() {
  return (
    <footer className="bg-ink-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo href={null} onDark height={48} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              The international professional network for freelancers. Work with
              brio — energy, vigor, and pride in every project.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>
            © <CurrentYear /> Workbrio. All rights reserved.
          </p>
          <p>
            Made with <span className="text-gradient font-bold">brio</span> for
            freelancers worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
