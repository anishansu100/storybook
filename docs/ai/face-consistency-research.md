# Face Consistency Research — What We Tried & What to Do Next

## The Problem

Every illustration page is generated as an independent call to the image model. Without a visual anchor, the model draws a different-looking person on every page. Text descriptions alone ("boy with brown skin, black curly hair") are not precise enough — diffusion models are probabilistic, so the same description produces different results each run.

---

## What We Built (then reverted)

We built and tested a full pipeline. Each piece worked individually, but the end result still didn't have satisfying face consistency. Here's exactly what we did and what we learned at each step.

### Step 1 — Claude Vision extracts character descriptions

A separate Claude Vision call analyzes the uploaded photos before narrative generation. It returns a structured JSON description of each main character:

```json
{
  "characters": [
    {
      "label": "young man",
      "description": "young man with light tan skin, short dark black hair, dark eyes, oval face, approximately 25 years old",
      "photoIndex": 5
    }
  ]
}
```

`photoIndex` tells us which uploaded photo has the clearest face of that character. These descriptions are injected verbatim into every illustration prompt.

**What worked:** Claude reliably identified the main 1–2 trip subjects and described them well. The `photoIndex` logic correctly picked the best reference photo. Text injection into prompts made the narrative-level descriptions noticeably more specific.

**What didn't work:** Text descriptions alone, even very detailed ones, don't anchor face identity across independent generation calls. The characters still looked like different people page to page.

---

### Step 2 — Florence-2 crops face regions

For each character's reference photo, we called `fal-ai/florence-2-large/open-vocabulary-detection` with `text_input: "face"`. This returned pixel-coordinate bounding boxes. We then used `sharp` (already in the project) to crop just the face region with 50% padding, and uploaded the crop to Supabase Storage.

**What worked:** Florence-2 face detection was accurate and fast. The crops were clean — correct faces, good framing. This step is solid and reusable.

**What didn't work:** Nothing — this step is a keeper for any future approach that needs face-only reference images.

---

### Step 3 — IP-Adapter via `fal-ai/flux-general`

We tried passing the cropped face images as IP-Adapter references to `fal-ai/flux-general`. This is where things broke.

**Problem 1 — Wrong field names:** The TypeScript SDK types for `IPAdapter` use `ip_adapter_image_url`, but the actual fal.ai REST API expects `image_url` and also requires `image_encoder_path`. The TypeScript types are out of date. Confirmed by hitting HTTP 422 "Field required" errors.

**Problem 2 — XLabs adapter fails to load:** After fixing the field names and adding `image_encoder_path: "openai/clip-vit-large-patch14"`, we got a new backend error: the `XLabs-AI/flux-ip-adapter` model failed to initialize on fal.ai's servers with a Python `AttributeError`. This is a reliability issue on fal.ai's side — the adapter isn't stable in production.

---

### Step 4 — `fal-ai/flux-pulid`

PuLID (Personalized Unified Latent Diffusion) is specifically designed for face identity preservation in stylized images. We switched to `fal-ai/flux-pulid` as the generation endpoint, passing the cropped face as `reference_image_url`.

**What worked:** The endpoint accepted the input without errors. It runs on Flux Dev quality (28 steps).

**What didn't work:** Face consistency was still not satisfying enough for production. The illustrated style and the face identity pulled in opposite directions — the model couldn't simultaneously maintain a children's book illustration aesthetic AND keep faces recognizable. The results were slightly better than text-only but not reliably consistent page to page.

**Hard limit of flux-pulid:** It only accepts ONE reference image (one person). For stories with a couple or family, you can only anchor one character at a time.

---

## Root Cause Summary

Diffusion models generate each image independently from noise. Without a mechanism that directly conditions the generation on a specific face embedding at every denoising step, faces will drift. The approaches we tried either:

- Failed to load on fal.ai (XLabs IP-Adapter)
- Traded illustration style for identity (PuLID in children's book context)
- Only supported one character at a time (flux-pulid)

Text descriptions help but have a ceiling — they're too ambiguous for a probabilistic model to lock onto.

---

## What Actually Works for Production Face Consistency

Based on research, here are the approaches used by real children's book AI products:

### Option A — LoRA Fine-tuning per character (Phase 3 in the original plan)

Train a small LoRA on 10–20 photos of each person. The LoRA embeds a "token" (e.g. `<person1>`) that maps to that specific face in any scene.

- **Pros:** Best consistency of any approach. Works across styles. Multi-character support.
- **Cons:** Requires ~10–20 minutes of GPU training per person. Adds cost per story (training + inference). Complex infra.
- **On fal.ai:** `fal-ai/flux-lora-fast-training` for training, then `fal-ai/flux-lora` for inference. Both exist in the SDK.

### Option B — Midjourney `--cref` (Character Reference)

Midjourney v6+ supports a `--cref <image_url>` flag that passes a character reference image and maintains identity across generations. It handles multiple characters with `--cref url1 url2`.

- **Pros:** Works out of the box, handles multiple characters, good style range.
- **Cons:** Midjourney doesn't have a public API (only Discord bot or unofficial wrappers). Not suitable for a production app without a reliable API.

### Option C — DALL-E 3 / GPT-4o image generation with "consistent characters"

OpenAI's image generation API (especially with GPT-4o) has improved character consistency through prompt engineering, but still doesn't match LoRA-level consistency.

### Option D — Stable Diffusion with InstantID or IP-Adapter FaceID

`InstantID` (from InstantX) was specifically built for single-image face consistency in stylized outputs. It's available on Replicate and some other providers.

- **On fal.ai:** `fal-ai/instantid` exists in the SDK as an endpoint. Worth trying directly.
- The key difference from regular IP-Adapter: InstantID uses a face encoder (ArcFace/InsightFace) that extracts identity features directly from the face geometry, not just CLIP visual features. This is more robust for stylized outputs.

### Option E — Consistent character sheets + img2img

Generate a "character sheet" (front/side/3/4 view) of each character once, then use it as an image-to-image reference for each story page with a low denoising strength (0.3–0.4). This preserves both identity and style.

- **On fal.ai:** `fal-ai/flux-general/image-to-image` exists in the SDK.

---

## Recommended Next Steps

**Quickest path to working face consistency:**

1. **Try `fal-ai/instantid`** — it's in the fal.ai SDK, purpose-built for face consistency in stylized outputs, uses InsightFace rather than CLIP. The fal.ai SDK type is `InstantidInput`. This is the most likely to work without LoRA training.

2. **If InstantID gives good results:** Wire it in as the Phase 2 strategy (same architecture we built — just swap the fal.ai endpoint and input format).

3. **If you need multi-character + production quality:** Implement LoRA fine-tuning via `fal-ai/flux-lora-fast-training`. This is Phase 3 and involves a training step per story (adds ~$0.50–2.00 cost and a few minutes wait), but gives the best results by far.

---

## What's Reusable From Our Work

Even though we reverted, the research and code patterns are solid:

- **Florence-2 face detection + sharp cropping** works well. The pattern for calling `fal-ai/florence-2-large/open-vocabulary-detection` and cropping with `sharp` is correct — just needs to be rewired to whatever face-anchoring endpoint is used.
- **Character extraction via Claude Vision** (with `photoIndex`) is a good pattern. Claude reliably picks the right reference photo.
- **`imageGen/` strategy pattern** (types.ts + index.ts + strategy files) makes it easy to swap endpoints — just add a new strategy file.
- **Art style consistency improvements** (specific style prompt with named artists, negative prompts, shared seed across pages) are all independent of face anchoring and should be kept regardless.

---

## fal.ai SDK Notes

- **`fal-ai/flux-general` IP-Adapter:** The TypeScript types are stale. Real API field names: `image_url`, `image_encoder_path`, `path`, `scale`. XLabs adapter (`XLabs-AI/flux-ip-adapter`) is unreliable in production.
- **`fal-ai/flux-pulid`:** Works but only supports one reference image. Face identity vs. art style is a hard tradeoff.
- **`fal-ai/instantid`:** Not yet tested. Most promising next candidate.
- **`fal-ai/flux-lora-fast-training` + `fal-ai/flux-lora`:** The proper long-term solution.
