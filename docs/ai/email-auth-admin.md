# Email Auth + Admin Dashboard — Change Log

## Context

TripTales was fully open — anyone with the URL could generate stories. This phase adds an invite-only email gate and an admin dashboard so Jason and his partner can control who has access and see what guests have done.

---

## Approach

**Email-only allowlist** — no passwords, no magic links. Users enter their email on a login page; if it's in the `AllowedEmail` table, they get a signed 7-day encrypted session cookie and are let in. Removing someone from the list blocks their next login; their active session expires naturally within 7 days.

**Admin dashboard** at `/admin` — protected by `ADMIN_EMAILS` env var. Shows the guest list, per-user stats, and a live activity feed.

---

## New Packages

```bash
pnpm add iron-session  # v8.0.4 — encrypts session data into a signed httpOnly cookie
```

---

## New Database Models (`prisma/schema.prisma`)

```prisma
model AllowedEmail {
  id      String   @id @default(cuid())
  email   String   @unique
  addedAt DateTime @default(now())
  addedBy String                       // which admin added them (or "seed")
}

model AccessLog {
  id        String   @id @default(cuid())
  email     String
  action    String                     // "login" | "story_created"
  metadata  Json?                      // e.g. { storyId: "..." }
  createdAt DateTime @default(now())

  @@index([email])
  @@index([createdAt])
}
```

Also added `createdByEmail String?` + `@@index([createdByEmail])` to the existing `Story` model.

---

## New Env Vars

| Var | Description |
|-----|-------------|
| `SESSION_SECRET` | 32+ char random string — used by iron-session to encrypt the cookie |
| `ADMIN_EMAILS` | Comma-separated admin emails e.g. `jason@...,partner@...` |

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/session.ts` | iron-session config (`cookieName`, `password`, 7-day TTL), `getAdminEmails()` helper |
| `src/middleware.ts` | Edge middleware — decrypts cookie on every request; redirects to `/login` if missing/invalid; blocks `/admin` for non-admins |
| `src/app/login/page.tsx` | Email input form; POSTs to `/api/auth/login`; shows error on 403 |
| `src/app/api/auth/login/route.ts` | Checks AllowedEmail table → sets session cookie → writes AccessLog `login` entry |
| `src/app/api/auth/logout/route.ts` | Destroys session cookie |
| `src/app/admin/page.tsx` | Server component — guest list with stats, add-user form, activity feed (last 100 events) |
| `src/app/admin/_actions.ts` | Server Actions: `addUser`, `removeUser` (both require admin session) |

---

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added AllowedEmail, AccessLog, Story.createdByEmail |
| `src/env.js` | Added SESSION_SECRET (required, min 32 chars), ADMIN_EMAILS (required) |
| `src/server/api/trpc.ts` | Reads session cookie in `createTRPCContext` → injects `userEmail` into all tRPC procedures |
| `src/server/api/routers/story.ts` | Stamps `createdByEmail` on Story creation; writes AccessLog `story_created` entry on success |
| `src/app/_components/Header.tsx` | Added **Sign out** button (desktop + mobile) — calls `/api/auth/logout` then redirects to `/login` |

---

## Architecture Notes

- **Middleware is Edge-compatible** — uses `unsealData` from iron-session directly (no Prisma, no Node.js APIs). Fast path: if no cookie → immediate redirect, no DB hit.
- **No DB hit per request** — the allowlist check only happens at login time. Active sessions remain valid for 7 days after a user is removed.
- **Admin protection is env-var-based** — `ADMIN_EMAILS` is parsed in middleware and in the `requireAdmin()` server action guard. No separate admin table needed.
- **tRPC context carries `userEmail`** — all routers get the caller's email without parsing cookies themselves.

---

## Setup (first time)

1. Generate a session secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Add to `.env`: `SESSION_SECRET="..."` and `ADMIN_EMAILS="you@...,partner@..."`
3. `pnpm db:push` — creates AllowedEmail, AccessLog tables
4. Seed admin emails in Prisma Studio (`pnpm db:studio`) or via the node one-liner in the main README
5. `pnpm dev` — visit `/` and you'll be redirected to `/login`

---

## What Was Tested

| Test | Expected | Result |
|------|----------|--------|
| `GET /` with no session | 307 redirect to `/login?from=/` | PASS |
| `GET /` with valid session | 200, home page loads | PASS |
| `POST /api/auth/login` — unknown email | 403 | PASS |
| `POST /api/auth/login` — allowed email | 200 + encrypted `triptales-session` cookie | PASS |
| `GET /admin` with valid admin session | 200, dashboard loads | PASS |
| `GET /admin` with non-admin session | 307 redirect to `/login` | PASS |
| `pnpm check` (lint + typecheck) | Clean | PASS |

---

## Managing Guests

- **Add a guest**: log in with an admin email → go to `/admin` → use the Add form
- **Remove a guest**: `/admin` → click Remove next to their email (takes effect on their next login)
- **See activity**: `/admin` activity feed shows all logins and stories created, most recent first
