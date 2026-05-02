# Auth + Admin Dashboard — Change Log

## Context

TripTales was fully open — anyone with the URL could generate stories. The goal was to restrict access to invited users and give Jason and his partner visibility into what guests are doing.

**Phase 1 (reverted):** Built a custom email-gate with iron-session, AllowedEmail/AccessLog DB tables, a `/login` page, and an admin dashboard. This was later replaced after merging with the partner's Clerk implementation.

**Phase 2 (current):** Adopted Clerk for all auth. Added a TripTales-specific `/admin` page on top that shows per-user story activity using Clerk's backend API.

---

## Current Auth Architecture

**Clerk** handles all authentication:
- Sign in / sign up via Clerk's modal (shown in the Header)
- Sessions managed by Clerk — no custom cookies or session tables
- Middleware (`src/middleware.ts`) uses `clerkMiddleware` to protect `/story/*` routes
- tRPC context provides `ctx.userId` (Clerk user ID) to all procedures
- `protectedProcedure` in tRPC throws UNAUTHORIZED if no Clerk session

**Email allowlist (Clerk dashboard):**
- Managed in Clerk → User & Authentication → Restrictions → Allowlist
- Only emails on the list can sign up — no code required

**Admin page (`/admin`):**
- Protected by `ADMIN_EMAILS` env var (comma-separated)
- Checks the signed-in Clerk user's email against this list
- Queries TripTales DB for story data, enriches with Clerk user info

---

## New Env Vars

| Var | Description |
|-----|-------------|
| `CLERK_SECRET_KEY` | Clerk backend API key (from Clerk dashboard) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key (from Clerk dashboard) |
| `ADMIN_EMAILS` | Comma-separated admin emails e.g. `jason@...,partner@...` |

---

## Schema Change

Added `clerkUserId String?` to the `Story` model so stories can be linked back to Clerk users:

```prisma
model Story {
  ...
  clerkUserId  String?
  ...
  @@index([clerkUserId])
}
```

Run `pnpm db:push` to apply.

---

## Files Created / Modified

| File | Change |
|------|--------|
| `src/app/admin/page.tsx` | New — server component admin dashboard |
| `prisma/schema.prisma` | Added `clerkUserId` + index to Story |
| `src/env.js` | Added `ADMIN_EMAILS` |
| `src/server/api/routers/story.ts` | Stamps `clerkUserId: ctx.userId` on story creation |
| `src/middleware.ts` | Clerk middleware protecting `/story/*` routes |
| `src/server/api/trpc.ts` | Clerk `auth()` in context; `protectedProcedure` added |
| `src/app/_components/Header.tsx` | Clerk `SignInButton` + `UserButton` + `Show` |

---

## Admin Page — What It Shows

**Users section:**
- Avatar, name, email (from Clerk)
- Story count and date of last story

**Recent Stories feed:**
- Status badge (complete / failed / generating)
- Trip context snippet
- Who created it, how many pages
- Date + link to view completed stories

**Access:** log in with an admin email → go to `/admin`.

---

## Setup

1. Add to `.env`:
   ```
   CLERK_SECRET_KEY="sk_..."
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
   ADMIN_EMAILS="you@...,partner@..."
   ```
2. `pnpm db:push` — adds `clerkUserId` column to Story table
3. In Clerk dashboard → Restrictions → enable Allowlist → add invited emails
4. `pnpm dev` → visit `/admin` while signed in with an admin email

---

## Notes

- Stories created before this change will have `clerkUserId = null` and show as "unknown user" in the admin feed
- User management (add/remove/block) is done in the Clerk dashboard, not the admin page
- The admin page is read-only — it shows activity, it doesn't manage users
