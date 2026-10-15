import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { SavedTabs } from "@/components/SavedTabs";

/** Saved items: /saved — bookmarked posts + jobs.
 *  Session is read via cookies(), so this renders dynamically. */
export const instant = false;

export default async function SavedPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <AppNavbar />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-slate-600">Supabase is not connected yet.</p>
        </main>
        <Footer />
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <>
        <AppNavbar />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-slate-600">Please sign in to view your saved items.</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AppNavbar />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <SavedTabs userId={user.id} />
      </main>
      <Footer />
    </div>
  );
}
