---
id: 260713-myi
slug: hero-draw-on
date: 2026-07-13
status: complete
---

# Summary: Hero draw-on animation

The hero illustration now draws itself on first load — ridges, then the tree growing up
from its roots, then the river, then the waterfall — in ~2.9s. Pure CSS, no JS, no video.

## What shipped

| File | Change |
|---|---|
| `src/lib/images/hero-illustration.svg` | **new** — centerline trace of the PNG, 285 paths in 4 layers, 36 KB (10.6 KB gzipped) |
| `src/lib/components/global/Hero.svelte` | `<enhanced:img>` → inlined SVG (`?raw` + `{@html}`), draw-on CSS, `prefers-reduced-motion` |
| `.planning/quick/20260713-hero-draw-on/trace/` | the tracer (4 Python scripts) — regenerate the SVG if the artwork changes |

## Approach

Outline tracers (potrace/vtracer) trace *around* each ink stroke, which would make the
animation outline the lines rather than draw along them. So: binarize the alpha channel →
`skimage.morphology.skeletonize` → walk the skeleton graph into ordered polylines → RDP
simplify → emit `<path>`s carrying `pathLength="1"` plus a baked-in `--t` (delay) and
`--d` (duration). CSS animates `stroke-dashoffset` 1 → 0.

Ridges and tree canopy overlap geometrically, so a bounding-box split misfired (it put the
right mountain inside the tree). Layers are assigned from the ink's **connected components**
instead, with ridges identified by shape + stroke density — a ridge is a long, shallow,
sparse sweep; the canopy is dense.

## Verified (production build, real Chromium)

| | baseline (`<enhanced:img>`) | after |
|---|---|---|
| desktop geometry | 720×615, aspect 1.171 | **720×615, aspect 1.171** |
| mobile geometry | 390×333, aspect 1.171 | **390×333, aspect 1.171** |
| desktop CLS | 0.0196 | **0.0197** |
| mobile CLS | 0.0000 | **0.0000** |
| LCP | 432ms (`<h1>`) | **428ms (`<h1>`)** — hero is decorative, never the LCP element |
| hydration | clean | **clean, 0 pageerrors** |

- `prefers-reduced-motion: reduce` → `animation-name: none`, `stroke-dashoffset: 0` at t=120ms
  (finished drawing, instantly).
- ClaudeBot initial-HTML check passes: h1=1, 10 JSON-LD nodes.
- 136 unit tests pass; `svelte-check` 0 errors; JSON-LD audit passes.
- The 790 KB PNG is no longer referenced by the build (0 refs in prerendered HTML). It stays
  on disk as the source of truth for re-tracing.

## Two things worth knowing

**The `max-width: 130%` "bleed" on `.hero__img` was dead code.** `<enhanced:img>` served a
downscaled raster (intrinsic 389px at mobile), so `width: auto` never reached the 130% cap.
The SVG's intrinsic width is the artwork's full 2015px, which *did* hit it and bled off both
edges — a size change nobody asked for. Set to `100%`, which reproduces the shipped rendering
exactly. If the bleed was ever the actual intent, it has never been live, and is a separate call.

**A wrapper `<div class="hero__img-wrap">` stands in for the `<picture>`** that enhanced-img
used to emit. Without it the SVG becomes the flex item itself, and its width shifts along with
the ResizeObserver's height write — tripling desktop CLS (0.0197 → 0.0589). The wrapper keeps
the flex item's width constant so only height moves, as before.

## Follow-ups (not done)

- `src/lib/assets/images/` holds five dead 1×1 70-byte stubs (`hero.png`, `card-*.png`,
  `about-illustration-*.png`). Nothing imports them. Three asset dirs (`src/lib/images/`,
  `src/lib/assets/images/`, `static/images/`) overlap by name — worth collapsing.
- Prettier flags `Hero.svelte` (and 91 other files) — pre-existing, repo-wide, not touched.
- Same draw-on treatment could apply to the card/about illustrations.
