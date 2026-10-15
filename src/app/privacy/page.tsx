import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · Workbrio",
  description:
    "How Workbrio collects, uses, and protects your personal information.",
};

const sections: { heading: string; body: string[] }[] = [
  {
    heading: "Introduction",
    body: [
      "Workbrio (\"we\", \"our\", \"us\") is a free professional network for freelancers and clients. This Privacy Policy explains what personal information we collect when you use https://workbrio.netlify.app (the \"Service\"), how we use it, and the choices you have. By using the Service, you agree to this policy.",
    ],
  },
  {
    heading: "Information we collect",
    body: [
      "Account information: when you sign up with email or Google, we receive your name, email address, and profile photo (if provided by the login provider).",
      "Profile information: headline, bio, skills, location, hourly rate, portfolio links, and anything else you add to your public profile.",
      "Content you create: job posts, proposals and cover notes, CVs/resumes you upload (PDF), feed posts, comments, and messages you send to other users.",
      "Automatically collected information: pages you visit and basic device/browser information, used only to keep the Service running and to understand overall usage.",
    ],
  },
  {
    heading: "How we use your information",
    body: [
      "To create and manage your account and public freelancer/client profile.",
      "To show your profile, job posts, proposals, and feed posts to other users of the Service.",
      "To let clients review your proposals and CVs when you apply to jobs.",
      "To operate, secure, and improve the Service, and to prevent fraud and abuse.",
      "We do not sell your personal information to anyone, and we show no third-party advertising.",
    ],
  },
  {
    heading: "Logins with Google",
    body: [
      "If you choose \"Continue with Google\", we receive your name, email address, and profile photo from Google so we can create your Workbrio account. We do not post to your Google account or access any other data from Google.",
    ],
  },
  {
    heading: "Data storage and sharing",
    body: [
      "Your data is stored securely with our infrastructure providers (Supabase for database, authentication, and file storage; Netlify for hosting). We share data with them only as needed to run the Service.",
      "Your public profile, job posts, and feed posts are visible to other signed-in users. Your CV is visible only to the client whose job you applied to. Your private messages are visible only to you and the other participant.",
      "We may disclose information if required by law or to protect the rights and safety of our users.",
    ],
  },
  {
    heading: "Cookies",
    body: [
      "We use essential cookies and browser storage to keep you signed in, remember your language preference, and keep the site secure. We do not use third-party advertising or tracking cookies.",
    ],
  },
  {
    heading: "Data retention and deletion",
    body: [
      "We keep your information for as long as your account is active. You can delete your profile content at any time from your account settings, and you can ask us to delete your account entirely by contacting us at the email below — we will remove your personal data within 30 days, except where we must keep limited records for legal or security reasons.",
    ],
  },
  {
    heading: "Children",
    body: [
      "Workbrio is intended for users aged 16 and older. We do not knowingly collect personal information from children under 16.",
    ],
  },
  {
    heading: "Changes to this policy",
    body: [
      "We may update this Privacy Policy from time to time. If we make material changes, we will note the updated date below.",
    ],
  },
  {
    heading: "Contact us",
    body: [
      "If you have questions about this Privacy Policy or your data, contact us at azmeeaslam@gmail.com.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <Link
        href="/"
        className="text-sm font-semibold text-slate-500 hover:text-slate-800"
      >
        ← Back to Workbrio
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Last updated: October 10, 2026
      </p>
      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-bold text-ink-900">{s.heading}</h2>
            <div className="mt-2 space-y-2">
              {s.body.map((p, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-slate-600">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
