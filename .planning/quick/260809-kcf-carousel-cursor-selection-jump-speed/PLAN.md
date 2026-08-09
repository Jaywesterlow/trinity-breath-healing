---
id: 260809-kcf
slug: carousel-cursor-selection-jump-speed
date: 2026-08-09
type: quick
mode: default
component: src/lib/components/global/Behandelingen.svelte
---

# Behandelingen carousel — cursor affordance, drag text-selection, centre-card link, jump speed

Four owner requests from one review round. All in the Behandelingen carousel. Do them as
**four separate commits**, in the order below — the owner reviews on Vercel previews from a
phone and has said explicitly not to fix several things at once, because then a regression
can't be traced.

## Ground truth already established (do not re-derive)

- The side-card jump overlay `.treatments__jump` **already** covers the whole card
  (`position: absolute; inset: 0`) and **already** sets `cursor: pointer`. Requirement 1's
  side-card half is done. Do not add a second overlay.
- There is **no** `user-select` rule anywhere in `Behandelingen.svelte` or
  `TreatmentCard.svelte`. That is why text selects during a drag.
- The fan has no `cursor` rule at all.
- `driveMotion(target)` hardcodes `latchOmega = BUTTON_SPRING_OMEGA` and
  `v0 = -BUTTON_SPRING_OMEGA * y0`. Prev/Next, the dots **and** click-to-jump all route
  through it, so anything done to `BUTTON_SPRING_OMEGA` hits all four.

## Owner's decisions, verbatim intent

- Outer cards click → centre them (**keep** the existing behaviour, `260808-ctj`).
- Centre card click → go to its page, **whole card**, not just the corner arrow.
- Cursor: drag cursor over the fan background, click cursor over a card.
- Dragging must stop selecting card text.
- **Click-to-jump only** should take **half** its current time. More ease-out, less ease-in.
- The owner wants **named, tweakable constants** for the ease so they can adjust after seeing it.

---

## Commit 1 — stop text selecting during a drag

`.treatments__fan`:

```css
-webkit-user-select: none; /* Safari/iOS */
user-select: none;
```

Also add `draggable="false"` to `.tcard__icon` in `TreatmentCard.svelte` — the native image
drag-ghost is the same class of bug and will show up the moment the TESTKAART numbers are
reverted and real icons come back.

**Do not** solve this with `preventDefault()` in `onPointerDown`. It would also kill the card
links and focus, and this component's whole click model depends on the native click firing.

Note in the commit message that `user-select: none` on a drag surface is deliberate and costs
nothing for SEO — selection is not crawled.

## Commit 2 — cursor affordance

- `.treatments__fan { cursor: grab; }`
- While a drag is live: `cursor: grabbing`. There is already an `inGesture` flag driving
  `.treatments__pivot--motion`. **Use the drag specifically, not `inGesture`** — `inGesture`
  stays true through coast and latch, so binding `grabbing` to it would leave the hand closed
  for a second after the finger lifts. If no drag-only flag is exposed on the fan element, add
  one (the existing `dragging`/pointer-capture state in `onPointerDown`/`onPointerUp`).
- The cards themselves must show `cursor: pointer`. The side cards already do via
  `.treatments__jump`. The centre card gets it from commit 3's stretched link.

Desktop only where it matters — `cursor` is inert on touch, so no media query is required, but
do not remove the existing `.treatments__jump` cursor rule.

## Commit 3 — whole centre card is a link

**Use the stretched-link pattern. Do not wrap the card in a second `<a>`** — `TreatmentCard`
already contains one (`.tcard__button`, the corner arrow) and nesting links is invalid HTML and
breaks screen readers.

In `TreatmentCard.svelte`:

```css
.tcard { position: relative; cursor: pointer; }

.tcard__button::after {
	content: '';
	position: absolute;
	inset: 0;
	border-radius: inherit; /* or the card's radius */
}
```

This keeps exactly one link, one tab stop, and the existing `aria-label`
(`"{buttonLabel} over {label}"`) as its accessible name — no accessibility regression, nothing
new to label.

Two things to get right:

1. **The drag-slop guard must cover it.** A mouse drag ends in a click on whatever is under
   the pointer, so without a guard a desktop drag-follow would navigate on release. `jumpTo`
   already guards with `if (dragMoved) return;`. The stretched link is a real `<a>`, so it needs
   the same protection at the DOM level — suppress the click when `dragMoved` is true (a
   capture-phase `click` handler on the fan calling `preventDefault()` is the least invasive
   place; `dragMoved` is already maintained in `onWindowPointerMove` against `DRAG_SLOP_PX`).
   **Write the test first:** a mouse drag across the centre card must not navigate.
2. **Only the centre card.** The ±1 cards are covered by `.treatments__jump`, which sits above
   the card and will absorb the click — verify that stacking still holds after adding the
   pseudo-element, since `::after` on the link could otherwise paint over the overlay. If it
   does, the side cards would navigate instead of centring, which is the exact behaviour the
   owner rejected.

## Commit 4 — halve the click-to-jump time, expose ease knobs

**Do not change `BUTTON_SPRING_OMEGA`.** Prev/Next and the dots share it, and the owner asked
for those to be *slower* twice already (`5924e7b`, then `f6ecb82`). Changing it would undo
their own request.

Give the jump path its own omega, threaded through as a parameter:

- `driveMotion(target, omega = BUTTON_SPRING_OMEGA, kick = 1)`
- `goTo(i, omega?, kick?)` passes through
- `jumpTo(i)` calls `goTo(i, JUMP_SPRING_OMEGA, JUMP_KICK)`
- Prev/Next/dots keep calling with no extra args — behaviour byte-identical

New constants, with the reasoning in comments:

```ts
// Click-to-jump only. Halving the settle time means DOUBLING omega —
// settling time scales as 1/omega (see SPRING_OMEGA's ~4.74/omega note).
// BUTTON_SPRING_OMEGA is SPRING_OMEGA/4 and measured ~1221ms; this is
// SPRING_OMEGA/2, the value f6ecb82 measured at ~656ms before halving
// it again. So this is a return to an already-measured number, not a guess.
const JUMP_SPRING_OMEGA = SPRING_OMEGA / 2; // 0.008

// Departure speed multiplier: v0 = -JUMP_KICK * omega * y0.
// 1 = the existing b=0 critically-damped case — max speed at t=0, zero
// ease-in, pure exponential ease-out, no overshoot.
// >1 leaves faster and decays longer (more ease-out, less ease-in) at the
// cost of a small overshoot past the target.
const JUMP_KICK = 1;
```

`driveMotion`'s `v0` line becomes `const v0 = inGesture ? velocity : -kick * omega * y0;` and
`latchOmega = omega`.

`motionTick` needs **no change** — it already reads a live `latchOmega` and computes
`b = latchV0 + latchOmega * latchY0` generically. That is the whole reason this is a small diff.

### Overshoot maths, so the owner's tweaking is safe

With `b = ω·y0·(1 − k)`, peak overshoot is at `t = (1/ω)·(k/(k−1))` and its magnitude as a
fraction of the original distance is `(k−1)·e^(−k/(k−1))`:

| `JUMP_KICK` | overshoot | reads as |
|---|---|---|
| 1.0 | 0% | current — no ease-in, all ease-out, lands dead on |
| 1.2 | ~0.05% | invisible; noticeably harder launch |
| 1.5 | ~2.5% | subtle settle-back, still crisp |
| 2.0 | ~13.5% | clearly bouncy |

Safe range to hand the owner: **1.0 – 1.5**. Above ~1.6 the bounce becomes the feature.

### Verify by measurement, not by eye

Build, `vite preview`, Playwright: sample `--pos` every rAF frame from the click on a side card
until it is stable. Assert/report:
- single-jump settle duration roughly **half** the pre-change figure (expect ~600–700ms against
  ~1200–1300ms — report the actual numbers in the commit message, the owner tracks these)
- per-frame speed is **maximum at the first frame** and decreasing thereafter at `JUMP_KICK = 1`
- the spacing invariant still holds: every pair of cards' `--pos` differs by exactly 1 at every
  sampled frame

Existing tests tuned against the slower timing will now finish sooner, which is safe, but
`behandelingen-click-to-jump.spec.ts` waits 2000ms specifically for this path — confirm it still
passes rather than assuming a faster motion cannot break it.

---

## Out of scope

- **Do not revert the TESTKAART diagnostic.** Still the owner's call. It is fine that cards
  render numbers while this work happens.
- Do not touch `SPRING_OMEGA`, `BUTTON_SPRING_OMEGA`, `MOMENTUM_TAU_MS` or `VELOCITY_EPSILON`.
- No changes to the position model, `shiftOne`, or `absorbWholeSteps`.

## Definition of done

- `npm run check` 0 errors, `npm test` green, `npm run build` clean.
- Prettier run on every new/changed file **before** committing — three separate "Fix CI"
  commits on this branch were all this same mistake.
- Four commits, pushed. The owner cannot run a dev server; unpushed work is invisible.
- HANDOFF.md's "Carousel session" constants table updated with the two new constants.
