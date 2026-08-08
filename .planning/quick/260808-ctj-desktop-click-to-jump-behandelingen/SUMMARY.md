---
id: 260808-ctj
type: quick
status: complete
date: 2026-08-08
branch: claude/accessible-work-repos-kb67gy
---

# Desktop click-to-jump on the Behandelingen carousel — complete

Clicking a visible side card on desktop centres it. Closes the item `HANDOFF.md` listed as
"mentioned early in the session as a requirement and never implemented" for this section.

## What shipped

`src/lib/components/global/Behandelingen.svelte` only. `TreatmentCard.svelte` untouched — it
stays presentational and position-unaware.

- Transparent overlay `<button class="treatments__jump">` filling `.treatments__pivot`,
  rendered only at `positions[i] === ±1`. `display: none` in the base rule, `display: block`
  in the existing `@media (min-width: 1024px)` block.
- `jumpTo(i)` → `goTo(i)` → the existing `commitSteps` cascade. No new position maths.
- `dragMoved` (4px slop, set off total travel in `onWindowPointerMove`) blocks the jump a
  desktop mouse drag would otherwise fire on release.
- `if (cascading) return;` guard added to `goTo`.

## Deviation from plan

None to the approach. One thing worth flagging: the `cascading` guard in `goTo` also changes
the **dots'** behaviour — a dot click during a cascade is now ignored rather than queued. That
is wider than "add click-to-jump", but it closes the exact overlapping-cascade case the file's
own comments document as producing measurable card overlap, and the new overlay makes far
bigger targets for triggering it.

## Verification

- `npm run check` — 0 errors (1 pre-existing `AboutStat.svelte` warning)
- `npm test` — 17 files, 133 passed, 4 skipped
- `npm run build` — clean
- `tests/integration/behandelingen-click-to-jump.spec.ts` — 6 passed

The drag-does-not-jump test was confirmed to have teeth: with `if (dragMoved) return;`
disabled **and the app rebuilt**, it fails. First attempt at that check was worthless — the
Playwright `webServer` runs `vite preview`, which serves the last build, so editing source
without rebuilding tests the old bundle. Worth remembering for this repo.

## Not done

- Real-device pass on swipe feel (`PX_PER_STEP`, `FLING_VELOCITY_PER_STEP`, `MAX_FLING_STEPS`)
  is still open — unchanged by this task.
- Local `npx playwright test` shows 30 failures on this machine (html-audit canonical needs
  `PUBLIC_SITE_URL`; visual-regression baselines were captured on Linux). Pre-existing local
  noise — CI is green on all five checks for the same tree.
