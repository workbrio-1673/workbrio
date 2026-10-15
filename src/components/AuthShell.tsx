import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { CurrentYear } from "./CurrentYear";

/** Split-screen auth shell: brand panel on the left, form card on the right. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-ink-950 text-white lg:block">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(60% 50% at 30% 20%, rgba(46,124,246,.4), transparent 70%), radial-gradient(50% 45% at 80% 30%, rgba(236,72,153,.3), transparent 70%), radial-gradient(45% 40% at 50% 85%, rgba(139,92,246,.35), transparent 70%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo onDark height={64} />
          <div>
            <h2 className="text-4xl font-extrabold leading-tight">
              Work with <span className="text-gradient">Brio!</span>
            </h2>
            <p className="mt-4 max-w-md text-lg text-slate-300">
              Join the international professional network for freelancers —
              profiles, jobs, feed and messaging in one place.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            © <CurrentYear /> Workbrio · Freelancers Network
          </p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
            {title}
          </h1>
          <p className="mt-2 text-slate-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
