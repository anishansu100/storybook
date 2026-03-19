# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Collaboration

### Branch strategy
- **Currently**: pushing directly to `main` is fine while working solo
- **When both collaborators are active**: enable branch protection on GitHub (Settings → Branches), then branch from `main` and open PRs to merge back
- Branch naming: `feat/<description>`, `fix/<description>`, `chore/<description>`
- Keep branches short-lived; merge or rebase frequently to avoid drift

### Commit messages — Conventional Commits
```
<type>(<optional scope>): <short description>

Types: feat | fix | chore | refactor | docs | style | test
Examples:
  feat(post): add pagination to getLatest query
  fix(auth): handle expired session tokens
  chore: upgrade prisma to v7
```

### PR workflow
1. Run `pnpm check` (lint + typecheck) before opening a PR — this is the merge gate
2. Fill out the PR template (`.github/pull_request_template.md`)
3. Get at least one approval before merging (or self-merge when solo and green)
4. Prefer **squash merge** to keep `main` history clean

### Conflict prevention
- Communicate before touching `prisma/schema.prisma` — schema changes cause the most conflicts
- Pull and rebase from `main` before starting new work: `git pull --rebase origin main`

## Commands

```bash
pnpm dev          # Start development server (Turbo)
pnpm build        # Production build
pnpm check        # Lint + typecheck (next lint && tsc --noEmit)
pnpm lint         # ESLint only
pnpm lint:fix     # Auto-fix lint issues
pnpm typecheck    # TypeScript check only
pnpm format:write # Format with Prettier

# Database
pnpm db:push      # Push schema changes to DB (dev)
pnpm db:generate  # Create migration files
pnpm db:migrate   # Deploy migrations (prod)
pnpm db:studio    # Open Prisma Studio UI
```

Requires `DATABASE_URL` in `.env` (see `.env.example`). Default: `file:./db.sqlite`.

## Architecture

T3 Stack app: **Next.js 15 App Router + tRPC v11 + Prisma + Tailwind CSS v4**.

### Data flow

```
Client Component → tRPC React hooks → HTTP batch to /api/trpc → tRPC router → Prisma → SQLite
Server Component → server-side tRPC caller → tRPC router → Prisma → SQLite (no HTTP)
```

### Key layers

**`src/env.js`** — Zod-validated environment schema. All env vars must be declared here; Next.js config imports this to validate at build time.

**`src/server/db.ts`** — Prisma client singleton. Uses global variable in dev to survive HMR without exhausting connections.

**`src/server/api/`** — tRPC backend:
- `trpc.ts` — context (db + headers), SuperJSON transformer, Zod error formatting, timing middleware
- `routers/post.ts` — example router with `hello`, `create`, `getLatest` procedures
- `root.ts` — aggregates all routers; exports `AppRouter` type

**`src/trpc/`** — Client-side tRPC setup:
- `react.tsx` — `TRPCReactProvider` with HTTP batch streaming link; wraps app in `layout.tsx`
- `server.ts` — RSC helpers (`trpc`, `HydrateClient`, `prefetch`) using `server-only`
- `query-client.ts` — React Query config with 30s stale time and SuperJSON serialization

**`src/app/`** — Next.js App Router pages/layouts. Server Components prefetch via `prefetch()` + `<HydrateClient>`. Client Components use `useSuspenseQuery` / `useMutation` from `api.post.*`.

### Adding a new tRPC router

1. Create `src/server/api/routers/<name>.ts` with procedures
2. Add to `src/server/api/root.ts`
3. Access via `api.<name>.<procedure>` in both server and client components

### Path alias

`~/*` maps to `src/*` (configured in `tsconfig.json`).
