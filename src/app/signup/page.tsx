"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { GoogleButton } from "@/components/GoogleButton";
import { useLanguage } from "@/components/LanguageProvider";

type Role = "freelancer" | "client";

export default function SignupPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [role, setRole] = useState<Role>("freelancer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { role },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) throw error;
      // If email confirmation is OFF, Supabase returns a session right away —
      // take the user straight into the app instead of the inbox screen.
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create your account. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell title={t("auth.checkInboxTitle")} subtitle={t("auth.checkInboxTitle")}>
        <div className="rounded-2xl bg-emerald-50 px-6 py-8 text-center">
          <p className="text-4xl">✉️</p>
          <p className="mt-4 font-semibold text-ink-900">
            {t("auth.checkInboxText", { email })}
          </p>
          
          <Button href="/login" className="mt-6">
            {t("auth.goToSignIn")}
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("auth.joinTitle")}
      subtitle={t("auth.joinSubtitle")}
    >
      {/* Role picker */}
      <div className="mb-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label="I am joining as">
        {(
          [
            { value: "freelancer", icon: "🧑‍💻", label: t("auth.freelancer"), hint: t("auth.freelancerHint") },
            { value: "client", icon: "🏢", label: t("auth.client"), hint: t("auth.clientHint") },
          ] as const
        ).map((r) => (
          <button
            key={r.value}
            type="button"
            role="radio"
            aria-checked={role === r.value}
            onClick={() => setRole(r.value)}
            className={`rounded-2xl border-2 p-4 text-left transition-all ${
              role === r.value
                ? "border-brand-500 bg-brand-500/5 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <span className="text-2xl">{r.icon}</span>
            <span className="mt-2 block font-bold text-ink-900">{r.label}</span>
            <span className="text-xs text-slate-500">{r.hint}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          label={t("auth.email")}
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label={t("auth.password")}
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        OR
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <GoogleButton label="Sign up with Google" />

      <p className="mt-8 text-center text-sm text-slate-600">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-500">
          {t("auth.signIn")}
        </Link>
      </p>
    </AuthShell>
  );
}
