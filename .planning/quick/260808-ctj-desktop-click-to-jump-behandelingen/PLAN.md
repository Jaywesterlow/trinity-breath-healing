---
id: 260808-ctj
type: quick
status: planned
date: 2026-08-08
branch: claude/accessible-work-repos-kb67gy
---

# Desktop click-to-jump on the Behandelingen carousel

Clicking a visible side card on desktop moves the fan to that card. Closes the one
item `HANDOFF.md` lists as "mentioned early in the session as a requirement and never
implemented" for this section.

## Why this and not hover-to-scroll

An edge-hover accelerating scroll was considered and rejected:

- It moves without an explicit user action — a pointer crossing the section starts motion.
- Landing on a specific card means chasing a moving target.
- Pointer-only; no keyboard or screen-reader equivalent exists for a continuous-velocity control.
- The repo gates on `pa11y-ci` (WCAG 2.2 AA). Self-starting movement of content invites
  a 2.2.2 Pause/Stop/Hide finding for no functional gain.
- Desktop already has a pointer-driven continuous gesture: `onPointerDown` is not touch-gated,
  so a mouse drag already drives the live drag-follow.

Click-to-jump is the discoverable, keyboard-safe, standard pattern for a card row.

## Approach

Reuse what exists. `goTo(i)` already computes `commitSteps(-positions[i])` — the proven-safe
cascade of single `shiftOne` steps. No new position maths, no new transition behaviour.

1. **Overlay hit target.** A transparent `<button class="treatments__jump">` filling
   `.treatments__pivot`, rendered only when `Math.abs(positions[i]) === 1` — the two visible
   side cards. Never on the centre card, so its `tcard__button` link keeps working. Never on
   `±2`, which is off-screen, so no invisible hit targets.
2. **Desktop only.** `display: none` in the base rule, `display: block` inside the existing
   `@media (min-width: 1024px)` block. Mobile keeps swipe as its only card-level gesture.
3. **Keyboard.** `tabindex="-1"` + `aria-hidden="true"`. This is a pointer affordance, not a
   new control: the keyboard path already exists and is complete via the dots
   (`Ga naar {label}`, same `goTo(i)`) and Prev/Next. Adding a second focusable control per
   card would duplicate the dots and put a button and its own card's link adjacent in the tab
   order for no gain.
4. **Drag must not also jump.** A mouse drag ends in a `click` on whatever sits under the
   pointer. Track `dragMoved` (set in `onPointerDown` to `false`, set `true` past a 4px
   threshold in `onWindowPointerMove`) and bail out of the jump handler when it is set.
5. **No overlapping cascades.** Guard `goTo` with `if (cascading) return;`. A second
   `commitSteps` entering while a cascade is mid-flight is exactly the "redirect a transition
   in progress" case the file's own comments document as producing measurable card overlap.
   This also hardens the existing dots, which can currently trigger it.

## Files

| file | change |
|---|---|
| `src/lib/components/global/Behandelingen.svelte` | `dragMoved` tracking, `cascading` guard in `goTo`, `jumpTo` handler, overlay button in the `{#each}`, `.treatments__jump` rules in base + desktop media block |

`TreatmentCard.svelte` is not touched — it stays purely presentational and position-unaware.

## Verification

- `npm run check` — 0 errors
- `npm test` — 133 passed / 4 skipped, no regressions
- `npm run build` — clean
- Push; PR #10's `playwright-integration`, `lighthouse-and-a11y` and `build-and-audit` must pass
- Owner check on the Vercel preview: side card click centres it; centre card's arrow link still
  navigates; a mouse drag does not also jump
