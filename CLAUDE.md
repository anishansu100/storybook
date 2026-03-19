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
  feat(story): add pagination to book viewer
  fix(upload): handle HEIC files from iPhone
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

## Claude Code Workflow

- **Plan docs**: Write plan/todo markdown files to `docs/ai/<feature-name>.md`. Do not scatter docs elsewhere in the project.
- **No auto-commits**: Never run `git add` or `git commit` unless explicitly asked. Always wait until the user has tested the changes.

## Commands

```bash
pnpm dev          # Start development server (Turbo)
pnpm build        # Production build
pnpm check        # Lint + typecheck (next lint && tsc --noEmit)
pnpm lint:fix     # Auto-fix lint issues
pnpm format:write # Format with Prettier

# Database
pnpm db:push      # Push schema changes to Supabase (uses DIRECT_URL)
pnpm db:generate  # Create migration files
pnpm db:migrate   # Deploy migrations (prod)
pnpm db:studio    # Open Prisma Studio UI
```

See `.env.example` for all required environment variables.

## Architecture

Children's storybook generator: **Next.js 15 App Router + tRPC v11 + Prisma + Supabase + Claude + Flux**.

### Generation flow

```
1. User uploads photos → /api/upload → HEIC files converted to JPEG → Supabase Storage
2. story.create tRPC mutation:
   a. Claude (vision) analyzes photos + context → 5-page narrative + illustration prompts
   b. Flux 1.1 Pro (fal.ai) generates one illustration per page
   c. Story + StoryPage records saved to Supabase DB
3. User redirected to /story/[id] → BookViewer (left: narrative, right: illustration)
```

### Image generation strategy pattern

`src/server/services/imageGen/` uses a swappable strategy:
- `flux.ts` — Phase 1: text-to-image via Flux 1.1 Pro (current)
- `ipAdapter.ts` — Phase 2: add this for face-reference via IP-Adapter
- `lora.ts` — Phase 3: add this for LoRA fine-tuning per person
- `index.ts` — exports active strategy; swap by setting `IMAGE_GEN_STRATEGY` env var

### Key layers

**`src/env.js`** — Zod-validated env schema. All vars must be declared here.

**`src/server/db.ts`** — Prisma client singleton (global var survives HMR).

**`src/server/storage.ts`** — Supabase Storage upload helper (server-only, uses service role key).

**`src/server/services/narrative.ts`** — Calls Claude with vision to analyze photos and return structured JSON `{ story: [{ pageNumber, narrative, illustrationPrompt }] }`. Parser handles both plain array and wrapped object responses.

**`src/server/api/routers/story.ts`** — tRPC: `create` (full generation pipeline), `getById`.

**`src/app/api/upload/route.ts`** — Handles file uploads; converts HEIC→JPEG using `heic-convert` before storing.

**`src/app/_components/`** — `UploadForm.tsx` (client), `BookViewer.tsx` (client).

### Supabase + Prisma connection setup

Two URLs are required (both in `.env`):
- `DATABASE_URL` — transaction pooler, port **6543**, must include `?pgbouncer=true` — used by the app at runtime
- `DIRECT_URL` — session pooler, port **5432** — used only by `pnpm db:push` / `pnpm db:migrate`

Without `?pgbouncer=true` on `DATABASE_URL`, Prisma will throw `prepared statement already exists` errors.

### Adding a new tRPC router

1. Create `src/server/api/routers/<name>.ts`
2. Add to `src/server/api/root.ts`
3. Access via `api.<name>.<procedure>` in server and client components

### Path alias

`~/*` maps to `src/*` (configured in `tsconfig.json`).
