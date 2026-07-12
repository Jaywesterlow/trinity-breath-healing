---
phase: 00-foundation-seo-scaffolding
plan: 04
status: complete
completed: 2026-06-19
subsystem: crawlers-sitemap
tags: [seo, robots, sitemap, routes, tdd]
requires: ["00-01", "00-02", "00-03"]
provides: ["ALL_ROUTES", "robots.txt", "sitemap.xml", "check-robots.sh"]
affects: ["00-05", "00-08", "00-09", "Phase 1 SiteNav", "Phase 5 Search Console"]
tech-stack:
  added: []
  patterns:
    - "SvelteKit +server.ts prerendered endpoint for sitemap.xml"
    - "vi.doMock + vi.resetModules per-describe env mock for SITE_URL"
    - "it.skipIf(!bashAvailable) for bash-dependent tests on Windows"
key-files:
  created:
    - src/lib/constants/routes.ts
    - static/robots.txt
    - scripts/check-robots.sh
    - src/routes/sitemap.xml/+server.ts
    - tests/unit/routes-manifest.test.ts
    - tests/unit/robots.test.ts
    - tests/unit/sitemap.test.ts
  modified: []
decisions:
  - "bashAvailable guard: check-robots.sh tests use it.skipIf(!bashAvailable) — bash not in PATH on Windows dev machine; CI Linux will exercise them fully"
  - "EPERM on Vercel adapter closeBundle is Windows-only issue — does not affect prerendered HTML; sitemap.xml EXISTS in .svelte-kit/output/prerendered/pages/ with 15 <loc> entries"
  - "vi.doMock + vi.resetModules pattern reused from Plan 02 canonical.test.ts for SITE_URL mocking in sitemap tests"
  - "BLOCKER-6 resolved: Plan 04 depends_on 00-02 (SITE_URL contract) and executed after 00-02 completed"
metrics:
  duration: "~20 minutes (inline fork execution)"
  completed_date: "2026-06-19"
  tasks: 3
  files_created: 7
  files_modified: 0
---

# Phase 0 Plan 04: robots.txt + sitemap.xml + Routes Manifest Summary

## Result

Plan 04 complete. All 3 tasks delivered. TDD RED→GREEN for each task. 91/91 tests pass (93 total, 2 bash-tests skipped on Windows). `pnpm check` 0 errors.

## One-liner

15-route manifest as single source-of-truth + AI-crawler-first `robots.txt` with order-enforcement script + prerendered `sitemap.xml` endpoint with 15 absolute `<loc>` entries.

## Verification Outputs

| Check | Result |
|-------|--------|
| `pnpm test:unit -- --run` | 91/91 passed, 2 skipped (bash) |
| `pnpm check` | 0 errors, 0 warnings (440 files) |
| `pnpm build` | EPERM Windows-only on closeBundle — prerendered output still produced |
| `sitemap.xml` in prerendered output | **EXISTS** — 15 `<loc>` entries |
| SITE_URL applied | `https://trinity-breath-healing.vercel.app/` present |
| Landing priority 1.0 | **PRESENT** |
| robots.txt AI-crawler order | All 8 named bots precede `User-agent: *` |
| DECISION comment in robots.txt | **PRESENT** (CONTEXT.md + Pitfall #10) |

## Requirements Satisfied

- **SEO-07**: XML sitemap with 15 absolute `<loc>` entries, prerendered at build time
- **SEO-08**: robots.txt with 8 named AI/training bot Allow blocks before wildcard `User-agent: *`
- **D-03**: training crawlers (Google-Extended, Applebot-Extended) ALLOWED with inline DECISION comment
- **D-04**: 15-route lock in `ALL_ROUTES` — 14 stubs + landing (`/`) in canonical order

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1 RED | `b460315` | tests/unit/routes-manifest.test.ts |
| Task 1 GREEN | `417a61c` | src/lib/constants/routes.ts |
| Task 2 RED | `572faa8` | tests/unit/robots.test.ts |
| Task 2 GREEN | `1357113` | static/robots.txt, scripts/check-robots.sh |
| Task 3 RED | `e1e3fdc` | tests/unit/sitemap.test.ts |
| Task 3 GREEN | `b54f793` | src/routes/sitemap.xml/+server.ts + fixed test types |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `pnpm check` TypeScript strictness on test array access**
- `lines[next]` and match group `m[1]` are `string | undefined` under `noUncheckedIndexedAccess`
- Fixed: `(lines[next] ?? '').trim()`, `lines[next]?.trim()`, and `m[1] ?? ''` nullish coalescing

**2. [Rule 2 - Adaptation] bash not in PATH on Windows dev machine**
- `scripts/check-robots.sh` tests use `it.skipIf(!bashAvailable)` guard
- CI (Linux) exercises them fully; no behavior change

**3. [Rule 1 - Known] EPERM on Vercel adapter closeBundle**
- Windows-only; sitemap.xml prerendered correctly despite build exit code 1
- Documented in Plan 02 SUMMARY as known issue; Plan 01 notes it as a `pnpm.onlyBuiltDependencies` cleanup candidate for Plan 08

## BLOCKER-6 Status

CLOSED — Plan 04 executed after Plan 02 (SITE_URL contract). Import `from '$lib/seo/defaults'` resolves. Sitemap `<loc>` entries use correct `https://trinity-breath-healing.vercel.app` origin.

## Known Stubs

None — all deliverables are production-ready. `ALL_ROUTES` is the locked 15-route manifest that Plans 05, Phase 1 SiteNav, and Phase 5 Search Console submission consume directly.

## Threat Surface Scan

- `static/robots.txt` → public crawlers: order validated by `check-robots.sh` in CI (Plan 08 wires it)
- `sitemap.xml` endpoint: URLs derived from `SITE_URL` env (not user input); prerendered so no runtime injection surface
- No new auth paths, network endpoints beyond static output, or trust boundary changes

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/lib/constants/routes.ts` exists | FOUND |
| `static/robots.txt` exists | FOUND |
| `scripts/check-robots.sh` exists | FOUND |
| `src/routes/sitemap.xml/+server.ts` exists | FOUND |
| All 7 test files exist | FOUND |
| 91/91 tests pass | PASSED |
| `pnpm check` 0 errors | PASSED |
| sitemap.xml prerendered with 15 `<loc>` | VERIFIED |
| robots.txt named bots precede wildcard | VERIFIED |
