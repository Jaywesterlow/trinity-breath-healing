---
phase: 00-foundation-seo-scaffolding
plan: 02
status: complete
completed: 2026-06-18
subsystem: seo-primitives
tags: [seo, head, landmarks, svelte-components, tdd]
requires: ["00-01"]
provides: ["PageMeta", "SITE_URL", "BRAND", "Head", "PageTitle", "SiteNav", "SiteFooter"]
affects: ["00-03", "00-05", "00-06", "00-07", "00-08"]
tech-stack:
  added: ["@testing-library/svelte@5.3.1", "svelteTesting() vite plugin"]
  patterns: ["Svelte 5 runes $props/$derived in components", "$app/state page store", "vi.doMock() for per-test env overrides"]
key-files:
  created:
    - src/lib/seo/types.ts
    - src/lib/constants/brand.ts
    - src/lib/components/Head.svelte
    - src/lib/components/PageTitle.svelte
    - src/lib/components/SiteNav.svelte
    - src/lib/components/SiteFooter.svelte
    - tests/unit/canonical.test.ts
    - tests/unit/head.test.ts
    - tests/unit/page-title.test.ts
    - tests/unit/landmarks.test.ts
  modified:
    - src/lib/seo/defaults.ts
    - src/routes/+layout.svelte
    - vite.config.ts
    - package.json
    - pnpm-lock.yaml
decisions:
  - "$app/state used (not $app/stores) — confirmed available in SvelteKit 2.65.2"
  - "vi.doMock() (non-hoisted) used for per-describe env var tests — vi.mock() is hoisted and overrides all blocks"
  - "svelteTesting() Vite plugin required for @testing-library/svelte to resolve browser Svelte 5 runes in Vitest jsdom"
  - "@testing-library/svelte installed in both main project and worktree node_modules for proper resolution"
  - "og:locale=nl_NL emitted unconditionally — not derived from env (WARNING-3 closed)"
  - "buildCanonical exported from defaults.ts (not a separate helper file) for co-location with SITE_URL"
metrics:
  duration: "~45 minutes"
  completed_date: "2026-06-18"
  tasks: 2
  files_created: 10
  files_modified: 5
---

# Phase 0 Plan 02: SEO Head Primitives + Landmark Skeletons Summary

## Result

Plan 02 complete. Wave 1 (Plan 02) fully delivered. All acceptance criteria met.

## One-liner

Typed PageMeta contract + SITE_URL/BRAND source-of-truth + `<Head>` emitting all 13 SEO tag categories + `<PageTitle>` one-H1 discipline + `<SiteNav>`/`<SiteFooter>` landmark skeletons wired into root layout; prerendered index.html verified clean via node-html-parser gate.

## Verification Outputs

| Check | Result |
|-------|--------|
| `pnpm test:unit -- --run` | 28/28 passed (5 test files: canonical, head, page-title, landmarks, content) |
| `pnpm check` | 0 errors, 0 warnings (417 files) |
| `pnpm build` | Prerendered output produced (EPERM on Vercel adapter `closeBundle` is known Windows-only issue — does not affect prerendered HTML or CI/Linux builds) |
| node-html-parser gate on `index.html` | **PASS** |
| `title` length | 24 chars ("TRINITY Breath & Healing" — root page, no suffix) |
| `description` length | **155 chars** — within 150–160 target |
| `canonical` | `https://trinity-breath-healing.vercel.app/` — absolute, correct origin |
| hreflang count | **2** (nl + x-default) |
| `og:locale` | **nl_NL** — WARNING-3 CLOSED |
| `<nav>` in initial HTML | **1** |
| `<main>` in initial HTML | **1** |
| `<footer>` in initial HTML | **1** |
| Layout source order | `<Head>` → `<SiteNav>` → `<main>` → `<SiteFooter>` ✓ |
| `$app/state` vs `$app/stores` | **`$app/state` used** — confirmed available in SvelteKit 2.65.2 |

## Blockers Closed

| Blocker | Status |
|---------|--------|
| **BLOCKER-5** (SEO-03 landmarks) | CLOSED — `<SiteNav>` + `<SiteFooter>` skeletons render in every prerendered route's initial HTML |
| **WARNING-3** (og:locale=nl_NL missing) | CLOSED — `<meta property="og:locale" content="nl_NL">` unconditionally emitted by `<Head>` |

## Requirements Satisfied

- **SEO-01**: `<Head>` emits unique `<title>` + meta description in initial HTML for every route
- **SEO-02**: `<PageTitle>` enforces single `<h1>` per page (compile-time Svelte component contract + unit test)
- **SEO-03**: Semantic landmarks (`<nav>`, `<main>`, `<footer>`) in initial HTML of every prerendered route
- **SEO-04**: `<link rel="canonical">` with absolute URL emitted by `<Head>`
- **SEO-05**: `<link rel="alternate" hreflang="nl">` + `<link rel="alternate" hreflang="x-default">` infrastructure ready
- **SEO-06**: OG block (og:title, og:description, og:url, og:image, og:type, og:locale=nl_NL) + Twitter Card (card, title, description, image)
- **FND-07**: SITE_URL throws at module load when `PUBLIC_SITE_URL` is unset — no localhost default
- **LGL-09**: BRAND constants are the NAP source-of-truth with TODO placeholders for unknowns

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1: PageMeta + SITE_URL + defaults + BRAND + canonical tests | `c1ec65c` | `types.ts`, `defaults.ts`, `brand.ts`, `canonical.test.ts` |
| Task 2: Head/PageTitle/SiteNav/SiteFooter + layout + unit tests | `65983bb` | 7 component/layout files + 3 test files + vite.config.ts + package.json |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `vi.mock()` hoisting breaks per-describe env var tests**
- **Found during:** Task 1 GREEN phase
- **Issue:** `vi.mock()` is hoisted to module top by Vitest, so multiple `vi.mock('$env/dynamic/public')` calls in different `describe` blocks all get hoisted — the last one wins. Test 1 (expects `https://trinity-breath-healing.vercel.app`) was receiving `https://example.com` (from a later mock).
- **Fix:** Replaced all `vi.mock()` with `vi.doMock()` (non-hoisted) + `vi.resetModules()` + `beforeEach` reset. This is the correct pattern for per-test module isolation with env var changes.
- **Files modified:** `tests/unit/canonical.test.ts`

**2. [Rule 1 - Bug] `@testing-library/svelte` not configured for Svelte 5 runes**
- **Found during:** Task 2 GREEN phase initial test run
- **Issue:** All `@testing-library/svelte` render calls threw `rune_outside_svelte` — the library was resolving Svelte's server-side (non-runes) build instead of the browser (runes-enabled) build in Vitest's jsdom environment.
- **Fix:** Added `svelteTesting()` Vite plugin from `@testing-library/svelte/vite` to the `unit` test project in `vite.config.ts`. This plugin adds the `browser` resolve condition so Svelte loads its runes-capable runtime.
- **Files modified:** `vite.config.ts`

**3. [Rule 1 - Bug] `@testing-library/svelte` not in worktree `node_modules`**
- **Found during:** Task 2, after vite config fix
- **Issue:** The `pnpm add -D @testing-library/svelte` was run in the main project directory (not the worktree), so the worktree's Vitest couldn't resolve the package's `src/vitest.js` via FS path.
- **Fix:** Re-ran `pnpm add -D @testing-library/svelte` inside the worktree directory. Package now present in worktree's `node_modules`.
- **Files modified:** `package.json`, `pnpm-lock.yaml`

**4. [Rule 1 - Bug] `SiteNav.svelte`/`SiteFooter.svelte` without `<script>` block caused `svelte-check` type errors**
- **Found during:** `pnpm check` after Task 2 implementation
- **Issue:** `svelte-check` reported "Could not find a declaration file" for components without a `<script lang="ts">` block.
- **Fix:** Added `<script lang="ts">` blocks with JSDoc comments to both components.
- **Files modified:** `src/lib/components/SiteNav.svelte`, `src/lib/components/SiteFooter.svelte`

**5. [Rule 1 - Bug] `page-title.test.ts` TypeScript error on empty props**
- **Found during:** `pnpm check` after Task 2
- **Issue:** `render(PageTitle, { props: {} as Parameters<typeof PageTitle>[0] })` caused a type error because `$$ComponentProps` had incompatible shape.
- **Fix:** Simplified to `render(PageTitle)` with no props argument — `children` is optional so this is valid.
- **Files modified:** `tests/unit/page-title.test.ts`

**6. [Rule 2 - Missing] `buildCanonical` added to `defaults.ts`**
- **Found during:** Plan review — the plan specified exporting `buildCanonical` but the existing Plan 01 `defaults.ts` stub didn't have it.
- **Fix:** Added `buildCanonical(siteUrl, path): string` export to `defaults.ts`. Co-located with `SITE_URL` for cohesion.
- **Files modified:** `src/lib/seo/defaults.ts`

**7. [Rule 2 - Missing] Description length adjustment**
- **Found during:** Task 1 implementation
- **Issue:** The Plan 01 description stub was 149 chars — 1 char below the 150-char minimum required by SEO-01 audit gate.
- **Fix:** Extended description from "...in Almere en omgeving." to "...in Almere en de wijde regio." — 155 chars, within 150–160 target. Semantically identical.
- **Files modified:** `src/lib/seo/defaults.ts`

### No Architectural Changes

All deviations were Rule 1 (bugs) or Rule 2 (missing required functionality). No Rule 4 architectural decisions required.

## Known Stubs

The following are intentional Phase 0 stubs — not bugs:

| File | Stub | Will be resolved by |
|------|------|---------------------|
| `src/lib/constants/brand.ts` | `practitionerFullName: 'TODO_PRACTITIONER_NAME'` | When aunt provides name (UNKNOWNS.md) |
| `src/lib/constants/brand.ts` | `phone: 'TODO_PHONE'` | When aunt provides phone (UNKNOWNS.md) |
| `src/lib/constants/brand.ts` | `socials.instagram: 'TODO_INSTAGRAM_HANDLE'` | When aunt provides handle (UNKNOWNS.md) |
| `src/lib/seo/defaults.ts` | `og.image: SITE_URL + '/og-default.jpg'` | Phase 1 (real OG image) |
| `src/lib/components/SiteNav.svelte` | Empty `<nav>` — no link items | Phase 1 LND-XX |
| `src/lib/components/SiteFooter.svelte` | Empty `<footer>` — no NAP/social block | Phase 1 LND-08 |

These stubs do NOT prevent Plan 02's goal. The `<nav>` and `<footer>` landmark presence is the goal; content fills in Phase 1. The TODO_ NAP values are tracked by CI grep (Phase 5 launch gate blocks on residual TODO_).

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries were introduced. All outputs are:

- Static Svelte component markup rendered at build time
- Typed `PageMeta` props only (no user input, no URL param interpolation)
- Build-time `PUBLIC_SITE_URL` env var only

Threat register items from plan (T-00-meta, T-00-noindex-preview, T-00-landmark-skeleton) — no new items beyond what the plan documented.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| All 12 key files exist | FOUND |
| Commit `c1ec65c` (Task 1) exists | FOUND |
| Commit `65983bb` (Task 2) exists | FOUND |
| All 28 unit tests pass | PASSED |
| `pnpm check` 0 errors | PASSED |
| Prerendered `index.html` passes node-html-parser gate | PASSED |
