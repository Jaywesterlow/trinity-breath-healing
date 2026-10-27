---
status: complete
---
# Quick 261027-hil — summary

Hero intro and living lights ported from the approved prototypes into `Hero.svelte` + new `HeroLights.svelte`.

- Lines draw on: `hero-draw-{landscape,portrait}.svg` (traced mask strokes, timings baked by
  `Figma/Hero-redesign/intro-prototype/emit-draw.cjs`), inlined, CSS only — runs before hydration.
- Paint washes in from the tree at 1.82s (`--paint-r` three-radial mask on the picture).
- Lights fade in at 2.02s (`HeroLights.svelte`, client-only; pauses off-screen / hidden tab).
- Text wash 3.6s, text 4.1s.
- Portrait: text anchored to the bottom (button bottom = side padding); picture slides up on
  short phones, pure CSS flex overflow. Paper tile continues under the picture, arrives with the paint.

## Verified (preview build, Chromium + WebKit, 375×667 / 393×852 / 820×1180 / 1600×900)
- 0 console errors; CLS 0; LCP 0.2–0.5s (line layer / picture / text block).
- Gap under button = side padding (24 / 24 / 64); heading never above the river's lowest point.
- check 0 errors, eslint clean, build ok; visual baselines updated (reduced motion, deterministic).
- Full Playwright run: only failures were routes.spec canonical checks — pre-existing, caused by
  the local `.env` PUBLIC_SITE_URL (vercel.app) vs the expected .nl; unrelated to this task.
