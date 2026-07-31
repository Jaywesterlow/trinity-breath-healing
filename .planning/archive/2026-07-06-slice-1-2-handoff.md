# HANDOFF — Trinity rework (plain CSS → Tailwind v4 + shadcn-svelte)

_Rewritten 2026-07-14. Supersedes the 2026-07-13 version, which was stale on every load-bearing point (it claimed the working tree was clean and that Slice 2 hadn't started — both wrong now)._

---

## 🔴 READ THIS FIRST — the one job waiting for you

**The user is hand-converting the site's images to SVG right now. They said: "hold on and I'll tell you when I finish."**

Do not touch the working tree until they say they're done.

When they say they're finished, do exactly this:

1. **Re-read the diff from scratch.** `git status --short` + `git diff --stat HEAD`. The file list in this doc is a snapshot from 2026-07-14 and is **certainly out of date** — they are actively changing it. Do not trust it. Do not reuse the commit plan below without re-checking what's actually there.
2. **Propose commits and wait for a yes.** Per the user's git rule, no commit lands without explicit approval, and the message must be Conventional Commits format. A proposed plan is drafted below — treat it as a starting point, not the answer.
3. **Then merge:** `git merge slice-2-readiness` while on `slice-1-foundation`.

That merge target is **already decided** — the user chose it. Don't re-litigate it. See "Why into slice-1" below.

---

## Git topology (verified 2026-07-14, read-only commands)

```
master  ──9755ba7  "docs: Slice 1 implementation plan"
                   ^ NOTHING is merged here. Master is an empty baseline.

slice-1-foundation  ← YOU ARE HERE (checked out, tree DIRTY)
  a0e5e5e  chore: gitignore subagent scratch + baseline dir
  2a8c2de  feat(slice1): Tailwind v4 via Vite; global.css → src/app.css
  22fb162  feat(slice1): brand color/font/radius tokens → @theme
  0d88e29  feat(slice1): init shadcn-svelte, map semantic tokens (no components)
  1d57da2  chore(slice1): retire plain-CSS CI guards; D-09 superseded
  6719a20  fix(slice1): rename brand tokens out of shadcn's --color-* namespace
  81bbe8f  feat(hero): draw hero illustration on load (traced SVG)  ←── slice-2 forks HERE
  c098714  fix(hero): match traced stroke weight to original artwork
  a74eb55  feat(images): vectorise line art; draw-on portraits + Verdieping  ← tip

slice-2-readiness   (worktree: ../trinity-slice2-readiness)
  2bb4e5c  test(visual): committed screenshot baselines for / and /contact
  12200f0  fix(visual): tighten threshold to catch small-text regressions
  1597d1f  fix(seo): per-page title + meta description  ← BIGGEST WIN, see below
  fdfd04c  ci: run dead CSS variable guard on every push
  ea7bbc8  feat(theme): complete shadcn semantic token surface
  a5bd510  fix(ci): skip visual regression where no baselines committed
  31cbe05  docs: triage the 33 pre-existing e2e failures
```

**Why into slice-1, not master:** slice-2 forked from `81bbe8f`, which is *mid*-slice-1. Slice-1 has since gained `c098714` + `a74eb55`. Merging slice-2 straight to master would carry the foundation and the hero, but **strand the stroke-weight fix and the vectorised line art** — master would ship a hero with the wrong stroke weight. So: slice-2 → slice-1 first. Land the whole migration to master later, as one.

**No remote exists.** This is a detached fork with fresh history. `git remote -v` is empty, on purpose — this copy *cannot* deploy to production.

---

## Draft commit plan (STALE — re-derive it)

Snapshot of the dirty tree as of 2026-07-14, before the user's current SVG session. Shown so you know the *shape* of what was in flight, not so you can replay it.

```
[1] feat(brand): replace 2.3MB raster logo with vector trinity-logo.svg
    static/trinity-logo.svg   (new, 22KB)   static/trinity-logo.png (deleted, 2.3MB)
    static/logo.svg (deleted, unused)       src/lib/components/global/NavLogo.svelte

[2] feat(images): retrace line art as filled vectors at 2x viewBox
    static/images/card-*.svg, heart.svg, sprout.svg   → fill-based
    src/lib/images/about-portrait-{1,2}.svg,
    src/lib/images/card-verdieping-bg.svg             → still stroke-based

[3] docs: add Trinity rework handoff + refresh draw-on screenshots
    HANDOFF.md, .planning/quick/20260713-hero-draw-on/*.png
```

The 2.3 MB → 22 KB logo swap is a genuine perf win — that asset is in the nav of every page.

### ⚠️ The stroke-vs-fill rule (matters for every image you touch)

The draw-on animation works by animating `stroke-dashoffset`. **A filled path cannot be drawn on.** So:

- `src/lib/images/about-portrait-*.svg` and `card-verdieping-bg.svg` **must stay stroke-based** — `DrawOn.svelte` animates them.
- `static/images/card-*.svg`, `heart.svg`, `sprout.svg` are safe to be fill-based — `Behandelingen.svelte` loads them as plain `<img src>`, it does not animate them. (The `stroke-dasharray` in that file is on `.treatments__dot-ring`, an inline SVG, not on the cards.)

If the user's new SVGs convert the portraits or Verdieping card to fills, **the draw-on silently stops working** — no error, no failing test. Check this before committing.

---

## Known-red things (not yours to fix silently — surface them)

- **PRF-03 is failing** because of the user's own hero commit `81bbe8f`. The contract asserts `loading="eager"` appears exactly once; the hero is now an inline SVG with no `<img>` at all. It passed before. **The user's call:** retire the contract or rewrite it. Their in-flight image work may settle it either way — re-run before asking.
- **E2E: 20 failing** (down from 33). Of those, 17 assert features that were never built (contact form, modal, font preload), 2 are hero contracts the SVG rewrite made obsolete, 1 is a real JSON-LD validator gap. Triage in `docs/E2E-TRIAGE.md`. **Recommendation on the table:** `test.fixme()` the 17 so red means red again. Not yet approved.
- **Slice-1 never got a whole-branch review.** The 2026-07-12 session hit its limit. Individual tasks were reviewed; the branch as a whole was not.
- **Nobody has visually checked the fork.** Pixel-diff vs the original was 0.000% on `/` and `/contact` at the time of the Slice-1 bug fix, but no human has looked at it running.

---

## 🚨 Landmine before any shadcn component gets added

**The shadcn `ui` alias points at a directory that already holds Trinity's own components.**

`components.json` says `"aliases": { "ui": "$lib/components/ui" }` — and `src/lib/components/ui/` already contains hand-written Trinity files (`AboutStat.svelte`, `HeroServiceCard.svelte`, `WerkwijzeCard.svelte`, `Breadcrumbs.svelte`, …, plus `index.ts`).

So `npx shadcn-svelte add button` writes **into that same folder**, next to Trinity's files, and touches `index.ts`.

**Before the first `add`:** run `--dry-run` and diff. Either repoint `ui` to a fresh dir (e.g. `$lib/components/shadcn`) or accept co-habitation deliberately. Do not run a bare `add` and find out afterwards.

---

## Why Slice 2 converted zero components (don't undo this)

Slice 2 was **re-scoped**, on evidence. A dry-run of `shadcn add button` showed **every** visual property differs from Trinity's: `h-8` vs 40px, `rounded-lg` vs pill, sans 14px vs Cormorant serif, forest vs tan — and shadcn ships no tan variant. Converting means rewriting the variant map until it looks identical again: **zero visual gain, real risk.** Nav and footer: shadcn ships neither. Trinity's cards are bespoke; shadcn's Card is a padded div.

Dialog/select/tabs *would* add value — but **nothing consumes them yet**, so adding them now is dead code.

**Rule going forward: adopt a shadcn component when a real need lands** (contact form → P3, FAQ accordion → P2). Not before.

---

## The bug that defines this project's safety rules

Slice 1 was marked DONE on green unit tests + `npm run check` + a clean build. **All three were green while the site was visibly broken.**

`@theme inline` (shadcn's own pattern) re-declared `--color-border` / `--color-muted` as aliases of `--border` / `--muted` but emitted no real `:root` var. Trinity's same-named tokens got replaced → circular → resolved to `""`. **A dead `var()` does not error. It falls back to initial.** Nav CTA, hero CTA, the "Spinal Touch" chip, and the Verdieping card border all rendered **invisible**, and no test noticed.

Fixed in `6719a20` (raw tokens renamed `--brand-*`). Guarded by `tests/integration/no-dead-css-vars.spec.ts`, which fails if any non-fallback `var(--x)` resolves to `""`. Runs in CI on every push (`fdfd04c`).

**Lesson, and it applies to the image work too: green tests ≠ correct render. Look at the page.**

---

## The SEO bug that was hiding in plain sight

`1597d1f`. **All 15 pages shipped the same `<title>` and the same `<meta description>`.** `+layout.svelte` was reading its *own* load data, so the per-page Dutch meta authored months ago in `stub-meta.ts` never reached `<head>`. Canonicals were fine, so nothing flagged it. Silently dropped on every build since it was written.

Biggest single win of the rework so far. Mentioned here because it's the kind of thing that only turns up when someone actually reads the rendered output.

---

## Repo facts

- **This repo:** `Desktop\AI\Coding projects\Claude Coding\trinity-breath-healing-rework` — a safe fork made 2026-07-12.
- **Original, untouched:** `...\Claude Coding\trinity-breath-healing` (branch `fix/hero-fit-cards`). Do not touch it.
- **Slice-2 worktree:** `...\Claude Coding\trinity-slice2-readiness` (holds `slice-2-readiness` checked out).
- Excluded at fork time: `node_modules`, `.svelte-kit`, `.vercel`, `.git`. `.env` untracked.
- **Tokens:** `src/app.css` — brand tokens in `@theme`, shadcn semantic tokens in `:root` below. Trinity's `--radius-*` scale is authoritative; shadcn's `calc()`-derived scale must not overwrite it.
- **Routes:** flat Dutch pages — `/`, `/over-mij`, `/behandelingen`, `/diensten`, `/werkwijze`, `/contact`, `/faq`, `/blog`, `/artikelen`, `/privacyverklaring`, `/algemene-voorwaarden`, `sitemap.xml`.
- Pre-existing `npm run check` warning: `AboutStat.svelte:24` (`state_referenced_locally`). Not from the migration. Leave it.

```bash
npm run dev            # visual check
npm run test           # unit
npm run test:visual    # screenshot baselines (win32 only)
npm run check          # svelte-check
```

---

## The user's rules (non-negotiable)

- **Commits require explicit permission**, every time, with the message proposed up front in Conventional Commits format.
- **Feature branches** may be created freely — just say so and why.
- **Never touch the remote.** No `push` / `pull` / `fetch` / remote `rebase` / remote `merge`. Print the command and stop. (Moot here — there is no remote — but the rule stands.)
- **Merges are the user's to run** unless they explicitly hand one over. They handed over *this* one (slice-2 → slice-1). That permission does not extend to slice-1 → master.
- Opus coordinates, **Sonnet subagents implement.** Slices 1 and 2 were both built this way.

---

## Order of play after the merge

1. Merge `slice-2-readiness` → `slice-1-foundation`. ← **the pending job**
2. Re-run the suite. Expect 20 e2e failures, not 33. Confirm PRF-03's status after the new images.
3. Decide PRF-03: retire or rewrite. **Ask.**
4. Decide the 17 unbuilt-feature e2e tests: `test.fixme()` them? **Ask.**
5. Whole-branch review of slice-1 + a real visual check of the running site. Both still owed.
6. Only then: merge slice-1 → master. **User runs it.**
7. Slice 3 = adopt shadcn components where a real need lands. Resolve the `ui/` alias landmine first.

## Loose end outside this repo

`[[Plain CSS Preference]]` in the AI Brain wiki still says "always plain CSS." This project reverses that. Needs a nuance edit: **plain CSS by default, shadcn/Tailwind for component-heavy projects.** Still not done.
