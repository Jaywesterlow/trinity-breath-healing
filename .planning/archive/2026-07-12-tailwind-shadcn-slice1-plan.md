# Slice 1 — Tailwind v4 + shadcn Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. This is a MIGRATION under a live, working site — the guiding invariant is **the rendered site must not visually change**. When a step says "read the current file and transform it," that is intentional: you reconcile with real existing code, and the acceptance gate (not a pasted blob) is the source of truth.

**Goal:** Install Tailwind v4 + shadcn-svelte under the existing Trinity site and move brand tokens into Tailwind's `@theme`, with the rendered site staying pixel-identical and no components rewritten.

**Architecture:** Trinity's existing tokens stay the single source of truth. Tailwind v4 is added via its Vite plugin; `static/global.css` is routed through Vite so `@import 'tailwindcss'` can process it; brand color/font/radius tokens move into `@theme` (same names + values, so existing `var(--…)` keeps resolving and utilities become available); shadcn-svelte is initialized with its semantic tokens pointed at Trinity's palette (no components added). Conflicting plain-CSS CI guards are retired.

**Tech Stack:** SvelteKit ^2.63, Svelte 5 (runes), Tailwind v4 (`@tailwindcss/vite`), shadcn-svelte + bits-ui, `@sveltejs/enhanced-img`, adapter-vercel. Package manager: npm.

## Global Constraints

- **The site must render visually identical to the pre-migration baseline.** Every task's gate includes this.
- **Do NOT modify** these or their behavior: `Hero.svelte`, `Werkwijze.svelte` (scroll-jack), `Behandelingen.svelte` (ticker), `OverMij.svelte`, `AboutStat.svelte` (count-up), `EnhancedImage.svelte` / `enhanced:img` usage, `seo/Head.svelte`, `seo/JsonLd.svelte`, View-Transition setup in root `+layout.svelte`. Their scoped `<style>` blocks reference `var(--…)` tokens and must keep resolving unchanged.
- Svelte 5 runes only; TypeScript. Keep the enhanced-img and sveltekit Vite plugins intact; keep adapter-vercel.
- Trinity's existing token **names and values are authoritative** — preserve them exactly (e.g. `--color-fg-forest`, `--radius-md`, `--font-display`). No new palette.
- No components added, no stub pages built, no dark mode, no theming picker in this slice.
- Verify commands: `npm run build`, `npm run dev`. Visual before/after is the human gate; agents verify build + served output + that brand CSS vars still resolve.

## Baseline capture (do this FIRST, before any change)

- [ ] **Step 0: Capture the before-state.** Run `npm run dev`, and record the current rendered state of `/` (home) and `/contact` (a stub) — screenshot if a browser tool is available, otherwise save the served HTML of both routes to `docs/superpowers/.baseline/` (e.g. `curl`-equivalent fetch via a small node script) so "after" can be diffed. Also run `npm run build` once and confirm it currently passes. Note the dev port. This baseline is the identical-look reference for every later gate.

---

## Task 1: Add Tailwind v4, route global CSS through Vite, reconcile Preflight

**Files:**
- Modify: `vite.config.ts` (add Tailwind plugin)
- Modify: `package.json` (deps via install)
- Modify: `src/app.html` (remove the `<link>` to global.css)
- Create: `src/app.css` (Vite-processed entry) OR import path via `src/routes/+layout.svelte`
- Modify/Move: `static/global.css` → its contents served through Vite
- Modify: existing reset rules (reconcile with Preflight)

**Interfaces:**
- Produces: Tailwind active site-wide; a Vite-processed global stylesheet importing `tailwindcss`; the same visual output as baseline.

- [ ] **Step 1: Install Tailwind v4.**
Run: `npm install -D tailwindcss @tailwindcss/vite`
Expected: added to devDependencies, install succeeds.

- [ ] **Step 2: Read `vite.config.ts`, then add the Tailwind plugin.**
Read the current file (it has the SvelteKit + enhanced-img plugins). Add `import tailwindcss from '@tailwindcss/vite';` and put `tailwindcss()` in the `plugins` array **before** `sveltekit()` (Tailwind's plugin should precede SvelteKit's). Do not remove or reorder the enhanced-img / sveltekit plugins otherwise.

- [ ] **Step 3: Route the global stylesheet through Vite.**
Create `src/app.css`. Move the entire contents of `static/global.css` into `src/app.css` (tokens, reset, keyframes, everything). At the very top of `src/app.css` add:
```css
@import 'tailwindcss';
```
Import it once from the app: in `src/routes/+layout.svelte` add `import '../app.css';` (adjust relative path as needed) at the top of the `<script>`. Then delete the now-dead `<link rel="stylesheet" href="/global.css">` from `src/app.html`, and delete `static/global.css` (its content now lives in `src/app.css`). Confirm no other file references `/global.css`.

- [ ] **Step 4: Reconcile Preflight with the existing reset.**
`@import 'tailwindcss'` pulls in Preflight (Tailwind's reset), which now stacks on top of Trinity's own reset. Run the dev server and compare `/` and `/contact` against the Step-0 baseline. Where Preflight changed something (heading margins/sizes, list styling, button appearance, form elements), reconcile: remove Trinity reset rules that Preflight now duplicates, and re-add any Trinity-specific reset behavior Preflight dropped, until both pages match the baseline. Keep the focus-visible ring, View-Transition keyframes, and reduced-motion block. **Acceptance: `/` and `/contact` visually match the baseline.**

- [ ] **Step 5: Verify.**
Run: `npm run build` → passes. Run `npm run dev` → no console errors; brand styling present on first paint (no FOUC / unstyled flash). Manually exercise the home scroll-jack + ticker once — still work. **Gate: build green + both pages match baseline + custom interactions intact.**

- [ ] **Step 6: Commit.**
```bash
git add -A
git commit -m "feat(slice1): add Tailwind v4 via Vite; route global css through Vite; reconcile preflight"
```

---

## Task 2: Move brand color / font / radius tokens into `@theme`

**Files:**
- Modify: `src/app.css` (the migrated stylesheet)

**Interfaces:**
- Consumes: Tailwind active (Task 1).
- Produces: brand color/font/radius tokens defined in `@theme` (utilities available), spacing/type/motion/layout tokens still plain `:root` vars; all existing `var(--…)` still resolves; visual output unchanged.

- [ ] **Step 1: Move color, font, and radius tokens into an `@theme` block.**
In `src/app.css`, take the existing brand **color** tokens (`--color-bg-sand`, `--color-fg-forest`, `--color-accent-gold`, `--color-card-warm`, `--color-muted`, `--color-text-subtle`, `--color-border`, `--color-accent-gold-soft`), the **font** tokens (`--font-display`, `--font-body`), and the **radius** tokens (`--radius-sm/md/lg/full`) out of the plain `:root` block and into an `@theme { … }` block, **keeping the exact same names and values**. Tailwind re-emits these as `:root` custom properties, so `var(--color-fg-forest)` etc. still resolve, and `bg-fg-forest` / `text-fg-forest` / `rounded-md` / `font-display` utilities become available. Leave the `color-mix()`-derived variants where they are (as `:root` vars referencing the `@theme` ones).
Keep spacing (`--space-*`), fluid/static type (`--fs-*`, `--font-size-*`, line-heights, weights), motion (`--motion-*`, `--ease-*`), and layout (`--container-max`, `--nav-height`) as ordinary `:root` variables — unchanged.

- [ ] **Step 2: Prove the token→utility bridge, then remove the proof.**
Temporarily add `<div class="bg-fg-forest text-bg-sand rounded-md p-4">bridge test</div>` to `src/routes/+page.svelte`. Run dev; confirm it renders with the forest background + sand text + the correct radius (i.e. utilities resolve to brand tokens). Then **remove the test div**.

- [ ] **Step 3: Verify no visual drift.**
Compare `/` and `/contact` to baseline again — must still match (moving tokens into `@theme` should change nothing visible, because every `var(--…)` still resolves). `npm run build` passes.

- [ ] **Step 4: Commit.**
```bash
git add -A
git commit -m "feat(slice1): move brand color/font/radius tokens into Tailwind @theme"
```

---

## Task 3: Initialize shadcn-svelte, point tokens at the palette (no components)

**Files:**
- Create: `components.json`, `src/lib/utils.ts` (via shadcn init)
- Modify: `src/app.css` (shadcn semantic-token mapping), `package.json` (deps)

**Interfaces:**
- Consumes: Tailwind + `@theme` (Tasks 1–2).
- Produces: shadcn-svelte initialized; its semantic tokens (`--background`, `--foreground`, `--primary`, …) mapped to Trinity's palette; ZERO components added; site unchanged.

- [ ] **Step 1: Run shadcn-svelte init.**
Run: `npx shadcn-svelte@latest init`
Answer prompts to match the project: TypeScript yes; the global CSS file = `src/app.css`; base color = neutral (will be overridden by the mapping); aliases using `$lib` conventions (`$lib/components`, `$lib/utils`, `$lib/components/ui`). If it asks to overwrite `src/app.css`, allow it to add its `@layer`/token scaffolding but **do not let it delete Trinity's tokens** — review the diff and restore any Trinity tokens it removed. Confirm `components.json` and `src/lib/utils.ts` (with `cn`) are created.

- [ ] **Step 2: Point shadcn semantic tokens at Trinity's palette.**
In `src/app.css`, set shadcn's semantic tokens to reference Trinity's brand tokens (not shadcn's default neutrals): `--background: var(--color-bg-sand)`, `--foreground: var(--color-fg-forest)`, `--primary: var(--color-fg-forest)`, `--primary-foreground: var(--color-bg-sand)`, `--secondary`/`--accent: var(--color-accent-gold)` (+ readable foregrounds), `--card: var(--color-card-warm)`, `--card-foreground: var(--color-fg-forest)`, `--muted: var(--color-muted)`, `--muted-foreground: var(--color-text-subtle)`, `--border`/`--input: var(--color-border)`, `--ring: var(--color-accent-gold)`, and `--radius: var(--radius-md)` (or the project's default). Follow whatever mapping mechanism shadcn's scaffolding uses (`@theme inline` or `:root`). Exact contrast tuning is deferred to Slice 2 — no component renders these yet; the mapping must simply exist and be sane.

- [ ] **Step 3: Verify.**
`npm run build` passes. `npm run dev`: `/` and `/contact` still match baseline (no component uses shadcn tokens yet, so nothing should change). No shadcn `ui/` components exist yet (`ls src/lib/components/ui` empty or absent).

- [ ] **Step 4: Commit.**
```bash
git add -A
git commit -m "feat(slice1): init shadcn-svelte, map semantic tokens to Trinity palette (no components)"
```

---

## Task 4: Retire conflicting CI guards; supersede D-09

**Files:**
- Remove/rewrite: `scripts/no-shared-css.sh`, `scripts/check-tokens.sh`
- Modify: `.github/workflows/*` (whatever invokes those scripts)
- Modify: decision log / `CLAUDE.md` (mark D-09 superseded)

**Interfaces:**
- Produces: repo tooling that passes under the new stack; the plain-CSS lock recorded as superseded.

- [ ] **Step 1: Find the references.**
Grep the repo for `no-shared-css` and `check-tokens` (in `.github/`, `package.json` scripts, and elsewhere). List every invocation.

- [ ] **Step 2: Retire or rewrite the guards.**
`scripts/no-shared-css.sh` (asserts a single shared CSS file) contradicts Tailwind/shadcn — remove it and its invocations. `scripts/check-tokens.sh` (asserts tokens exist) — either remove, or rewrite it to assert the brand tokens now exist in `src/app.css`'s `@theme` block. Update `.github/workflows/*` and any `package.json` script so nothing calls a deleted script and CI does not fail on this.

- [ ] **Step 3: Supersede D-09.**
In the repo's decision record (search `CLAUDE.md` and any `.planning`/decisions doc for "D-09" / "plain CSS locked"), add a note that D-09 is **superseded 2026-07-12** by the Tailwind v4 + shadcn migration (Slice 1), with a one-line rationale. Do not delete the historical record — append the supersede note.

- [ ] **Step 4: Verify.**
`npm run build` passes. Run the repo's lint/test/CI-equivalent commands that remain (per `package.json`) and confirm no reference to a removed script errors. Site still matches baseline.

- [ ] **Step 5: Commit.**
```bash
git add -A
git commit -m "chore(slice1): retire plain-CSS CI guards; mark D-09 superseded"
```

---

## Final verification (whole slice)

- [ ] `npm run build` green.
- [ ] `/` (home) and `/contact` (stub) render **visually identical** to the Step-0 baseline — human before/after confirmation.
- [ ] Werkwijze scroll-jack, Behandelingen ticker, AboutStat count-up, Hero sizing, View Transitions all still work.
- [ ] SEO output intact: page `<head>` meta + a JSON-LD `<script>` still present on `/`.
- [ ] Tailwind utilities usable (proven in Task 2) and shadcn ready to add components (Slice 2).
- [ ] No orphaned reference to `/global.css` or the removed CI scripts.

## Self-Review Notes

- **Spec coverage:** install+wire Tailwind (T1) · route global css through Vite (T1) · preflight reconcile (T1) · tokens→`@theme` (T2) · shadcn init + palette mapping (T3) · retire CI guards + supersede D-09 (T4) · identical-look gate on every task · custom interactions untouched (Global Constraints). All spec items mapped.
- **Placeholder check:** the only deferred detail is exact shadcn foreground-contrast tuning (explicitly Slice 2, since no component renders it yet) — acceptance is "mapping exists and is sane," which is verifiable.
- **Type/name consistency:** token names used verbatim from the inventory (`--color-fg-forest`, `--color-bg-sand`, `--radius-md`, `--font-display`, etc.). The implementer reads `src/app.css` to confirm exact current values before moving them.
