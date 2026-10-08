# Slice 1 — Tailwind v4 + shadcn-svelte Foundation (Design Spec)

_Created 2026-07-12. Project: `trinity-breath-healing-rework` (isolated fork). Migration of Trinity Breath & Healing from plain CSS to the JW-Skeleton stack (Tailwind v4 + shadcn-svelte), done in slices. This is Slice 1 of that migration._

## Goal

Stand up Tailwind v4 + shadcn-svelte under the existing Trinity site and move the design tokens into Tailwind's `@theme`, **with the rendered site staying pixel-identical**. No component rewrites, no new pages. This proves the new engine runs under the real site and de-risks every later slice.

## Success criteria

1. `npm run build` succeeds.
2. `npm run dev` — home page (`/`) and at least one stub page (e.g. `/contact`) look **visually identical** to the pre-migration baseline (before/after comparison).
3. All existing custom behavior still works: Werkwijze scroll-jack, Behandelingen ticker, Hero sizing, AboutStat count-up, View Transitions, SEO/JSON-LD output.
4. Tailwind utility classes are available (e.g. a throwaway `class="bg-fg-forest"` on a test element resolves to the brand color) — proving the token→utility bridge works, then removed.
5. CI/guard scripts that contradict the new stack are retired or rewritten so the repo's own tooling passes (or is intentionally updated), not silently broken.

## Current state (facts from codebase inventory)

- **Stack:** SvelteKit `^2.63`, Svelte 5 runes (`runes: true`), `@sveltejs/adapter-vercel`. **No Tailwind, no PostCSS, no shadcn** present today.
- **Styling:** single global stylesheet `static/global.css`, loaded via a raw `<link rel="stylesheet" href="/global.css">` in `src/app.html` — **not** through Vite's module graph. Comment marks it "D-09: plain CSS locked."
- **Tokens (all in `static/global.css` `:root`):**
  - Colors: `--color-bg-sand`, `--color-fg-forest`, `--color-accent-gold`, `--color-card-warm`, `--color-muted`, `--color-text-subtle`, `--color-border`, `--color-accent-gold-soft` (+ `color-mix()` variants).
  - Spacing: `--space-1`…`--space-16`. Radius: `--radius-sm/md/lg/full`.
  - Fonts: `--font-display` (Cormorant Garamond), `--font-body` (DM Sans), self-hosted via `@font-face`. Static + fluid `--fs-*` type scale, line-heights, weights.
  - Motion: `--motion-*`, `--ease-*`. Layout: `--container-max`, `--nav-height`.
- **Reset:** minimal reset lives in `global.css` (box-sizing, margin reset, img defaults, focus-visible ring), plus View-Transition keyframes + `prefers-reduced-motion` block.
- **No dark mode.**
- **CI guards:** `scripts/no-shared-css.sh` (asserts `global.css` is the only shared CSS), `scripts/check-tokens.sh` (asserts required tokens exist). Referenced by `.github` CI. Both will conflict with this migration.
- **Pre-existing wart (leave alone this slice):** a duplicate Google-Fonts load (Cinzel/Montserrat) in `NavLogo.svelte` + `+layout.svelte`, already flagged with TODOs. Out of scope for Slice 1.

## Approach

**Chosen: adopt Tailwind v4's `@theme`, keep Trinity's exact tokens as the single source of truth, keep every existing `var(--…)` working.** The look cannot shift because the same values keep the same variable names; components are untouched.

Rejected alternatives: (a) rewriting components to utilities now — that's Slice 2, needless risk here; (b) introducing shadcn's default neutral palette as a second system — creates a duplicate palette to reconcile. We point shadcn at Trinity's palette instead.

## Work items (what the Sonnet implementer will do)

### 1. Install + wire Tailwind v4
- Add `tailwindcss` + `@tailwindcss/vite`. Add the plugin to `vite.config.ts` (confirm current plugin list first; enhanced-img + sveltekit plugins must remain).

### 2. Route global CSS through Vite
- Stop loading `static/global.css` via the `<link>` in `app.html`. Instead create `src/app.css` (or import the existing stylesheet from `src/routes/+layout.svelte`) so Tailwind can process it. Move the stylesheet's contents into the Vite-processed file (or `@import` it), keeping all tokens, reset, keyframes.
- Top of that file: `@import 'tailwindcss';`.

### 3. Move brand tokens into `@theme`
- Put **color, font, and radius** tokens into an `@theme { … }` block using Tailwind's namespaces **while preserving the exact current variable names and values** (e.g. `--color-fg-forest`, `--radius-md`, `--font-display`). `@theme` re-emits these as `:root` custom properties, so existing `var(--color-fg-forest)` references keep resolving **and** utilities like `bg-fg-forest` / `rounded-md` / `font-display` become available.
- Keep spacing (`--space-*`), fluid type (`--fs-*`), motion, and layout tokens as ordinary `:root` variables (unchanged) — they don't need Tailwind-namespace treatment in this slice, and all `var(--…)` references keep working.
- Net visual change: **none**.

### 4. Reconcile Tailwind Preflight with the existing reset (the main risk)
- Tailwind v4's Preflight is a CSS reset that can restyle headings, lists, buttons, and form elements. Trinity already has its own reset.
- The implementer must diff the rendered result before/after: keep Preflight (shadcn expects it), remove now-duplicated lines from Trinity's reset, and re-add any Trinity-specific reset behavior Preflight drops, until the page matches the baseline. This is the highest-attention part of the slice and the primary thing the verify step guards.

### 5. Initialize shadcn-svelte (no components yet)
- Run shadcn-svelte init: creates `components.json`, the `cn` helper (`src/lib/utils.ts`), path aliases; installs `bits-ui`/deps.
- Map shadcn's semantic tokens to Trinity's palette so Slice 2 components inherit the brand automatically: `--background`→sand, `--foreground`→forest, `--primary`→forest (or gold — pick the brand's primary action color), `--primary-foreground`→sand, `--card`→card-warm, `--muted`→muted, `--muted-foreground`→text-subtle, `--border`/`--input`→border, `--ring`→accent-gold, `--radius`→existing radius. Exact tuning is deferred to Slice 2 (no components render these yet); the mapping just needs to exist and be sane.
- **Add zero components** in this slice.

### 6. Retire the conflicting CI guards
- `scripts/no-shared-css.sh` and `scripts/check-tokens.sh` now contradict the stack. Remove them (or rewrite: token check can assert the `@theme` tokens exist). Update `.github` workflow(s) so CI doesn't invoke the retired scripts and doesn't fail.
- Update the decision record: mark **D-09 "plain CSS locked" as superseded** by this migration (in whatever decision log / `CLAUDE.md` the repo keeps).

## Out of scope (explicitly NOT this slice)

- Converting any component to shadcn/utilities (Slice 2).
- Building any of the 13 stub pages (Slice 3+).
- The OKLCH theming picker / dark mode / live-restyle (not planned for Trinity unless requested).
- Cleaning up the duplicate Google-Fonts load (separate follow-up).
- Touching custom interactions: Hero, Werkwijze scroll-jack, Behandelingen ticker, OverMij, AboutStat, EnhancedImage, SEO Head/JsonLd, View Transitions — all left exactly as-is.

## Verification

- `npm run build` green.
- Before/after visual check of `/` and one stub page (screenshots or side-by-side) — must match.
- Scroll-jack + ticker + count-up + View Transitions manually exercised once.
- Existing test/audit tooling: run what still applies (`playwright` html-audit, unit tests); the retired token/CSS guards are intentionally dropped, not counted as failures.

## Risks

- **Preflight drift** (primary) — mitigated by the before/after reconciliation in work item 4.
- **global.css load-path change** could momentarily FOUC or drop styles if mis-wired — verify the stylesheet still applies on first paint.
- **shadcn init** may try to overwrite files or assume a `src/app.css`; the implementer should review its changes, not accept blindly, and keep Trinity's tokens authoritative.
