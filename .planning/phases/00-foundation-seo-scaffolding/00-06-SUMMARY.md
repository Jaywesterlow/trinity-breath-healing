---
phase: 00-foundation-seo-scaffolding
plan: 06
subsystem: styling
status: complete
completed: 2026-06-19
tags: [css-tokens, fonts, enforcement-scripts, tdd]
requires: ["00-01", "00-02"]
provides: ["static/global.css", "check-tokens.sh", "no-shared-css.sh"]
affects: ["all .svelte components via var(--token)"]
tech-stack:
  added: []
  patterns: ["CSS custom properties on :root", "self-hosted woff2 + font-display:swap", "bash enforcement scripts in CI"]
key-files:
  created:
    - static/global.css
    - scripts/check-tokens.sh
    - scripts/no-shared-css.sh
    - tests/unit/tokens.test.ts
    - static/fonts/dm-sans/dm-sans-regular.woff2
    - static/fonts/dm-sans/dm-sans-bold.woff2
    - static/fonts/cormorant-garamond/cormorant-garamond-regular.woff2
    - static/fonts/cormorant-garamond/cormorant-garamond-bold.woff2
  modified:
    - src/routes/+layout.ts
    - src/routes/+layout.svelte
decisions:
  - "CSS global import placed in +layout.ts (top-level TS module) to match SvelteKit's static analysis hoisting path"
  - "Font pair changed from Inter/Cormorant to DM Sans/Cormorant Garamond to match Figma spec (DM Sans was the body font in Figma — plan listed Inter as placeholder)"
  - "Font preload in +layout.svelte targets DM Sans regular (body, LCP-critical); Cormorant Garamond omitted from preload (headings only, not LCP element)"
  - "Fontaine size-adjust/ascent-override deferred to Phase 1 when real font files land (placeholder woff2 stubs)"
  - "grep -qF -- used in check-tokens.sh (not grep -q) so CSS custom property names starting with -- are treated as fixed strings, not grep flags"
metrics:
  duration: "~2 sessions (Task 1 Wave 2, Task 2 Wave 3)"
  tasks_completed: 2
  files_changed: 10
---

# Phase 00 Plan 06: CSS Token System + Enforcement Scripts Summary

Plain-CSS design-token system: single `static/global.css` with 25 locked token variables on `:root`, self-hosted woff2 placeholder fonts (DM Sans + Cormorant Garamond, SIL-OFL), root-layout import + font preload, and two bash enforcement scripts with full vitest coverage.

## What Was Built

**Task 1 — static/global.css + placeholder fonts + layout wiring**

- `static/global.css`: 25 CSS custom properties on `:root` covering color (6), spacing (10), border-radius (4), typography (13), motion (5), layout (1). Includes minimal reset, mobile-first body defaults, h1–h6 type scale, `.visually-hidden` a11y utility, and `@media (prefers-reduced-motion: reduce)` block. No `@import`, no `@apply`, no Tailwind.
- 4 woff2 placeholder files under `static/fonts/` (DM Sans regular + bold, Cormorant Garamond regular + bold). License: SIL-OFL 1.1 (confirmed for both families via Google Fonts / fontsource.org).
- `src/routes/+layout.ts`: `import '../../static/global.css'` added at top of file. SvelteKit's Vite integration hoists this into `<link rel="stylesheet">` in prerendered HTML.
- `src/routes/+layout.svelte`: `<link rel="preload" as="font" type="font/woff2" crossorigin="anonymous">` for DM Sans regular added inside `<svelte:head>`.

**Task 2 — enforcement scripts + TDD**

- `scripts/check-tokens.sh`: Asserts all 25 required tokens (plus `font-display: swap`) exist in `static/global.css`. Exits 0 on pass, exits 1 with per-missing-token diagnostics on failure.
- `scripts/no-shared-css.sh`: Walks `static/` and `src/` for `*.css` files; rejects anything that isn't `static/global.css`. Enforces FND-02 (no shared CSS outside global.css).
- `tests/unit/tokens.test.ts`: 34 vitest tests covering: all 25 token declarations in global.css, `font-display: swap`, `prefers-reduced-motion`, `.visually-hidden`, no-`@import`, no-`@apply`, plus shell-script exit-0 / exit-1 integration tests (bash-availability-gated).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed grep flag collision for CSS custom property tokens**
- **Found during:** Task 2 GREEN phase
- **Issue:** `check-tokens.sh` line 48 used `grep -q "${token}:"`. Token names begin with `--` (e.g. `--color-bg-sand`), which grep interpreted as flags, causing it to error rather than search. All 25 token checks failed.
- **Fix:** Changed to `grep -qF -- "${token}:"`. `-F` forces fixed-string matching; `--` ends option parsing.
- **Files modified:** `scripts/check-tokens.sh`
- **Commit:** 5560e2e

**2. [Rule 2 - Deviation] Font family changed from Inter to DM Sans**
- **Found during:** Task 1
- **Issue:** Plan listed Inter as placeholder body font, but Figma spec shows DM Sans. Shipping the wrong font family as the "placeholder" would require a rename in Phase 1.
- **Fix:** Used DM Sans + Cormorant Garamond (both SIL-OFL). Font directory paths and `@font-face` declarations updated accordingly. The token variable `--font-body` points to DM Sans.
- **Files modified:** `static/global.css`, `src/routes/+layout.svelte`, woff2 paths

## Key Decisions

1. **CSS import in +layout.ts, not +layout.svelte**: SvelteKit's Vite static analysis correctly hoists a TypeScript-level CSS import into the prerendered `<link rel="stylesheet">` tag. This avoids FOUC and matches Pitfall #3 guidance.
2. **DM Sans over Inter**: Figma body font is DM Sans. Plan mentioned Inter as a "placeholder to be replaced" — but naming it correctly from the start avoids a rename in Phase 1.
3. **Fontaine deferred**: `size-adjust` / `ascent-override` / `descent-override` require running Fontaine against the real woff2 metrics. Placeholder stubs don't have meaningful glyph data. Deferred to Phase 1 when production fonts land.
4. **One font preload**: Only DM Sans regular preloaded (LCP-critical body font). Cormorant Garamond is heading-only and not on the LCP path for stub pages.

## Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `static/global.css` | Created | 25 CSS token variables, reset, type scale, utilities |
| `scripts/check-tokens.sh` | Created | Asserts token presence; exits 1 on missing |
| `scripts/no-shared-css.sh` | Created | Rejects any .css outside static/global.css |
| `tests/unit/tokens.test.ts` | Created | 34 vitest tests for tokens + enforcement scripts |
| `static/fonts/dm-sans/dm-sans-regular.woff2` | Created | Placeholder woff2, SIL-OFL |
| `static/fonts/dm-sans/dm-sans-bold.woff2` | Created | Placeholder woff2, SIL-OFL |
| `static/fonts/cormorant-garamond/cormorant-garamond-regular.woff2` | Created | Placeholder woff2, SIL-OFL |
| `static/fonts/cormorant-garamond/cormorant-garamond-bold.woff2` | Created | Placeholder woff2, SIL-OFL |
| `src/routes/+layout.ts` | Modified | Added `import '../../static/global.css'` at top |
| `src/routes/+layout.svelte` | Modified | Added font preload `<link>` in `<svelte:head>` |

## Test Results

127/127 unit tests passing. `tokens.test.ts`: 34/34. Both shell scripts exit 0 on committed file tree.

## Known Stubs

| File | Line | Reason |
|------|------|--------|
| `static/fonts/dm-sans/dm-sans-regular.woff2` | binary | Placeholder stub — real DM Sans woff2 from fontsource/Google Fonts fetched in Phase 1 when design tokens finalize |
| `static/fonts/dm-sans/dm-sans-bold.woff2` | binary | Same |
| `static/fonts/cormorant-garamond/cormorant-garamond-regular.woff2` | binary | Same |
| `static/fonts/cormorant-garamond/cormorant-garamond-bold.woff2` | binary | Same |
| `static/global.css` | `--color-bg-sand` etc | TODO comments on 4 placeholder color hex values pending Figma export |

These stubs do not prevent the plan's goal (token architecture and enforcement scripts). Runtime will fall back to system fonts via the `font-family` stack. Phase 1 hero work resolves font stubs.

## Threat Surface Scan

No new network endpoints, auth paths, or trust-boundary schema changes. All files are static build-time assets. `no-shared-css.sh` and `check-tokens.sh` are dev/CI tools with no runtime exposure.

## Self-Check

- [x] static/global.css exists with all token groups
- [x] 4 woff2 placeholder files exist under static/fonts/
- [x] scripts/check-tokens.sh exits 0 against static/global.css
- [x] scripts/no-shared-css.sh exits 0 against repo
- [x] pnpm test:unit 127/127 passing
- [x] 00-06-SUMMARY.md written

## Self-Check: PASSED
