---
id: 260713-myi
slug: hero-draw-on
date: 2026-07-13
status: complete
---

# Quick Task: Hero draw-on animation

## Goal

Make the hero illustration draw itself on first page load — strokes appear
progressively, as if being drawn — instead of appearing as a finished raster.

## Context

`src/lib/images/hero-illustration.png` (2015×1721, 790 KB, transparent bg) is a
single-weight line drawing: mountain ridges, a windswept tree, a winding river,
a waterfall. It is currently rendered by `src/lib/components/global/Hero.svelte`
via `<enhanced:img src="../../images/hero-illustration.png" ...>` (static src —
see `.planning/debug/hero-enhanced-img-hydration.md`; a dynamic src previously
caused a production hydration crash).

Because the source art is *already made of strokes*, a deterministic
centerline-trace + `stroke-dashoffset` reveal reproduces the artwork exactly.
No generative video model is involved (an image-to-video model would morph the
image rather than draw it, and would blow the LCP budget).

## Approach

1. Centerline-trace the PNG to SVG paths (build-time, one-off):
   binarize → skeletonize (`skimage.morphology.skeletonize`) → walk the skeleton
   graph into ordered polylines → simplify (RDP) → emit `<path>` elements.
   Outline tracers (potrace/vtracer) are unsuitable: they trace *around* each
   ink stroke, so the animation would outline lines rather than draw along them.
2. Group paths into 4 draw layers by geometry: **ridges → tree → river → waterfall**.
3. Emit a single SVG asset, committed to the repo. The tracer is a build-time
   script only — no runtime dependency, nothing ships to the browser.
4. Inline the SVG in `Hero.svelte`, replacing `<enhanced:img>`. Animate
   `stroke-dashoffset` from path length to 0, staggered per layer, ~2.5s total.
   Pure CSS — no JS, no scroll coupling, fires on load.
5. `prefers-reduced-motion: reduce` → final state rendered immediately, no animation.

## Constraints

- LCP < 2.5s, CLS < 0.1, INP < 200ms (CLAUDE.md). Inline SVG must not regress
  these; it should improve LCP by removing a 790 KB PNG from the critical path.
- No video element. No client-only rendering (SSG/AI-crawler requirement).
- SVG is decorative: keep `aria-hidden="true"`, no alt text, not an LCP text node.
- Must preserve the existing `.hero__img` sizing contract (the ResizeObserver in
  Hero.svelte writes `--hero-content-height`; the image must not outgrow the
  content column).

## Tasks

- [ ] T1 — Trace PNG to centerline SVG paths, grouped into 4 layers
- [ ] T2 — Verify traced SVG is visually faithful to the source PNG
- [ ] T3 — Inline SVG into Hero.svelte, replace enhanced:img
- [ ] T4 — CSS draw-on animation, staggered, + prefers-reduced-motion
- [ ] T5 — Build, verify hydration clean + no CLS regression

## Out of scope

- The three asset directories (`src/lib/images/`, `src/lib/assets/images/`,
  `static/images/`) overlap, and all five files in `src/lib/assets/images/` are
  dead 1×1 70-byte stubs. Worth collapsing — separately.
- Draw-on for the card/about illustrations. Hero first.
