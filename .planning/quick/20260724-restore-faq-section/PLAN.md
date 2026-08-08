---
quick_id: 260724-fvq
slug: restore-faq-section
date: 2026-07-24
status: complete
---

# Restore the FAQ section to the landing page

Bring back the visible FAQ accordion that was removed on 2026-06-24 by `c2c398b`
("refactor: reset frontend to blank slate"). `main` is an orphan-root fork
(`e934f8c`, 2026-07-12) taken *after* that reset, so the component never existed
on this branch — nothing was lost to a merge.

## Why this matters beyond aesthetics

`src/routes/+page.ts` already emits `buildFaqPage(faqItems)` into the landing
page's JSON-LD `@graph`. Google's structured-data policy requires FAQPage markup
to correspond to content **visible on the same page**. Right now the site ships
FAQ markup with no visible FAQ — a policy violation and an AEO liability for the
project's primary success metric. Restoring the section closes that gap.

## What already survives on `main` (no work needed)

| Asset | Path |
|---|---|
| 10 Dutch Q&A entries + `FaqItem` interface | `src/lib/content/faq/index.ts` |
| `buildFaqPage()` FAQPage emitter | `src/lib/schema/faq.ts` |
| Schema unit tests | `tests/unit/schema-faq.test.ts` |
| FAQPage already wired into landing `@graph` | `src/routes/+page.ts` |

## What is missing

The visible component. Recoverable verbatim from `git show
ce751fb:src/lib/components/FaqSection.svelte` (112 lines, `<details>/<summary>`
accordion, chevron SVG, plain-CSS custom properties).

## Tasks

1. **Restore component as `src/lib/components/global/Faq.svelte`**
   Renamed to match current convention on `main` — sections live in `global/`
   with no `Section` suffix (`Hero`, `Werkwijze`, `OverMij`, `Behandelingen`).
   Markup kept as-is: native `<details>/<summary>` needs no JS, renders in the
   initial HTML, and is keyboard-accessible by default — all three matter for the
   SSG/AEO constraint.

2. **Remap design tokens to the current `@theme` surface**
   Every token the old file used still exists in `src/app.css` except
   `--color-muted`, which on `main` is a shadcn *background* token, not a text
   colour. Changes:
   - eyebrow → adopt the shared section-header pattern used by `Werkwijze` and
     `Behandelingen`: `--font-body` / `--font-size-xl` / `--font-weight-light` /
     `--brand-muted` / `--space-2`. Drops the old uppercase-letterspaced style
     so all four landing sections read as one system.
   - `h2` → `--fs-h2` (fluid clamp) + `--font-weight-medium` +
     `--line-height-tight`, matching the sibling section headings instead of the
     old fixed `--font-size-2xl` / `--font-weight-bold`.
   - Everything else (`--color-bg-sand`, `--container-max`, `--color-border`,
     `--motion-fast`, `--ease-out`, `--line-height-loose`, `--space-*`) is
     already defined — verified against `src/app.css`.
   The `no-dead-css-vars` CI guard forbids referencing undefined variables, so
   this remap is a hard requirement, not polish.

3. **Export from the barrel** — add `Faq` to `src/lib/components/global/index.ts`.

4. **Mount on the landing page** — `<Faq />` after `<Behandelingen />` in
   `src/routes/+page.svelte`, before the `<time>` element. Add `id="faq"` for
   anchor linking.

5. **Re-enable the copy gate** — `scripts/check-copy.sh` carries a commented-out
   `check_string "Veelgestelde vragen"` with a note to restore it "when the FAQ
   section ships". Uncomment it and update the surrounding comment so the gate
   only still defers Contact.

6. **Regenerate visual baselines** — adding a section changes page height, so
   `home-desktop-win32.png` and `home-mobile-win32.png` will fail. Re-record both.

7. **Verify** — `npm run lint`, `npm run test:unit`, `npm run build`,
   `bash scripts/check-copy.sh`, then the Playwright integration suite.

## Out of scope (flagged, not done)

- `src/routes/faq/+page.svelte` is still a `StubLayout` stub while `Footer.svelte`
  links to `/faq`. Pre-existing gap, unrelated to the deletion. Worth a follow-up:
  either render the same content there or drop the footer link.
- Contact section remains deferred in `check-copy.sh` — untouched.
- No shadcn Accordion swap. Native `<details>` is the better choice here (zero JS,
  present in initial HTML for AI crawlers); switching would be a regression
  against the project's core value.
