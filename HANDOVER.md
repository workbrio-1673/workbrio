# Workbrio — Handover (M0–M5 complete)

**What this is:** the real, working Workbrio website — an international
professional network for freelancers (LinkedIn-style). 100% English.
Built 2026-10-08. **Work with Brio!**

## What was built

| Milestone | What it does |
|-----------|--------------|
| **M0 — Foundation** | Website base (Next.js), Workbrio brand theme (deep blue + gradient), login/signup with email, Google-login button, password reset, landing page |
| **M1 — Profiles** | Public profile pages (photo, headline, bio, skills, hourly rate, portfolio, reviews), edit-your-profile page, photo upload, 30 ready-made skills |
| **M2 — Jobs** | Clients post jobs (budget, skills), freelancers search/filter/browse, apply with cover note + bid, client applicant inbox with Accept/Decline |
| **M3 — Feed** | LinkedIn-style feed: write posts (text + photo), likes, comments |
| **M4 — Messaging** | Realtime 1:1 chat (messages arrive instantly), conversation list, unread badges, notification bell + inbox (proposal received/accepted, new message) |
| **M5 — Launch prep** | Polished landing (testimonials + FAQ), **Report** button on posts/jobs/profiles, SEO (Google-ready titles, share previews, sitemap), this handover |

**Database:** all tables are LIVE in your Supabase project (profiles, skills,
jobs, proposals, posts, comments, likes, conversations, messages,
notifications, reports) — verified working on 2026-10-08.

## What's live right now
- ✅ All code complete, `npm run build` passes
- ✅ Database connected and all tables working
- ❌ Website **not yet on the internet** — needs the Vercel deploy (10 min, see below)

## What's still pending (before launch)
1. **Vercel deploy** — the ONLY blocker. Vercel blocked phone verification
   for ~12h (anti-spam, started 2026-10-08 ~05:32 UTC). When it clears:
   finish signup → import repo → add the 2 Supabase keys → Deploy.
   Full steps: README → "GOING LIVE".
2. **Push code to GitHub** — Vercel imports from GitHub. Say the word and
   Lux does it in 2 minutes.
3. **Google login button** (optional) — enable Google provider in Supabase
   Auth and paste the Google Cloud Client ID/Secret. Email login already works.
4. **Custom domain** (later) — `workbrio.com` is TAKEN. Suggested:
   `workbrio.net`, `tryworkbrio.com`, or `workbrionetwork.com`
   (~$12–15/year). After connecting, update `NEXT_PUBLIC_SITE_URL`.
5. **Admin review of reports** — members can file reports now; the admin
   review screen is out of MVP scope (reports are visible in Supabase →
   Table Editor → `reports`).

## How to run it on your own computer (developers)
```bash
cd ~/workspace/workbrio
cp .env.example .env.local   # then fill in the 2 Supabase values
npm install
npm run dev                  # open http://localhost:3000
```

## Important files
- `supabase/migrations/` — database setup files (run in Supabase → SQL
  Editor → New query → paste → Run; each is safe to re-run).
  **Apply order:** m1 → m2 → m2_jobs_rls_fix → m3 → m4 → m5.
- `src/lib/site.ts` — change `SITE_URL` when the real domain is live.
- `.env.local` — your secret keys (never share, never commit; it's gitignored).

## Costs
$0 to launch (all free tiers). Later only: domain ~$12–15/year.
Play Store app (Phase 2) needs a $25 one-time developer account.

---
*Built with Next.js 16 + TypeScript + Supabase. Questions? Ask Lux.* 🚀
