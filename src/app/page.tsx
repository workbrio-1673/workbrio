import type { Metadata } from "next";
import { LandingContent } from "@/components/LandingContent";

export const metadata: Metadata = {
  title: "Workbrio — Work with Brio!",
  description:
    "Join Workbrio, the international freelancers network. Create your profile, browse jobs, hire talent, and grow your freelance career — free to join.",
  openGraph: {
    title: "Workbrio — Work with Brio!",
    description:
      "The international professional network built for freelancers. Profiles, jobs, feed and messaging — free to join.",
  },
};

export default function LandingPage() {
  return <LandingContent />;
}
