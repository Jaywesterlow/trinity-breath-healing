---
id: 260809-drg
slug: drag-speed-per-breakpoint
date: 2026-08-09
type: quick
mode: default
component: src/lib/components/global/Behandelingen.svelte
---

# Drag speed — cards travel far faster than the cursor on desktop

## Owner report

> "Right now the speed at which the drag happens is about twice the speed it should be.
> Whenever I take my cursor and I drag, the speed at which my cursor moves is about half the
> speed at which the cards move. The drag speed is way too fast."

Reviewing on desktop.

## Diagnosis (already established — verify, don't re-derive)

`PX_PER_STEP = 90` at `Behandelingen.svelte:235`, used in exactly two places:

- `offset = dragBaseOffset + pendingDx / PX_PER_STEP` (the drag follow, ~line 855)
- `velocity = velocityPxPerMs / PX_PER_STEP` (release velocity, ~line 890)

**It is a single constant, but the cards are not a single size.** Its own comment says
"~one mobile card-width of drag == one step", and `--card-width` is:

- mobile: `6.27rem` (~100px) — so 90px per step is roughly 1:1, near enough
- desktop: `15rem` (240px) at `min-width: 1024px` — so 90px of drag still advances a full step

For the fan to track the cursor 1:1, `PX_PER_STEP` must equal **the on-screen horizontal
distance between adjacent card centres**, which on desktop is roughly card width (240px) plus
the measured edge-to-edge gap (~79px from `4d23fe6`) ≈ **~319px**. Against 90px that is ~3.5x
too fast, which is consistent with the owner reporting "about twice" by eye.

This is a breakpoint bug, not a global mistuning. **Do not just double the constant** — that
would fix desktop halfway and make mobile sluggish.

## Task

Make the steps-per-pixel ratio track the actual rendered geometry instead of a hardcoded
mobile-era number.

Preferred approach, in order:

1. **Measure it at runtime.** Derive the centre-to-centre distance from live bounding boxes —
   the same technique `getCardBandY` already uses to find the centre pivot (`a3f798d`), and the
   same "measure, don't do trig" rule the rest of this component follows. Recompute on resize.
   This self-corrects if `--card-width` or `--pivot-distance` is ever retuned again, which on
   this branch happens often.
2. If runtime measurement proves fragile inside the drag hot path, fall back to a CSS custom
   property (`--px-per-step`) set per breakpoint alongside `--card-width`, read once and on
   resize.

Whichever you pick, say in the commit message why.

**Both call sites must use the same value.** `velocity` is in steps/ms and feeds
`MOMENTUM_TAU_MS` / `VELOCITY_EPSILON` / the latch springs — if the drag divisor changes and the
velocity divisor doesn't, exit velocities shift by the same factor and the whole release feel
changes with it. They are already the same constant; keep them the same value.

## Watch out

- **Release feel is tuned against the current velocity scale.** `VELOCITY_EPSILON = 0.0025`
  steps/ms was sized empirically, and `58d24bd` documents that the "a drag does not also fire a
  jump on release" test has a measured exit velocity of ~0.0013–0.0014 steps/ms — only ~45%
  below the threshold. Making a desktop drag produce ~3.5x fewer steps/ms for the same physical
  gesture moves every one of those numbers. **Re-measure that gesture's exit velocity after the
  change** and confirm it still sits below `VELOCITY_EPSILON` with margin. If desktop now sits
  so far below the threshold that flicks stop coasting at all, say so rather than quietly
  retuning the release constants — that is an owner decision, they signed off on the release
  feel separately.
- Mobile must not regress. The owner reviews on a phone. Whatever the new derivation is, verify
  the mobile ratio stays close to today's effective one.
- `MOMENTUM_TAU_MS`, `VELOCITY_EPSILON`, `SPRING_OMEGA`, `BUTTON_SPRING_OMEGA`,
  `JUMP_SPRING_OMEGA`, `JUMP_KICK` — do not touch any of them.
- Do not revert the TESTKAART diagnostic cards. They stay.

## Verify by measurement

Built preview + Playwright, both breakpoints (1440x900 and a phone viewport):

- Drag the pointer a known horizontal distance; assert the centre card's rendered bounding box
  travels **approximately the same distance** on screen. That is the actual thing the owner is
  complaining about, and it is directly measurable — do not settle for asserting the constant's
  value.
- Report the before/after ratio at both breakpoints in the commit message.
- Re-run all `behandelingen-*` specs.

## Definition of done

One commit. Prettier before committing. `npm run check`, `npm test`, `npm run build` clean.
Pushed — the owner cannot run a dev server. SUMMARY.md + STATE.md row. Update the
`PX_PER_STEP` row in HANDOFF.md's "Carousel session 2026-08-08/09" constants table.
