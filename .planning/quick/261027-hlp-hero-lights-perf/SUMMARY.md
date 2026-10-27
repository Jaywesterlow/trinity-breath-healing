---
status: complete
date: 2026-10-27
---

# Hero lights: smooth on low-end devices

Measured with Chrome traces at 393x852, DPR 3 (raster + script ms per second, steady state
after the intro).

| | raster | script |
|---|---|---|
| before | 2228 | 280 |
| after (phone) | ~410 | ~80 |

- The lights' blurred glow layer sat under an opaque copy of the same image and never
  showed (0 pixels differ); it was re-filtered every frame. Removed.
- The line boost filter is baked into `hero-lit-*.webp` (`intro-prototype/bake-lit.cjs`,
  linearRGB like SVG filters, quality 70 = same file size). Max 5/255 difference.
- Script: no `getComputedStyle` per frame, constant radii set once, dark fireflies skipped.
- Touch screens draw the lights at 30fps; streaks stay WAAPI.
- Fallback: if frames average over 25ms in the two seconds after the intro, fireflies and
  streaks stop and the breathing lights stay. Verified: triggers at 6x CPU, not at 1x
  (Chromium phone/desktop, WebKit phone), 0 errors.

Intro (no waste found): line drawing, paint wash and text wash cost about 570 / 470 /
260 ms/s raster. The sequence stays as Jay set it (lights with the paint).
