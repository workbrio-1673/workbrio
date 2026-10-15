import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";

export default function AuthCodeErrorPage() {
  return (
    <AuthShell
      title="That link didn't work"
      subtitle="The sign-in link is invalid or has expired."
    >
      <div className="rounded-2xl bg-amber-50 px-6 py-8 text-center">
        <p className="text-4xl">🔗</p>
        <p className="mt-4 font-semibold text-ink-900">
          Please request a fresh link and try again.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button href="/login">Back to Sign in</Button>
          <Button href="/signup" variant="secondary">
            Create account
          </Button>
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">
        Need help? <Link href="mailto:hello@workbrio.com" className="font-semibold text-brand-600">Contact us</Link>
      </p>
    </AuthShell>
  );
}
