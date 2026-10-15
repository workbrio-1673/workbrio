"use client";

import { createClient } from "@/lib/supabase/client";

/** "Continue with Google" button — wired to Supabase OAuth (needs Google provider enabled in Supabase). */
export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const signInWithGoogle = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) alert(error.message);
  };

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      className="card-ring flex h-11 w-full items-center justify-center gap-3 rounded-full bg-white text-sm font-semibold text-ink-900 transition-colors hover:border-slate-400"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.9z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.1.1-3.7 2.9v.1C3.4 21.5 7.4 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.6-2.8-.1.1C.5 8.5 0 10.1 0 12s.5 3.5 1.4 5l3.8-2.6z"
        />
        <path
          fill="#EA4335"
          d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.5 1.4 6.9l3.8 2.9c1-2.9 3.7-5.1 6.8-5.1z"
        />
      </svg>
      {label}
    </button>
  );
}
