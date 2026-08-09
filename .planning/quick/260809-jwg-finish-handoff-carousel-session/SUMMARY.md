---
id: 260809-jwg
slug: finish-handoff-carousel-session
date: 2026-08-09
status: complete
---

# Summary — finished the interrupted 2026-08-09 HANDOFF.md update

## What was wrong

The previous session's handoff update was cut off partway. Two edits had landed uncommitted
(the "Updated again 2026-08-09" header paragraph, and the rewritten Branches table plus
"Branch cleanup, 2026-08-08"). The third — the section the header explicitly told readers to
go read — was never written. `HANDOFF.md` forwarded every reader to
**"Carousel session 2026-08-08/09"**, which did not exist, while the surviving 2026-08-07
section still documented mechanisms that had since been deleted from the component.

## What changed

**`HANDOFF.md`**

1. **New section: "Carousel session 2026-08-08/09 — the current state of that component"**
   (~190 lines, 8 subsections). Ordered by what a reader needs first, not chronologically:
   - The live TESTKAART diagnostic and that it blocks merge — first, loudest.
   - `c4a98f2`'s missing `absorbWholeSteps()` on the drag path, and the lesson that half the
     reported "bad physics" was this bug, re-measured before physics was touched.
   - The coast + critically-damped-latch model, why the closed form matters (velocity at
     `t=0` *is* `v0`, so no seam), and why hand-rolled beat Svelte's `Spring`.
   - Buttons joining the same path; the `b = 0` boundary case; velocity carry-over on
     retarget; the negative-`t` clamp that only failed under parallel test load.
   - A constants table mapping each value to the owner complaint that moved it, plus the
     tau-vs-epsilon non-tradeoff so nobody re-runs that investigation.
   - The drag band, and why deriving it from rotated pivots' bounding boxes was wrong.
   - Desktop geometry churn, and the "section got lowered" complaint that was **not** caused
     by the suspected constant — with the standing warning not to fix vertical spacing by
     growing the fan height.
   - Housekeeping: reduced-motion coverage, the five specs, the three identical "Fix CI"
     Prettier commits, the write-only `phase` variable.

2. **Retitled** the older section to "background, superseded in part" with a blockquote
   pointing forward, rather than deleting it — its position model, rotation geometry and
   `|delta| = 1` invariant all survived and the reasoning is still load-bearing.

3. **Corrected the stale bullets** in that older section: the `commitSteps`/`FAST_STEP_MS`/
   `.treatments__pivot--fast` cascade and the `MAX_FLING_STEPS`/`FLING_VELOCITY_PER_STEP`
   release model are now marked deleted with the commit that removed them, keeping the
   reasoning that still applies. The "desktop click-to-jump was never implemented" claim was
   wrong as of `92fa716` and is now marked resolved.

4. **Added `RESEARCH-carousel-physics-gsap.md`** to the notes table.

**`.planning/notes/RESEARCH-carousel-physics-gsap.md`** — was untracked; now committed.

## Verification

- All five constants in the new table checked against
  `src/lib/components/global/Behandelingen.svelte`: `PX_PER_STEP = 90` (:226),
  `MOMENTUM_TAU_MS = 500` (:270), `VELOCITY_EPSILON = 0.0025` (:288),
  `SPRING_OMEGA = 0.016` (:294), `BUTTON_SPRING_OMEGA = SPRING_OMEGA / 4` (:325).
- The TESTKAART diagnostic confirmed still live in the working tree before documenting it as
  such (`Behandelingen.svelte:26`, `TreatmentCard.svelte:26`).
- `grep` over the finished file: every surviving mention of `commitSteps`, `FAST_STEP_MS`,
  `MAX_FLING_STEPS`, `FLING_VELOCITY_PER_STEP` and `.treatments__pivot--fast` sits inside
  prose that states it was deleted. No claim that any of them is current.
- The header's forward reference now resolves to a real heading at line 214.

## Not done, deliberately

**The TESTKAART revert was left in place.** The owner is still reviewing the carousel on
desktop with the numbered cards, so removing them is their call and gets its own commit. This
task only documents that it must happen before PR #10 merges.
