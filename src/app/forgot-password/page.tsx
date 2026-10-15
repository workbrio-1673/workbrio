"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send the reset email. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your account email and we'll send you a reset link."
    >
      {done ? (
        <div className="rounded-2xl bg-emerald-50 px-6 py-8 text-center">
          <p className="text-4xl">✉️</p>
          <p className="mt-4 font-semibold text-ink-900">
            Reset link sent to {email}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Click the link in the email to choose a new password.
          </p>
          <Button href="/login" variant="secondary" className="mt-6">
            Back to Sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
          <p className="text-center text-sm text-slate-600">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-500">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
