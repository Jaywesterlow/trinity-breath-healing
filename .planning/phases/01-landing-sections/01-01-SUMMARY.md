---
phase: 01-landing-sections
plan: "01"
subsystem: ui
tags: [svelte, sveltekit, hero, lcp, seo, enhanced-img, service-tiles]

requires:
  - phase: 00-foundation-seo-scaffolding
    provides: EnhancedImage component, design tokens in global.css, brand.ts constants, image stubs

provides:
  - HeroSection.svelte — H1 "Rust in je hoofd. Ontspanning in je lichaam.", body copy, CTA button
  - Hero image with loading=eager fetchpriority=high (LCP element declared)
  - svelte:head <link rel=preload as=image fetchpriority=high> for hero image
  - 3 service tile <a> links: /diensten/spinal-touch, /diensten/goldhealing, /diensten/
  - +page.svelte Phase 0 placeholder replaced with HeroSection
  - SEO-09 <time datetime> recency block preserved in +page.svelte

affects:
  - 01-02 (header/nav — must not add second H1)
  - 01-03 through 01-08 (all landing sections mount in +page.svelte below HeroSection)
  - PRF audit — LCP preload link must remain in head

tech-stack:
  added: []
  patterns:
    - "?enhanced imports resolve to Picture type from vite-imagetools, not string — EnhancedImage src prop accepts Picture | string"
    - "svelte:head inside section component emits preload link SSR-safe (no browser guard needed)"
    - "heroPreloadHref extracted from Picture.img.src for preload href"

key-files:
  created:
    - src/lib/components/HeroSection.svelte
  modified:
    - src/lib/components/EnhancedImage.svelte
    - src/routes/+page.svelte

key-decisions:
  - "Hero preload via svelte:head inside HeroSection.svelte (Option B from RESEARCH) — simpler than prop-threading through Head.svelte"
  - "EnhancedImage src type widened to Picture | string to match vite-imagetools ?enhanced import type"

patterns-established:
  - "HeroSection.svelte: pure SSR, no $state/$effect/onMount — static content only"
  - "Service tiles: <a> links in initial HTML (crawlable, not JS-rendered)"
  - "CSS: mobile-first flex column, desktop grid at 1024px — all token variables only"

requirements-completed:
  - LND-01
  - PRF-02
  - PRF-03
  - PRF-04
  - A11Y-04

duration: 25min
completed: 2026-06-23
---

# Phase 1 Plan 01: Hero Section Summary

**HeroSection.svelte with SSR H1, LCP-eager hero image + preload link, body copy, CTA, and 3 crawlable service tile links replacing Phase 0 placeholder**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-23T00:01:20Z
- **Completed:** 2026-06-23T00:26:00Z
- **Tasks:** 2 (+ 1 bug fix)
- **Files modified:** 3

## Accomplishments

- HeroSection.svelte: Dutch H1 verbatim, body paragraph, "#contact" CTA, pure SSR (no onMount/$state/$effect)
- Hero EnhancedImage: loading=eager fetchpriority=high; svelte:head emits `<link rel="preload" as="image" fetchpriority="high">` server-side
- 3 service tile `<a>` links in initial HTML for crawler discoverability (D-04)
- +page.svelte: Phase 0 placeholder + PageTitle removed; HeroSection mounted; SEO-09 `<time datetime>` recency block preserved with token-only CSS
- 0 TypeScript errors (svelte-check: 522 files, 0 errors, 0 warnings)

## Task Commits

1. **Task 1: HeroSection.svelte** — `53ddf58` (feat)
2. **Task 2: +page.svelte update** — `682d347` (feat)

**Plan metadata:** (docs commit follows this summary)

## Files Created/Modified

- `src/lib/components/HeroSection.svelte` — Hero section: H1, body, CTA, eager image, svelte:head preload, 3 service tiles, mobile-first scoped CSS
- `src/lib/components/EnhancedImage.svelte` — src prop type widened: `string` → `Picture | string`
- `src/routes/+page.svelte` — Phase 0 placeholder replaced with `<HeroSection />`; SEO-09 time block preserved

## Decisions Made

- Used svelte:head inside HeroSection.svelte for the preload link (Research Option B) rather than prop-threading through Head.svelte — simpler, co-located with hero image imports
- heroPreloadHref derived from `(HeroImg as Picture).img.src` — the `Picture` type from vite-imagetools has `img.src` as the canonical hashed URL

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] EnhancedImage src prop typed as string, but ?enhanced imports are Picture objects**
- **Found during:** Task 1 (HeroSection.svelte creation)
- **Issue:** `src: string` in EnhancedImage.svelte Props caused TS2345 on all three `?enhanced` image imports passed to EnhancedImage. The ambient type declaration for `*?enhanced` resolves to `Picture` from vite-imagetools, not `string`.
- **Fix:** Added `import type { Picture } from 'vite-imagetools'` and changed `src: string` to `src: Picture | string` in EnhancedImage.svelte
- **Files modified:** src/lib/components/EnhancedImage.svelte
- **Verification:** svelte-check: 522 files, 0 errors (was 5 errors before fix)
- **Committed in:** 53ddf58 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — type bug)
**Impact on plan:** Required for correctness — the component was always intended for ?enhanced images but had an incorrect type annotation. No scope creep.

## Issues Encountered

- `npm run build` blocked by Bash sandbox during execution. Type check (svelte-check) passed with 0 errors; build must be verified by user with: `PUBLIC_SITE_URL=https://trinity-breath-healing.vercel.app npm run build`
- After build, verify: `node -e "const fs=require('fs');const h=fs.readFileSync('.svelte-kit/output/prerendered/pages/index.html','utf8');const h1s=(h.match(/<h1[^>]*>/g)||[]).length;const preload=h.includes('rel=\"preload\"');const eager=h.includes('loading=\"eager\"');const time=h.includes('<time');console.log('H1 count:',h1s,'preload:',preload,'eager:',eager,'time:',time);"`
- Expected: `H1 count: 1 preload: true eager: true time: true`

## Known Stubs

None — all service tile hrefs (/diensten/spinal-touch, /diensten/goldhealing, /diensten/) are real routes (Phase 0 stubs exist). CTA href="#contact" is an anchor — Contact section built in Plan 01-06.

## Threat Flags

None — static SSR content only. No new network endpoints, auth paths, or schema changes.

## Next Phase Readiness

- Hero section complete; +page.svelte ready to receive additional section components below HeroSection
- Plan 01-02 (Header + nav) builds independently — must not introduce second H1
- All image assets confirmed present: hero.png, card-spinal-touch.png, card-goldhealing.png

## Self-Check

- [x] `src/lib/components/HeroSection.svelte` exists
- [x] `src/lib/components/EnhancedImage.svelte` modified (Picture | string type)
- [x] `src/routes/+page.svelte` updated
- [x] Commit `53ddf58` exists (Task 1)
- [x] Commit `682d347` exists (Task 2)
- [x] svelte-check: 0 errors, 0 warnings

---
*Phase: 01-landing-sections*
*Completed: 2026-06-23*
