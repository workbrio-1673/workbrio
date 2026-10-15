import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/Card";
import { ProfileEditForm } from "./ProfileEditForm";
import { toSkillList } from "@/lib/supabase/types";

/** Edit-profile page. Reads the session via cookies(), so it renders
 * dynamically per request. */
export const instant = false;

/** Protected: /settings/profile — edit your own profile. */
export default async function EditProfilePage() {
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

  // The signup trigger normally creates this row; create it if missing.
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const { data: created } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        role: (user.user_metadata?.role as string) ?? "freelancer",
        full_name:
          (user.user_metadata?.full_name as string | undefined) ??
          user.email?.split("@")[0] ??
          null,
      })
      .select()
      .single();
    profile = created;
  }
  if (!profile) redirect("/dashboard");

  const [{ data: skillRows }, { data: portfolio }, { data: allSkills }] =
    await Promise.all([
      supabase
        .from("profile_skills")
        .select("skills(id, name)")
        .eq("profile_id", user.id),
      supabase
        .from("portfolio_items")
        .select("*")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("skills").select("id, name").order("name"),
    ]);

  const skills = toSkillList(skillRows);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          Edit your profile
        </h1>
        <p className="mt-2 text-slate-600">
          This is how clients and collaborators see you on Workbrio.
        </p>

        <Card className="mt-8">
          <ProfileEditForm
            userId={user.id}
            initialProfile={profile}
            initialSkills={skills}
            initialPortfolio={portfolio ?? []}
            allSkills={allSkills ?? []}
          />
        </Card>
      </main>
      <Footer />
    </div>
  );
}
