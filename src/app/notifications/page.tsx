import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { NotificationsList } from "@/components/NotificationsList";
import type { NotificationItem } from "@/lib/supabase/types";

/** Notifications inbox: /notifications.
 *  Session is read via cookies(), so this renders dynamically. */
export const instant = false;

async function loadNotifications(userId: string): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, body, link_url, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return []; // migration not run yet -> empty, not a crash
  return (data as unknown as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    user_id: String(r.user_id),
    type: r.type as NotificationItem["type"],
    title: String(r.title),
    body: String(r.body ?? ""),
    link_url: (r.link_url as string | null) ?? null,
    read_at: (r.read_at as string | null) ?? null,
    created_at: String(r.created_at),
  }));
}

/** Protected notifications page: /notifications */
export default async function NotificationsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <AppNavbar />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-slate-600">
            Supabase is not connected yet. See README.md for setup.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const notifications = await loadNotifications(user.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          Notifications
        </h1>
        <p className="mt-1 text-slate-600">
          Proposals, messages and updates — newest first.
        </p>
        <div className="mt-6">
          <NotificationsList initial={notifications} userId={user.id} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
