# Workbrio — Freelancers Network

The international professional network for freelancers (LinkedIn-style):
profiles, jobs, feed, and messaging. **Work with Brio!**

**Stack:** Next.js 16 (App Router, TypeScript) · Supabase (Postgres, Auth,
Storage, Realtime) · Tailwind CSS v4 · Vercel (hosting)

> **M0 — Foundation** ✅ done. Auth (email + Google OAuth), brand theme,
> component set, landing page, and protected dashboard shell are
> code-complete.
> **M1 — Profiles** ✅ done: database schema + public
> profile pages + edit profile with avatar upload, skills, portfolio.
> **M2 — Jobs** ✅ done (this repo state): database schema + job browsing
> with search/filters + job detail + post/edit/close jobs + proposals with
> applicant inbox (accept/decline).
> **M3 — Feed** ✅ done (this repo state): database schema + LinkedIn-style
> home feed with post composer (text + photo), likes, and comments.
> **M4 — Messaging** ✅ done (this repo state): database schema +
> realtime 1:1 chat (conversation list, message bubbles, read receipts) +
> in-app notifications (bell icon with live badge, notifications inbox).
> M5 (launch prep) comes next.

---

## Database setup (Supabase) — do this once per milestone with new SQL

Each milestone ships SQL migration files in `supabase/migrations/`.
Apply them in your Supabase dashboard — about 2 minutes, no code needed:

1. Open your Supabase project → **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the migration file (e.g.
   `supabase/migrations/20261008_m1_profiles.sql`), copy its **entire**
   contents, paste into the query box
4. Click **Run** — you should see "Success. No rows returned"

M1's migration creates: `profiles`, `skills`, `profile_skills`,
`portfolio_items`, `reviews` tables · Row Level Security policies ·
`avatars` public storage bucket · an auth trigger that auto-creates a
profile row on signup · a starter skill catalog. Re-running is safe
(everything is idempotent).

**M2's migration** (`supabase/migrations/20261008_m2_jobs.sql`) creates:
`jobs` and `proposals` tables + RLS policies (open jobs are public;
clients manage their own jobs; freelancers apply to open jobs; clients
accept/decline proposals on their jobs). Run it **after** the M1
migration, the same way (paste into a new query → Run).

> ⚠️ **M2 RLS fix:** the original M2 policies had an infinite-recursion
> bug (jobs ↔ proposals cross-table references, error `42P17`). If you
> already ran `20261008_m2_jobs.sql`, also run
> `supabase/migrations/20261008_m2_jobs_rls_fix.sql` afterwards — it
> replaces the policies with recursion-free versions using
> `SECURITY DEFINER` helpers.

**M3's migration** (`supabase/migrations/20261008_m3_feed.sql`) creates:
`posts`, `post_likes` and `comments` tables + RLS policies (everything
publicly readable; signed-in users post/like/comment as themselves;
only authors edit/delete their own) + the `post-images` public storage
bucket. Its policies deliberately use only direct `auth.uid()`
comparisons — no cross-table reads, so no recursion risk. Run it
**after** the M1 migration, the same way (paste into a new query → Run).

**M4's migration** (`supabase/migrations/20261008_m4_messaging.sql`) creates:
`conversations` (one row per user pair, optional `job_id`, canonical
`participant_1 < participant_2` ordering), `messages` (with `read_at`
read receipts), and `notifications` tables + RLS policies + three
`SECURITY DEFINER` notification triggers (new proposal → notify client;
proposal accepted/declined → notify freelancer; new message → notify the
other participant) + realtime enabled for `messages` and `notifications`.
Its RLS uses the same recursion-free pattern as the M2 fix: direct
`auth.uid()` checks plus the `is_conversation_participant()` security-
definer helper — never cross-table RLS reads. Run it **after** the M1 and
M2 migrations, the same way (paste into a **fresh** query tab → Run).

> ⚠️ **Fresh-tab rule (learned the hard way):** always paste a migration
> into a **new** query tab (`+` button). Reusing a tab that still holds an
> older migration can silently re-apply old statements after the new ones.

---

## Quick start (for developers)

```bash
cd workbrio
npm install

# 1. Copy the env template
cp .env.example .env.local

# 2. Fill in the two values from your Supabase project
#    (Supabase dashboard → Settings → API):
#    NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# 3. Run it
npm run dev      # http://localhost:3000
npm run build    # must pass before any deploy
```

## GOING LIVE — step-by-step deploy guide (for Shoaib)

Everything below is written for a non-technical reader. Total hands-on
time: about **10 minutes** once the Vercel phone block clears (see step 1).
Do the steps **in order**.

> ⚠️ **Vercel phone verification:** Vercel temporarily blocked SMS
> verification for ~12 hours starting 2026-10-08 ~05:32 UTC (anti-spam
> after too many code requests). **Do not keep retrying** — it extends the
> block. Wait until it clears, then do step 1 once.

### Step 1 — Finish the Vercel account (~10 min, after the block clears)
1. Go to [vercel.com](https://vercel.com) and finish signing up
   ("Continue with Google", Hobby/Free plan).
2. If it asks for phone verification, enter the code **once** and wait.
   If it says the number is blocked again, stop and wait a few more hours.

### Step 2 — Put the code on Vercel (~3 min)
1. In Vercel, click **Add New → Project**.
2. Vercel will ask to connect a Git provider. The code currently lives
   in `~/workspace/workbrio/` on our build machine — **Lux will push it
   to a GitHub repo first** (say the word and it's done in 2 minutes).
3. Click **Import** on the `workbrio` repo. Leave all build settings
   exactly as Vercel suggests (it auto-detects Next.js).

### Step 3 — Add the two secret keys (~2 min)
Still on Vercel's import screen, open **Environment Variables** and add:
| Name | Value (from) |
|------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → **anon public** key |
Then click **Deploy**. Wait ~2 minutes — Vercel gives you a live link
like `workbrio-xyz.vercel.app`. **That's the website, live on the internet.**

### Step 4 — Quick smoke test (~3 min)
Open the live link and check: landing page loads → Sign up works →
profile page opens → you can post a job. If anything looks off, tell Lux.

### Step 5 — Custom domain (later, ~$12–15/year)
1. `workbrio.com` is **already taken** — don't try to buy it.
   Good alternatives that looked available: `workbrio.net`,
   `tryworkbrio.com`, `workbrionetwork.com`.
2. Buy one from any registrar (Namecheap, Cloudflare…).
3. In Vercel → your project → **Settings → Domains** → add the domain
   and follow Vercel's DNS instructions (2 records, ~5 minutes).
4. After the domain works, update `NEXT_PUBLIC_SITE_URL` in Vercel's
   environment variables to `https://yourdomain.com` and redeploy —
   this fixes the sitemap and share previews.

### Step 6 — Google login button (optional, ~5 min)
In Supabase → Authentication → Providers → enable **Google**, paste the
Client ID/Secret from [Google Cloud Console](https://console.cloud.google.com)
(use the Supabase callback URL shown on that page). Until then, email
signup/login works fine.

## What Shoaib needs to provide (to go live)

Nothing is needed to **develop** — but going live needs these free accounts
(about 10 minutes each; we configure everything afterwards):

| # | What | Cost | Where / how |
|---|------|------|-------------|
| 1 | **Supabase account + project** | Free | supabase.com → New project → copy **Project URL** and **anon public key** (Settings → API) into `.env.local` |
| 2 | **Google OAuth (for "Continue with Google")** | Free | In Supabase: Authentication → Providers → enable **Google**, paste the Client ID/Secret from [Google Cloud Console](https://console.cloud.google.com) (create OAuth client for the Supabase callback URL shown on that page) |
| 3 | **Vercel account** | Free | vercel.com → import this repo → add the same two env vars → Deploy |
| 4 | **Domain** (e.g. `workbrio.com`) | ~$12–15/year | Buy from any registrar (Namecheap, Cloudflare…), then point it at Vercel (Vercel → Project → Settings → Domains) |
| 5 | **Resend account** (transactional email) | Free tier | Only needed from M1 on (verification/notification emails) |
| 6 | **Play Store developer account** | $25 one-time | Only for Phase 2 (mobile app) |

> ⚠️ Never put real keys in chat, screenshots, or git. `.env.local` is
> gitignored — only `.env.example` (empty template) is committed.

## Project structure

```
src/
  app/
    page.tsx                  Landing page (hero "Work with Brio!", features, sample jobs)
    login/  signup/           Email auth + Google OAuth button
    forgot-password/  reset-password/
    auth/callback/route.ts    OAuth + email-link code exchange
    auth/signout/route.ts     Sign out
    dashboard/page.tsx        Protected member home
    profile/[id]/page.tsx     Public profile page (avatar, skills, portfolio, reviews)
    settings/profile/         Edit profile: details, avatar upload, skills, portfolio
  components/
    Logo.tsx Button.tsx Card.tsx Input.tsx
    Navbar.tsx Footer.tsx AuthShell.tsx GoogleButton.tsx SignOutButton.tsx
    ProfileCard.tsx SkillChip.tsx PortfolioGrid.tsx ReviewList.tsx AvatarUpload.tsx
    JobCard.tsx JobFilters.tsx JobForm.tsx ApplicationForm.tsx ProposalList.tsx
    PostComposer.tsx PostCard.tsx LikeButton.tsx CommentList.tsx FeedList.tsx
    ChatWindow.tsx ConversationList.tsx MessageBubble.tsx MessagesView.tsx
    NotificationBell.tsx NotificationsList.tsx UnreadBadge.tsx
    ReportButton.tsx
  lib/supabase/
    client.ts                 Browser client  (Client Components)
    server.ts                 Server client   (Server Components / routes)
    proxy.ts                  Session refresh + protected-route rules
    types.ts                  DB types (profiles → messages, incl. Report)
  lib/site.ts                 SITE_URL / names for SEO + sitemap
  proxy.ts                    Next.js 16 proxy (replaces middleware.ts)
supabase/
  migrations/                 SQL migrations — paste into Supabase SQL Editor
    20261008_m1_profiles.sql  Profiles schema, RLS, avatars bucket, signup trigger
    20261008_m2_jobs.sql      Jobs & proposals schema + RLS
    20261008_m2_jobs_rls_fix.sql  M2 RLS infinite-recursion fix (run after M2)
    20261008_m2_rls_fix_part2.sql M2 policy-only re-fix (if the first fix was partial)
    20261008_m3_feed.sql      Feed schema (posts/likes/comments), RLS, post-images bucket
    20261008_m4_messaging.sql Messaging schema (conversations/messages/notifications), RLS, triggers, realtime
    20261008_m5_reports.sql   Reports/moderation schema + RLS (run last)
public/
  logo.png                    Approved Workbrio brand lockup (v2)
HANDOVER.md                   Plain-English build summary for Shoaib
```

## Brand

- **Logo:** gradient "W" monogram + upward growth arrow, "Work" (black) +
  "brio" (pink), "FREELANCERS NETWORK" caption — `public/logo.png`
- **Colors:** deep-blue base (`ink-900` `#0A1730`) with a
  blue → purple → pink gradient accent (`.text-gradient`, `.bg-gradient-brand`)
- **Language:** the whole product is 100% English.

## Roadmap

- **M0** ✅ Foundation: Next.js + Supabase wired, brand, auth, landing, protected dashboard
- **M1** ✅ Profiles — freelancer/client pages, edit, avatar upload, skills, portfolio, reviews
- **M2** ✅ Jobs — post, browse/search/filter, apply, applicant inbox, accept/decline (RLS recursion fixed)
- **M3** ✅ Feed — posts, likes, comments
- **M4** ✅ Messaging — realtime 1:1 chat, conversation list, read receipts, in-app notifications
- **M5** ✅ Launch prep (this repo state) — landing polish (testimonials + FAQ), report/moderation flow, SEO (metadata, OG tags, sitemap, robots), deploy guide, handover doc
- **Phase 2** Expo mobile app → Play Store (same Supabase backend)
