"use client";

import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { useLanguage } from "@/components/LanguageProvider";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  const { t } = useLanguage();
  return (
    <AuthShell title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      <Suspense
        fallback={<p className="text-sm text-slate-500">Loading sign-in…</p>}
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
