# Plan: Frontend UI Polish — Port Replit Design

## Context
Phase 1 MVP is functionally complete but uses bare inline styles. The user created a Replit design prototype ("TripTales") defining the full visual design system. This plan ports that design into the Next.js app as purely FE work — no backend files touched.

Design source: `/Users/jasonpien/Downloads/Storybook-Creator/`

---

## Design system

- **App name:** TripTales (📚)
- **Colors (HSL):** Sky blue primary, sunshine yellow secondary, coral pink accent, soft off-white background
- **Fonts:** Nunito (body) + Fredoka (headings) via `next/font/google`
- **Radius:** `--radius: 1rem` default, rounded everywhere
- **Animations:** Framer Motion — page transitions, thumbnail entrance, loading spinner

---

## Packages added

```bash
pnpm add lucide-react framer-motion
```

---

## Files changed

| File | Change |
|------|--------|
| `src/styles/globals.css` | Design token CSS vars, font vars, float animation, base layer |
| `src/app/layout.tsx` | Nunito + Fredoka fonts, updated metadata, Header + footer |
| `src/app/_components/Header.tsx` | New — sticky header: logo, nav, mobile menu |
| `src/app/page.tsx` | Hero with embedded UploadForm + 3 feature cards |
| `src/app/create/page.tsx` | Redirect to `/` |
| `src/app/_components/UploadForm.tsx` | Drag-and-drop zone, thumbnail previews, generating overlay |
| `src/app/_components/BookViewer.tsx` | Book spread, Framer Motion transitions, action buttons |
| `src/app/story/[id]/page.tsx` | Styled failed state + back link |

---

## Key design decisions

- Upload form lives on home page `/` (matching prototype), `/create` redirects to `/`
- No shadcn/ui — pure Tailwind v4 utilities
- Loading state is a full-screen overlay rendered inside UploadForm when `status === "generating"` (no new route — keeps tRPC mutation in scope)
- Payment/share/download buttons exist in BookViewer UI but are visually disabled with "Coming soon" — not wired to any logic

---

## Todo checklist

- [x] Create `docs/ai/fe-polish-phase1.md`
- [x] `pnpm add lucide-react framer-motion`
- [x] Update `src/styles/globals.css` — design tokens
- [x] Update `src/app/layout.tsx` — fonts, metadata, Header, footer
- [x] Create `src/app/_components/Header.tsx`
- [x] Rewrite `src/app/page.tsx` — hero + upload + feature cards
- [x] Update `src/app/create/page.tsx` — redirect to `/`
- [x] Rewrite `src/app/_components/UploadForm.tsx`
- [x] Rewrite `src/app/_components/BookViewer.tsx`
- [x] Polish `src/app/story/[id]/page.tsx`
- [x] `pnpm check` passes clean

---

## Verification

1. `pnpm dev` — visual inspection:
   - `/` — hero with logo/nav, upload zone embedded, feature cards
   - Upload photos → thumbnail grid appears → submit → generating overlay with progress bar
   - `/story/[id]` — book spread, prev/next, disabled action buttons
2. `pnpm check` — lint + typecheck clean
