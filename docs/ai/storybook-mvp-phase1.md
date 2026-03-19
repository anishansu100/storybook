# Plan: Storybook MVP — Phase 1

## Context
Building a children's storybook generator where parents upload trip photos, and AI generates a narrative + children's book-style illustrations laid out in a page-flip book UI.

Phase 1 goal: establish the full end-to-end pipeline with bare-bones UI and no face consistency yet. Architecture is designed so image generation strategy is swappable (Phase 2: IP-Adapter, Phase 3: LoRA).

---

## Prerequisites (manual steps before coding)

### 1. Create Supabase project
1. Go to [supabase.com](https://supabase.com) → sign up → New Project
2. **Storage**: Create a bucket named `storybook-uploads`, set to **Public**
3. **Database URL**: Settings → Database → Connection Pooling → Transaction mode → copy URI (port 6543)
4. **API keys**: Settings → API → copy Project URL, anon key, service_role key

### 2. Get API keys
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com) → API Keys
- **fal.ai**: [fal.ai/dashboard](https://fal.ai/dashboard) → API Keys

---

## New environment variables
Add to `.env` (and update `src/env.js` schema):
```
DATABASE_URL="postgresql://..."        # Supabase transaction pooler (port 6543)
ANTHROPIC_API_KEY="sk-ant-..."
FAL_API_KEY="..."
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

---

## New packages
```bash
pnpm add @anthropic-ai/sdk @fal-ai/client @supabase/supabase-js
```

---

## Database schema (prisma/schema.prisma)
Replace SQLite + Post model with PostgreSQL + Story/StoryPage:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Story {
  id                String      @id @default(cuid())
  tripContext       String?
  status            StoryStatus @default(PENDING)
  uploadedImageUrls String[]
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  pages             StoryPage[]
}

enum StoryStatus {
  PENDING
  GENERATING
  COMPLETE
  FAILED
}

model StoryPage {
  id                 String   @id @default(cuid())
  storyId            String
  story              Story    @relation(fields: [storyId], references: [id])
  pageNumber         Int
  narrative          String
  illustrationPrompt String
  illustrationUrl    String?
  createdAt          DateTime @default(now())

  @@index([storyId])
}
```

---

## File structure

### New files to create
```
src/
  server/
    services/
      imageGen/
        types.ts          ← ImageGenStrategy interface
        flux.ts           ← Phase 1: Flux 1.1 Pro via fal.ai (text-to-image)
        index.ts          ← exports active strategy based on IMAGE_GEN_STRATEGY env var
      narrative.ts        ← Claude API: analyze photos → generate page narratives + prompts
    storage.ts            ← Supabase Storage helpers (upload file, get public URL)
    api/
      routers/
        story.ts          ← tRPC router: create, getById
  app/
    create/
      page.tsx            ← upload form page (Server Component shell)
    story/
      [id]/
        page.tsx          ← book viewer page
    _components/
      UploadForm.tsx      ← client component: multi-image dropzone + context textarea
      BookViewer.tsx      ← client component: left/right page layout with prev/next nav
      GeneratingStatus.tsx ← loading state shown during generation
```

### Files to modify
- `prisma/schema.prisma` — as above
- `src/env.js` — add new env var schemas
- `src/server/api/root.ts` — register story router, remove post router
- `src/app/page.tsx` — replace scaffold content with "Create a storybook" CTA
- `.env.example` — document new vars

### Files to delete
- `src/server/api/routers/post.ts`
- `src/app/_components/post.tsx`

---

## Generation flow

```
1. User selects images + types context → clicks Submit
2. UploadForm:
   - POSTs each image to /api/upload (Next.js route handler)
   - Route handler uploads to Supabase Storage → returns public URLs
3. UploadForm calls tRPC story.create({ imageUrls, tripContext })
4. story.create mutation (server):
   a. Creates Story record (status: GENERATING)
   b. Sends image URLs + context to narrative.ts (Claude claude-sonnet-4-6 with vision)
      → Returns array of { pageNumber, narrative, illustrationPrompt } (5-6 pages)
   c. For each page: calls imageGen.generate({ prompt, style: "children's book illustration" })
      → Flux 1.1 Pro via fal.ai → returns imageUrl
   d. Creates StoryPage records in DB
   e. Updates Story status to COMPLETE
   f. Returns storyId
5. Frontend redirects to /story/[id]
6. BookViewer renders pages: left = narrative text, right = illustration image
```

**Note**: Generation takes ~60-90s synchronously. For local dev this is fine. On Vercel, set `export const maxDuration = 120` on the tRPC route handler.

---

## Key implementation details

### `src/server/services/imageGen/types.ts`
```ts
export interface ImageGenStrategy {
  generate(params: {
    prompt: string
    referenceImages?: string[]  // unused in Phase 1, ready for Phase 2
    style: string
  }): Promise<{ imageUrl: string }>
}
```

### `src/server/services/narrative.ts`
Claude call pattern:
- System prompt: "You are a children's book author..."
- User message: attach each image URL + trip context
- Ask for structured JSON output: array of `{ pageNumber, narrative, illustrationPrompt }`
- illustrationPrompt should describe the scene for image generation in children's book style

### `src/server/storage.ts`
- `uploadFile(buffer, filename, contentType)` → returns public URL
- Uses Supabase service role key (server-only)

### Book viewer UI (bare bones)
- Two columns: left = narrative text, right = `<img>` tag
- Prev/Next buttons to navigate pages
- No styling required — functional only

---

## Todo checklist

- [ ] Manual: Create Supabase project + storage bucket + collect API keys
- [ ] Install new packages (`@anthropic-ai/sdk`, `@fal-ai/client`, `@supabase/supabase-js`)
- [ ] Update `src/env.js` with new env vars
- [ ] Update `prisma/schema.prisma` (PostgreSQL, new models)
- [ ] Run `pnpm db:push` to apply schema to Supabase
- [ ] Create `src/server/storage.ts`
- [ ] Create `src/server/services/imageGen/types.ts`
- [ ] Create `src/server/services/imageGen/flux.ts`
- [ ] Create `src/server/services/imageGen/index.ts`
- [ ] Create `src/server/services/narrative.ts`
- [ ] Create `src/server/api/routers/story.ts`
- [ ] Update `src/server/api/root.ts`
- [ ] Create `/api/upload` route handler
- [ ] Create `src/app/create/page.tsx` + `UploadForm.tsx`
- [ ] Create `src/app/story/[id]/page.tsx` + `BookViewer.tsx`
- [ ] Update `src/app/page.tsx` (home → CTA)
- [ ] Delete old post router + component
- [ ] Update `.env.example`
- [ ] Run `pnpm check` to verify no type errors
- [ ] Manual: test full flow end-to-end

---

## Verification
1. `pnpm dev` starts without errors
2. Home page shows "Create a storybook" button
3. Create page: can select multiple images + type context → submit
4. Loading state shows during generation (~60-90s)
5. Book viewer at `/story/[id]` shows pages: narrative left, illustration right
6. Prev/Next navigation works
7. `pnpm check` passes clean
