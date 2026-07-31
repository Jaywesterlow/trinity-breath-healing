---
quick_id: 260724-fvq
slug: restore-faq-section
date: 2026-07-24
status: complete
branch: restore/faq-section
---

# Summary — FAQ section restored

## Root cause of the disappearance

Not a merge accident. Two separate events:

1. `c2c398b` (2026-06-24, branch `phase-1-landing-sections`) deleted every Phase-1
   section component in a deliberate "reset frontend to blank slate" refactor.
2. `main` was started as an **orphan root** — `e934f8c` (2026-07-12), *"chore: fork
   of trinity-breath-healing for rework (clean baseline)"*. It has no parent and
   was taken from the post-reset state.

`git merge-base --is-ancestor c2c398b main` returns false: the two histories share
no commits. Hero, Werkwijze, OverMij and Behandelingen were rebuilt on `main`
afterwards; FAQ was the one that never got picked back up.

## SEO gap this closed

`src/routes/+page.ts` has been emitting `buildFaqPage(faqItems)` into the landing
page's JSON-LD `@graph` the whole time. Google requires FAQPage markup to reflect
content visible on the same page, so the site was shipping unbacked structured
data — a policy violation against the project's primary success metric. The
rendered page now carries 10 `<details>` elements matching the 10 `Question`
nodes.

## Changes

| File | Change |
|---|---|
| `src/lib/components/global/Faq.svelte` | New. Recovered from `ce751fb:src/lib/components/FaqSection.svelte`, renamed to match the `global/` no-suffix convention, BEM-scoped classes, tokens remapped. |
| `src/lib/components/global/index.ts` | Export `Faq`. |
| `src/routes/+page.svelte` | Mount `<Faq />` after `<Behandelingen />`. |
| `scripts/check-copy.sh` | Re-enabled `check_string "Veelgestelde vragen"`; Contact stays deferred. |
| `tests/.../home-desktop-win32.png`, `home-mobile-win32.png` | Re-recorded — page is taller now. |

### Token remap

`--color-muted` was the only token that no longer meant what the old file assumed
(it is a shadcn *background* token on `main`, not a text colour). The eyebrow and
`h2` were moved onto the shared section-header pattern used by `Werkwijze` and
`Behandelingen` — `--brand-muted` / `--font-size-xl` / `--font-weight-light` for
the eyebrow, `--fs-h2` / `--font-weight-medium` for the heading — so all four
landing sections now read as one system rather than the FAQ keeping its old
uppercase-letterspaced eyebrow. Every remaining variable was verified present in
`src/app.css`; the `no-dead-css-vars` guard passes.

Added beyond a straight restore: a `prefers-reduced-motion` guard on the chevron
rotation (the original had an unconditional transition), and a `(item.question)`
keyed `{#each}`.

## Verification

| Check | Result |
|---|---|
| `npm run build` | passes (24.7s) |
| `bash scripts/check-copy.sh` | passes — incl. the re-enabled `"Veelgestelde vragen"` |
| `npm run audit:json-ld` | passes, 15 files |
| Prerendered `index.html` | 10 `<details>`, `id="faq"`, questions present in both visible text and JSON-LD |
| Playwright full suite | **29 failed / 175 passed** vs. **31 failed / 173 passed** on clean `main` — 2 fixed, 0 broken |
| `npm run test:unit` | 135/136; the 1 failure is a pre-existing flake (below) |

### Pre-existing failures — confirmed not caused by this change

- **29 Playwright failures**: all trace to `.env` setting
  `PUBLIC_SITE_URL=http://localhost:5173`, while `html-audit.spec.ts` asserts an
  absolute `https://` canonical. Hits all 15 pages including untouched stubs.
  Verified identical (worse) on clean `main`.
- **`tests/unit/image.test.ts` Tests 5-7**: each spawns `node tsc` with
  `--ignoreconfig`, so project source is never read — this change cannot affect
  them. Measured cold-start: 4789ms / 4233ms / 6131ms against a 5000ms vitest
  timeout. A different test fails on each run. Fix would be a per-test timeout;
  left alone as out of scope.
- **`npm run lint`**: 122 files fail Prettier on this Windows checkout (CRLF vs
  LF). Reproduces on clean `main`, including `tsconfig.json` and `vercel.json`.
  `Faq.svelte` itself passes.

## Follow-ups worth taking

Moved to `.planning/notes/KNOWN-ISSUES.md` so they do not stay buried in a completed summary:

1. `src/routes/faq/+page.svelte` is still a `StubLayout` stub while
   `Footer.svelte` links to `/faq`. Either render the FAQ content there or drop
   the footer link — a linked stub page is an SEO liability.
2. Give `image.test.ts` Tests 5-7 an explicit timeout to stop the flake.
3. Contact section copy assertions remain commented out in `check-copy.sh`.
