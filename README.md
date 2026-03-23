# Storybook

A web app that turns family trip photos into AI-generated children's storybooks. Parents upload photos, and the app uses Claude to write a narrative and GPT-4o to generate consistent, character-anchored illustrations, laid out in a page-flip book UI.

## Stack

- **Next.js 15** (App Router) + **tRPC v11** + **Prisma** + **Tailwind CSS v4**
- **Supabase** — PostgreSQL database + file storage
- **Anthropic Claude** — character extraction + narrative generation (vision)
- **OpenAI gpt-image-1** — illustration generation with character reference image anchoring
- **fal.ai Flux Schnell** — optional fallback image generator (`IMAGE_GEN_STRATEGY=flux`)

## Setup

1. Clone the repo and install dependencies:
   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env` and fill in all values (see below)

3. Push the database schema:
   ```bash
   pnpm db:push
   ```

4. Start the dev server:
   ```bash
   pnpm dev
   ```

## Environment variables

See `.env.example` for the full list. You need:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → Connection Pooling → **Transaction** mode (port 6543) — append `?pgbouncer=true` |
| `DIRECT_URL` | Same page, **Session** mode (port 5432) — used by Prisma migrations only |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `OPENAI_API_KEY` | platform.openai.com → API Keys |
| `FAL_API_KEY` | fal.ai → Dashboard → API Keys — **optional**, only needed if using `IMAGE_GEN_STRATEGY=flux` |

### Supabase storage

Create a public bucket named `storybook-uploads` in Supabase → Storage.

## Project structure

```
src/
  app/
    create/           # Upload form page
    story/[id]/       # Book viewer page
    api/upload/       # Image upload + HEIC→JPEG conversion
    _components/      # UploadForm, BookViewer
  server/
    api/routers/      # tRPC routers (story: create, getById)
    services/
      imageGen/       # Swappable image generation strategy (gpt4o default, flux fallback)
      characterExtraction.ts  # Claude vision → character descriptions + gpt-image-1 reference images
      narrative.ts    # Claude vision → story narrative + illustration prompts
    storage.ts        # Supabase Storage helpers
docs/
  ai/                 # AI-generated plan docs for each feature
```

## Roadmap

- **Phase 1** ✅ — Upload photos → Claude narrative → Flux illustrations → book viewer
- **Phase 2** ✅ — Character consistency via GPT-4o reference image anchoring + PDF download
- **Phase 3** — Auth, accounts, order physical book + payment
