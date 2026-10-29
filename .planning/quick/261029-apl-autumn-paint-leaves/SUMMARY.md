---
status: complete
date: 2026-10-29
---

# 261029-apl: autumn leaves, portrait paint-in, scroll both ways, gentler hover

- **Portrait:** the gold ring is gone. The photo paints itself in from the left with
  horizontal brush strokes (CSS mask, `paint-mask.cjs`, 9KB), 3.2s expo ease-out.
  Library 48a was read and not used: it is scroll-scrubbed and its filter edge fails in
  Safari and Firefox. Armed from JS only after the mask loads; reduced motion, no JS, or
  already on screen means no effect.
- **Leaves:** eight autumn leaves drawn in code (`autumn-leaves.cjs`): maple in red,
  orange and yellow-green; sweet gum in dark red; oak in rust and orange-green; beech in
  copper and green-yellow. A scroll in either direction speeds them up.
- **Services fan:** the idle drift is half as fast (12.8s per card). A scroll in either
  direction speeds it up. Under the pointer it eases to half speed (tau 500ms) instead of
  stopping, and eases back up (tau 1500ms) once the pointer leaves. Keyboard focus and
  the pause button still hold it.

## Checks
svelte-check 0 errors; eslint and prettier clean on changed files; build ok; scroll-drive,
click-to-jump, drag-band and no-dead-css-vars 21/21; visual baselines for home updated (ring gone).
