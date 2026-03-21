# UI Polish — Change Log

## Typography & Spacing

- Defined a **Major Third (×1.25) type scale** in `globals.css` via Tailwind v4 `@theme inline`:
  - `text-xs` → 0.64rem (captions, page numbers)
  - `text-sm` → 0.80rem (nav, labels)
  - `text-base` → 1.00rem (body)
  - `text-md` → 1.25rem (card text, sub-labels)
  - `text-lg` → 1.56rem (sub-headings)
  - `text-xl` → 1.95rem (section headings)
  - `text-2xl` → 2.44rem (page titles)
  - `text-3xl` → 3.05rem (hero mobile)
  - `text-4xl` → 3.81rem (hero desktop)
- Documented an **8pt spacing grid** in `globals.css` (gap-2, gap-4, gap-6, gap-8, gap-12, py-16, py-20)
- Applied consistent spacing across all pages and components

## Pages

### `src/app/page.tsx`
- Split hero into four separate `<section>` elements: Badge, Headline, Upload, Feature Cards
- Each section uses consistent `px-6`, `pt-20`/`pb-20`, `gap-6` spacing
- Feature cards use `flex-col md:flex-row` layout

### `src/app/story/[id]/page.tsx`
- Restructured into vertical flex sections with consistent `px-6`, `pt-10`, `pb-20`

## Header (`Header.tsx`)

- Removed Examples and Pricing nav links
- Commented out Sign In and Get Started buttons
- Home nav link absolutely centered in the header

## BookViewer (`BookViewer.tsx`)

- **Two-page spread**: both sides fixed at `w-1/2` so the binding divider sits at true 50%
- **Ragged clip-path borders** on illustrations: seeded per page using a deterministic RNG — consistent across re-renders, unique per page
- **Font size control**: small A / large A buttons below the book (range: 0.7–5rem, default 1.4rem)
- **Text color picker**: circular color swatch next to font controls
- **Scrollable text**: narrative overflows with `overflow-y-auto` at large font sizes
- **Page numbers**: both left and right corners show story page number (1–5)
- Removed unnecessary `z-10` and gradient overlay from illustration page

## UploadForm (`UploadForm.tsx`)

- **HEIC client-side preview**: `heic2any` converts HEIC files to JPEG blobs in the browser before displaying thumbnails
- **Loading spinner** shown per thumbnail while HEIC conversion is in progress
- Increased drop zone padding (`p-12`) and form vertical padding (`py-8`)
- Consistent `space-y-6` gap between form elements

## Image Generation

- Switched model from `fal-ai/flux-pro/v1.1` (~$0.04/image) to `fal-ai/flux/schnell` (~$0.003/image)

## Narrative Parser (`narrative.ts`)

- Tightened system prompt to prevent Claude from prepending note objects before the JSON array
- Added regex fallback to extract JSON array even if Claude includes a preamble note
