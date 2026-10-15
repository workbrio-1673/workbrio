import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/AppNavbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/Card";
import { ServiceForm } from "@/components/ServiceForm";
import type { Skill } from "@/lib/supabase/types";

/** Offer a service: /services/new (freelancers only). Session read via cookies(), dynamic. */
export const instant = false;

export default async function NewServicePage() {
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

  const role = (user.user_metadata?.role as string | undefined) ?? "freelancer";
  if (role !== "freelancer") redirect("/services");

  const { data: allSkills } = await supabase
    .from("skills")
    .select("id, name")
    .order("name");

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          Offer a service
        </h1>
        <p className="mt-2 text-slate-600">
          List a ready-to-order gig — buyers order directly,{" "}
          <span className="font-bold text-emerald-600">0% commission</span> on
          Workbrio.
        </p>

        <Card className="mt-8">
          <ServiceForm
            userId={user.id}
            allSkills={(allSkills ?? []) as Skill[]}
            redirectTo="/services"
            submitLabel="Publish service"
          />
        </Card>
      </main>
      <Footer />
    </div>
  );
}
