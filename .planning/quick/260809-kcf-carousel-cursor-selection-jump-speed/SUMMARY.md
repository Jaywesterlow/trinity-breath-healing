---
id: 260809-kcf
type: quick
status: complete
date: 2026-08-09
branch: claude/accessible-work-repos-kb67gy
---

# Behandelingen carousel — cursor affordance, drag text-selection, centre-card link, jump speed — complete

Four owner requests from one review round, shipped as four separate commits (plus a fifth,
docs-only HANDOFF.md update) so a regression on any one can be traced from a Vercel preview.

## What shipped

`src/lib/components/global/Behandelingen.svelte` and `src/lib/components/ui/TreatmentCard.svelte`.

1. **`66a4696` — stop text selecting during a drag.** `user-select: none` (+`-webkit-`) on
   `.treatments__fan`; `draggable="false"` on `.tcard__icon` for the same class of bug on the
   native image drag-ghost.
2. **`b14cc27` — cursor affordance.** `.treatments__fan` gets `cursor: grab` at rest,
   `cursor: grabbing` while `dragging` is true (bound to the drag flag specifically, not
   `inGesture`, which stays true through coast/latch and would leave the hand closed for up to
   a second after release).
3. **`7c557ae` — whole centre card is a link.** Stretched-link pattern:
   `.tcard { position: relative; cursor: pointer; }` +
   `.tcard__button::after { position: absolute; inset: 0; border-radius: var(--radius-lg); }`.
   No second `<a>` — one link, one tab stop, existing `aria-label` unchanged. A capture-phase
   click handler on `.treatments__fan` (`onFanClickCapture`) suppresses the click when
   `dragMoved` is true, mirroring the guard `jumpTo` already applies to the JS-driven side-card
   path, so a desktop drag ending on the centre card's link doesn't navigate.
4. **`76c7795` — halve click-to-jump time, expose ease knobs.** `driveMotion(target, omega =
   BUTTON_SPRING_OMEGA, kick = 1)`, `goTo(i, omega?, kick?)`, `jumpTo(i)` now calls
   `goTo(i, JUMP_SPRING_OMEGA, JUMP_KICK)`. Prev/Next/dots call with no extra args — behaviour
   byte-identical. New constants `JUMP_SPRING_OMEGA = SPRING_OMEGA / 2` and `JUMP_KICK = 1`.
   `motionTick` untouched, as specified — it already reads a live `latchOmega` and computes `b`
   generically.
5. **`fc8dad5` — docs.** HANDOFF.md's constants table gets the two new constants, corrects the
   `BUTTON_SPRING_OMEGA` row (Prev/Next/dots only now, not "buttons/dots/jump"), and records the
   measured settle-time numbers below.

## Measured, not eyeballed

Built a temporary git worktree at the pre-commit-4 HEAD (`7c557ae`) to get a real "before"
build without switching this branch, ran both through `vite preview` + Playwright
(`MutationObserver` on `--pos`, sampled from a real click on `.treatments__jump` — the actual
user path, not a synthetic call — until it settles within 0.01 of the target):

- **Settle duration:** ~1695ms (`BUTTON_SPRING_OMEGA`, before) -> ~853ms (`JUMP_SPRING_OMEGA`,
  after) — **50.3%** of the original, matches "halve."
- **Spacing invariant:** 0 adjacent-pair violations across 101 (before) / 51 (after) sampled
  frames — every pair of cards' `--pos` stayed exactly 1 apart throughout.
- **Cursor:** `grab` at rest -> `grabbing` mid-drag -> `grab` after release; side-card overlay
  stays `pointer` throughout.
- **Stacking (commit 3's real risk):** verified in a real browser, not by reading CSS — clicking
  a side card's `.treatments__jump` overlay still centres it (does not navigate); clicking
  anywhere on the centre card (not just the corner arrow) navigates to its `/diensten/*` page; a
  mouse drag across the centre card does not navigate.
- All 16 existing `behandelingen-*` Playwright specs pass, including
  `behandelingen-click-to-jump.spec.ts`'s 2000ms-wait assertions.
- `npm run check` — 0 errors (1 pre-existing unrelated `AboutStat.svelte` warning).
- `npm test` — 17 files, 137 passed.
- `npm run build` — clean.

## Deviations from plan

**None to the four commits' scope or approach** — implemented exactly as specified (stretched
link, capture-phase guard, parameterised `driveMotion`/`goTo`/`jumpTo`, `motionTick` untouched,
`BUTTON_SPRING_OMEGA` untouched).

**One finding surfaced during measurement, documented but not fixed (out of scope):** a real
click on `.treatments__jump` routes through `.treatments__fan`'s own `onPointerDown` before the
browser's `click` event fires. That pointerdown/pointerup pair briefly sets
`inGesture = true` / `velocity = 0` (an empty, zero-distance "drag"), so `driveMotion`'s
`inGesture ? velocity : -kick * omega * y0` branch carries over `velocity = 0` instead of the
synthetic kick for this specific call path — producing a small ease-in before the exponential
ease-out takes over, instead of the textbook "max speed at t=0" curve. Confirmed by calling
`jumpTo()` directly (bypassing the pointer event, via a temporary debug hook that was reverted
before committing) and seeing the clean b=0 curve. This interaction already existed for
`BUTTON_SPRING_OMEGA` before this task (Prev/Next/dots sit outside `.treatments__fan` and never
trigger `onPointerDown`, so they don't have it) — it's unrelated to the omega/kick
parameterisation itself, and fixing it would mean changing `onPointerDown`'s gesture-tracking
model, which is explicitly out of scope ("No changes to the position model... Out of scope").
The measured settle-time numbers above are the honest, real-click numbers and already account
for this.

## Not done / left for the owner

- `JUMP_KICK` shipped at `1` (no bounce) per the plan's own recommendation — the safe 1.0-1.5
  tuning range is documented in the constant's own comment and in HANDOFF.md if the owner wants
  a snappier departure later.
- TESTKAART diagnostic cards left in place, by explicit instruction — not reverted.
- Pre-existing repo-wide `npm run lint` prettier warnings (134 files, unrelated to this task,
  confirmed present on the pre-commit-4 baseline worktree too) — out of scope, not touched.
