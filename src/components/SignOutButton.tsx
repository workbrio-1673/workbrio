"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Signs out via the /auth/signout route handler. */
export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const signOut = async () => {
    setLoading(true);
    await fetch("/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={signOut}
      disabled={loading}
      className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink-900 disabled:opacity-50"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
