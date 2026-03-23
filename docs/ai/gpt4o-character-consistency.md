# GPT-4o Character Consistency — Change Log

## Context

Previous attempts at face consistency (IP-Adapter, Florence-2 + PuLID) were reverted — see `face-consistency-research.md` for the full post-mortem. This phase implements a working solution using OpenAI's `gpt-image-1` model with reference image anchoring: the same technique behind ChatGPT's consistent-character feature.

---

## Approach

**Two-step anchoring:**
1. Claude Vision analyzes uploaded photos and extracts detailed descriptions of the 1–2 main characters (skin tone, hair, age, features)
2. `gpt-image-1` generates a canonical full-body character reference image for each character (text-to-image, children's book style)
3. For each story page, `gpt-image-1` `images/edit` receives the scene prompt + character reference images → generates a consistent illustration

This works because `gpt-image-1`'s edit endpoint composites reference images into the output at generation time, anchoring identity across independent calls.

---

## New Files

### `src/server/services/characterExtraction.ts`
- `extractCharacters(imageUrls)` — Claude Vision call, returns `{ label, description }[]` for the 1–2 main subjects
- `generateCharacterReferenceImages(characters, storyId)` — calls `gpt-image-1` text-to-image per character, uploads result to Supabase Storage, returns URL

### `src/server/services/imageGen/gpt4o.ts`
- New `ImageGenStrategy` implementation using `gpt-image-1`
- With `referenceImages`: calls `openai.images.edit` with character image files + scene prompt → b64_json → Supabase upload → URL
- Without `referenceImages`: calls `openai.images.generate` (pure text-to-image fallback)
- Image size: `1536x1024` (landscape), quality: `medium`

---

## Modified Files

| File | Change |
|------|--------|
| `src/server/api/routers/story.ts` | Parallel narrative + character extraction; reference image generation; enriched illustration prompts with character descriptions |
| `src/server/services/imageGen/index.ts` | Registered `gpt4o` strategy; set as default |
| `src/server/services/imageGen/flux.ts` | Lazy `fal.config()` init; marked as fallback strategy |
| `src/env.js` | Added `OPENAI_API_KEY` (required); made `FAL_API_KEY` optional |
| `.env.example` | Documented `OPENAI_API_KEY` and `IMAGE_GEN_STRATEGY` |

---

## Generation Flow (updated)

```
story.create:
  1. Parallel:
     a. generateNarrative(imageUrls, tripContext)     ← Claude Vision, unchanged
     b. extractCharacters(imageUrls)                  ← Claude Vision, new
  2. generateCharacterReferenceImages(characters)     ← gpt-image-1, new
  3. For each page (sequential):
     imageGen.generate({ prompt + charDesc, referenceImageUrls, style })
     → gpt-image-1 images/edit → b64_json → Supabase → URL
  4. Save pages to DB
```

---

## Strategy Switching

`IMAGE_GEN_STRATEGY` env var controls which backend is used:

| Value | Backend | Requires |
|-------|---------|----------|
| `gpt4o` (default) | `gpt-image-1` via OpenAI | `OPENAI_API_KEY` |
| `flux` | Flux Schnell via fal.ai | `FAL_API_KEY` |

To revert to Flux: set `IMAGE_GEN_STRATEGY=flux` and `FAL_API_KEY=...` in `.env`. Character extraction still runs but reference images are ignored by the Flux strategy.

---

## Cost Notes

- `gpt-image-1` medium quality: ~$0.04–0.07/image × 7 images/story (5 pages + 2 char refs) ≈ $0.30–0.50/story
- Flux Schnell: ~$0.003/image × 5 pages ≈ $0.015/story (no character consistency)

---

## Package Added

```bash
pnpm add openai  # openai@6.32.0
```
