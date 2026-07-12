---
phase: 00-foundation-seo-scaffolding
plan: "07"
subsystem: image-primitive
tags: [image, performance, cls, lcp, seo, prf-01, a11y]
dependency_graph:
  requires: ["00-01"]
  provides: ["EnhancedImage primitive", "required-prop type discipline"]
  affects: ["Phase 1 LND-01 hero image", "all below-fold images"]
tech_stack:
  added: []
  patterns:
    - "svelte/compiler + svelte/server for unit-test rendering without @testing-library/svelte"
    - "tsc --ignoreconfig --strict for required-prop compile-error tests (TypeScript 6 compatible)"
    - "fetchpriority={fetchpriority ?? undefined} for conditional attribute omission (Svelte 5 omits undefined)"
key_files:
  created:
    - src/lib/components/EnhancedImage.svelte
    - tests/unit/image.test.ts
    - tests/fixtures/image-missing-alt.ts
    - tests/fixtures/image-missing-width.ts
    - tests/fixtures/image-missing-height.ts
  modified:
    - tsconfig.json
decisions:
  - "fetchpriority conditional: used `fetchpriority={fetchpriority ?? undefined}` (attribute-omit pattern) rather than conditional block render — cleaner, Svelte 5 omits undefined attrs from HTML output"
  - "compile-error tests: used tsc --ignoreconfig --strict on .ts fixture files (TypeScript 6 requires --ignoreconfig when specifying files on CLI; svelte-check on isolated fixtures is unreliable without SvelteKit context)"
  - "rendering tests: used svelte/compiler + preprocess to replace <enhanced:img> with <img> + svelte/server render() — avoids @testing-library/svelte dependency which was absent from package.json"
  - "tsconfig exclude: added tests/fixtures to tsconfig.json exclude to prevent svelte-check from reporting intentionally-invalid fixture errors"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-18"
  tasks_completed: 1
  files_modified: 6
---

# Phase 00 Plan 07: EnhancedImage Primitive Summary

One-liner: Type-safe `<enhanced:img>` wrapper with required alt/width/height (CLS=0), lazy default, and hero eager/high-priority override via Pitfall #6 guard comment.

## Objective

Deliver the `<EnhancedImage>` Svelte 5 component that wraps `@sveltejs/enhanced-img`'s `<enhanced:img>` element with required props enforced at compile time, making correct image attributes the impossible-to-forget default for all Phase 1+ usage.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| RED | EnhancedImage tests (TDD RED) | c9c5f3c | tests/unit/image.test.ts, tests/fixtures/*.ts, tsconfig.json |
| GREEN | EnhancedImage.svelte implementation | 1a8c872 | src/lib/components/EnhancedImage.svelte |

## Verification

- `pnpm test:unit -- --run image`: **9/9 tests pass** (7 image + 2 pre-existing content tests)
- `pnpm check`: **0 errors, 0 warnings** (383 files checked)
- TDD gate: RED commit (c9c5f3c) precedes GREEN commit (1a8c872)

## Implementation Notes

### fetchpriority conditional — chosen pattern

Used the `undefined`-omit pattern:
```svelte
<enhanced:img fetchpriority={fetchpriority ?? undefined} ... />
```
Svelte 5 omits HTML attributes whose value is `undefined`. This produces:
- `fetchpriority` absent when prop is omitted (browser default)
- `fetchpriority="high"` present when `fetchpriority="high"` is passed

The alternative (conditional render with two `<enhanced:img>` branches) was rejected — it duplicates the element, adds cognitive overhead, and is harder to maintain.

### Rendering tests without @testing-library/svelte

`@testing-library/svelte` was absent from `package.json`. Rather than install a new package (blocked per deviation Rule 3), tests use:

1. `svelte/compiler` `preprocess()` to replace `<enhanced:img>` → `<img>` (mirrors what the Vite plugin does at build time)
2. `svelte/compiler` `compile()` with `generate: 'server'` to produce SSR-compatible JS
3. `svelte/server` `render()` to obtain the HTML string
4. Direct string assertions on the output (width/height/alt/loading/fetchpriority attributes)

This approach confirmed: Svelte 5 correctly omits attributes with `undefined` values in server-rendered output.

### Compile-error tests (Tests 5-7)

Used `tsc --ignoreconfig --strict` on `.ts` fixture files (the plan's explicit fallback). TypeScript 6 requires `--ignoreconfig` when specifying individual files on the CLI (otherwise it emits `ts5112` error about tsconfig.json conflict). The `--strict` flag enables `strictNullChecks` which enforces required properties in object literals.

Output format: `TS2741: Property 'alt' is missing in type '...' but required in type 'EnhancedImageProps'` — matched with `/alt/i` and `/missing|required/i` patterns.

Fixture files excluded from `tsconfig.json` `exclude` array to prevent `svelte-check` from reporting intentional type errors as build failures.

### CSS selector

The scoped `<style>` block uses `enhanced\:img` selector (CSS-escaped colon). The `img` selector was omitted — Svelte's CSS checker flags it as unused because the template uses `<enhanced:img>` at compile time. The project-level CSS reset handles `img` baseline styles globally.

## TDD Gate Compliance

- RED gate: `test(00-07)` commit at c9c5f3c — verified failing (7/7 tests failed before component existed)
- GREEN gate: `feat(00-07)` commit at 1a8c872 — all 9 tests pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] tsc --strict flag incompatible with TypeScript 6 when specifying files**
- **Found during:** Task 1 RED verification
- **Issue:** TypeScript 6 emits `ts5112` error when specifying files on CLI with a tsconfig.json present. `--strict` alone fails.
- **Fix:** Added `--ignoreconfig` flag: `tsc --ignoreconfig --noEmit --strict <fixture>`. Confirmed this produces correct `TS2741` property-missing errors.
- **Files modified:** tests/unit/image.test.ts
- **Commit:** c9c5f3c (in RED commit)

**2. [Rule 2 - Missing functionality] @testing-library/svelte absent from package.json**
- **Found during:** Task 1 implementation
- **Issue:** Plan referenced @testing-library/svelte but it was not in package.json or installed. Cannot auto-install per Rule 3 (package exclusion).
- **Fix:** Used plan's explicit fallback: svelte/compiler + svelte/server for rendering tests; tsc --ignoreconfig for type-checking tests. Both approaches are documented in the plan's `<action>` section as alternatives.
- **Files modified:** tests/unit/image.test.ts
- **Commit:** c9c5f3c (in RED commit)

**3. [Rule 1 - Bug] CSS unused selector warning**
- **Found during:** Task 1 pnpm check
- **Issue:** `enhanced\:img, img` selector — Svelte flagged `img` as unused (template uses `<enhanced:img>` not `<img>`).
- **Fix:** Removed the `img` selector; kept only `enhanced\:img`. Project-level CSS handles img globally.
- **Files modified:** src/lib/components/EnhancedImage.svelte
- **Commit:** 1a8c872 (in GREEN commit)

**4. [Rule 2 - Missing functionality] tests/fixtures included in svelte-check scope**
- **Found during:** Task 1 pnpm check
- **Issue:** Intentionally-invalid fixture .ts files were included in svelte-check scope, causing 3 expected errors to appear in the check output.
- **Fix:** Added `tests/fixtures/**/*` to tsconfig.json `exclude` array.
- **Files modified:** tsconfig.json
- **Commit:** c9c5f3c (in RED commit)

## Known Stubs

None — the component is fully implemented and wired. No placeholder data.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes. Image assets are committed files, not user uploads.

## Self-Check: PASSED

- `src/lib/components/EnhancedImage.svelte` exists: FOUND
- `tests/unit/image.test.ts` exists: FOUND
- `tests/fixtures/image-missing-alt.ts` exists: FOUND
- `tests/fixtures/image-missing-width.ts` exists: FOUND
- `tests/fixtures/image-missing-height.ts` exists: FOUND
- Commit c9c5f3c exists: FOUND
- Commit 1a8c872 exists: FOUND
- pnpm test:unit -- --run image: 9/9 PASS
- pnpm check: 0 errors, 0 warnings PASS
