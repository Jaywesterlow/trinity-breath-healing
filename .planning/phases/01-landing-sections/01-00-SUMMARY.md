---
phase: 01-landing-sections
plan: "00"
subsystem: testing
tags: [playwright, vitest, ci, shell, svg, png, phase1-contracts]

# Dependency graph
requires:
  - phase: 00-foundation-seo-scaffolding
    provides: "CI pipeline, html-audit.spec.ts, schema-faq.test.ts, vitest config, vite.config.ts"
provides:
  - "check-copy.sh: locked Figma copy gate (LND-09) + hedge-language scan (LND-10)"
  - "Phase 1 html-audit Playwright assertions block (PRF-02, PRF-03, A11Y-01, LND-05, A11Y-02, PRF-07)"
  - "schema-faq.test.ts faqItems.length >= 8 guard gated on fs.existsSync"
  - "5 x 1x1 PNG image stubs so build never fails on missing assets"
  - "static/logo.svg placeholder served at /logo.svg"
  - "ci.yml check-copy.sh gate step after HTML audit"
affects: [01-01-hero, 01-02-services-carousel, 01-03-about, 01-04-faq, 01-05-contact, 01-06-booking, 01-07-faq-content]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "fs.existsSync guard before dynamic import to prevent Vite transform-time alias resolution errors"
    - "test.describe (not bare describe) for Playwright html-audit.spec.ts blocks"

key-files:
  created:
    - scripts/check-copy.sh
    - src/lib/assets/images/hero.png
    - src/lib/assets/images/card-spinal-touch.png
    - src/lib/assets/images/card-goldhealing.png
    - src/lib/assets/images/about-illustration-1.png
    - src/lib/assets/images/about-illustration-2.png
    - static/logo.svg
  modified:
    - tests/integration/html-audit.spec.ts
    - tests/unit/schema-faq.test.ts
    - .github/workflows/ci.yml

key-decisions:
  - "Use fs.existsSync guard before dynamic import — Vite import-analysis resolves aliases statically at transform time; try/catch and @vite-ignore do not prevent the transform error when the alias target is absent"
  - "Use test.describe not bare describe in Playwright spec files — @playwright/test does not export a top-level describe symbol"
  - "Place check-copy.sh step after HTML audit step (not after build step) so it runs in the same CI context with the prerendered output already present"

patterns-established:
  - "Conditional test pattern: fs.existsSync gate + it.skipIf(!exists) + absolute path import to avoid Vite alias resolution on missing files"
  - "Playwright spec describe pattern: use test.describe() not describe() — @playwright/test does not export top-level describe"

requirements-completed:
  - LND-09
  - LND-10
  - PRF-02
  - PRF-03
  - PRF-05
  - PRF-06
  - PRF-07
  - A11Y-02

# Metrics
duration: 7min
completed: 2026-06-23
---

# Phase 1 Plan 00: Wave 0 CI Infrastructure Summary

**Copy-preservation gate (check-copy.sh), Phase 1 Playwright red-test contracts, image stubs, and logo placeholder establishing the CI floor before any landing section ships**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-22T23:32:21Z
- **Completed:** 2026-06-22T23:39:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- `scripts/check-copy.sh` gates CI against missing locked Figma copy strings and hedge language (LND-09, LND-10)
- Phase 1 `test.describe` block in `html-audit.spec.ts` asserts 6 landing-page contracts that sub-units 01-01 through 01-06 must satisfy (red until implemented)
- 5 x 1x1 PNG stubs + `static/logo.svg` ensure `npm run build` succeeds before real assets arrive

## Task Commits

Each task was committed atomically:

1. **Task 1: check-copy.sh + html-audit Phase 1 assertions + schema-faq conditional** - `de04883` (feat)
2. **Task 2: image stubs, logo placeholder, ci.yml check-copy step** - `fc5eeba` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `scripts/check-copy.sh` — Bash CI gate: 6 locked copy strings + hedge-language scan
- `tests/integration/html-audit.spec.ts` — Added `test.describe('Phase 1 landing-page assertions', ...)` block: PRF-02 hero preload, PRF-03 eager-once, A11Y-01 dialog role, LND-05 5+ diensten links, A11Y-02 label count, PRF-07 no external scripts
- `tests/unit/schema-faq.test.ts` — Added `faqItems.length >= 8` guard (skipped via `it.skipIf(!faqContentExists)` until sub-unit 01-07 ships)
- `src/lib/assets/images/hero.png` — 1x1 PNG stub
- `src/lib/assets/images/card-spinal-touch.png` — 1x1 PNG stub
- `src/lib/assets/images/card-goldhealing.png` — 1x1 PNG stub
- `src/lib/assets/images/about-illustration-1.png` — 1x1 PNG stub
- `src/lib/assets/images/about-illustration-2.png` — 1x1 PNG stub
- `static/logo.svg` — Text placeholder SVG at `/logo.svg`
- `.github/workflows/ci.yml` — Added `check-copy.sh` step after HTML audit step

## Decisions Made

- `fs.existsSync` guard before dynamic import: Vite's `vite:import-analysis` plugin resolves alias targets statically at transform time. Neither `try/catch` nor `/* @vite-ignore */` prevents the transform error when the alias target file is absent. The only safe approach is to avoid the aliased string entirely by computing the absolute path via `path.resolve` and gating the import on `fs.existsSync`.
- `test.describe` not bare `describe`: `@playwright/test` does not export a top-level `describe` symbol. Using bare `describe` causes a TypeScript error in `svelte-check`. All Playwright `describe` blocks must use `test.describe`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Vite transform-time alias resolution failure in schema-faq.test.ts**
- **Found during:** Task 1 (schema-faq conditional import)
- **Issue:** Dynamic `import('$lib/content/faq/index')` with try/catch caused `vite:import-analysis` transform error at build time even when the file doesn't exist. Neither try/catch nor `/* @vite-ignore */` suppressed it.
- **Fix:** Changed approach to `fs.existsSync(path.resolve('src/lib/content/faq/index.ts'))` + `it.skipIf(!faqContentExists)` + `import(/* @vite-ignore */ FAQ_CONTENT_PATH)` using the resolved absolute path.
- **Files modified:** `tests/unit/schema-faq.test.ts`
- **Verification:** `node node_modules/vitest/vitest.mjs --run tests/unit/schema-faq.test.ts` — 11 pass, 1 skip.
- **Committed in:** de04883 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed bare `describe` to `test.describe` in html-audit.spec.ts**
- **Found during:** Task 2 (svelte-check after ci.yml edit)
- **Issue:** `describe(...)` caused TypeScript error "Cannot find name 'describe'" — `@playwright/test` does not export a top-level `describe`.
- **Fix:** Changed `describe` to `test.describe` throughout the new Phase 1 block.
- **Files modified:** `tests/integration/html-audit.spec.ts`
- **Verification:** `svelte-check` reports 0 errors 0 warnings.
- **Committed in:** fc5eeba (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs — Vite transform behavior and Playwright API surface)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered

- Pre-existing `robots.test.ts` failure (1 test): `Sitemap:` line regex `$/` fails on Windows CRLF line endings. Pre-dates this plan (committed in Phase 0). Out of scope — logged as deferred item.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| 1x1 transparent PNG | `src/lib/assets/images/hero.png` | Real practitioner photo pending (photographer blocked — see STATE.md) |
| 1x1 transparent PNG | `src/lib/assets/images/card-spinal-touch.png` | Real service image pending sub-unit 01-02 |
| 1x1 transparent PNG | `src/lib/assets/images/card-goldhealing.png` | Real service image pending sub-unit 01-02 |
| 1x1 transparent PNG | `src/lib/assets/images/about-illustration-1.png` | Real illustration pending sub-unit 01-03 |
| 1x1 transparent PNG | `src/lib/assets/images/about-illustration-2.png` | Real illustration pending sub-unit 01-03 |
| Text SVG logo | `static/logo.svg` | Real brand logo pending sub-unit 01-01 or Phase 2 |

All stubs are intentional Wave 0 placeholders. Each sub-unit plan that implements the corresponding section must replace the stub with the real asset.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Wave 0 CI floor is in place. Sub-unit plans 01-01 through 01-07 can now execute in Waves 1-5.
- Phase 1 html-audit assertions are red until sub-units implement their sections — that is correct.
- The check-copy.sh step in CI will fail on Phase 1 feature branches until sub-units ship the locked copy — that is correct.
- Pre-existing robots.test.ts CRLF issue should be fixed in a cleanup pass (non-blocking).

---
*Phase: 01-landing-sections*
*Completed: 2026-06-23*
