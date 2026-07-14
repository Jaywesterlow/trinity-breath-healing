# Fix plan — masked draw-on SVGs clip their own artwork

_Planned 2026-07-14 (Opus). Execution: Sonnet subagent._

## Symptom

User-visible: the Verdieping card art (Werkwijze, 3rd card) is nearly blank, and the two
About portraits have corners/edges cut off. About portrait 1 is "pretty okay". The small
Werkwijze cards (Kennismaking cups, De sessie figure) render correctly.

## Diagnosis (verified live in the DOM, dev server)

The uncommitted SVGs use a **fill + mask** technique — a change from the committed
centerline-stroke technique in `a74eb55`:

```
<svg class="lt lt-draw-host" viewBox="0 0 1641 895">
  <defs><mask id="dm79407">
    <g class="lt-draw" stroke="#fff">   <-- 367 centerline paths, animated stroke-dashoffset
      <path pathLength="1" stroke-width="7.4" .../>
    </g>
  </mask></defs>
  <path fill="#696857" mask="url(#dm79407)" d="..."/>   <-- 1 filled path = the real artwork
</svg>
```

This is the right architecture: the fill carries the artwork's true variable-width brush
strokes; the mask gates *when* it appears. The bug is in the mask's dimensions.

**Root cause — the mask strokes are thinner than the ink they must reveal.** A centerline
skeleton sits at the middle of a stroke; to reveal the whole stroke the mask must be at
least as wide as the ink is thick. Verdieping's mask strokes are `5.8`–`7.4` units in a
1641-unit viewBox. Wherever the artwork's brush is thicker than that, the surplus ink falls
outside the mask and is clipped **permanently** (not just during the animation — dashoffset
is already 0 and the art is still missing). Ink is thickest at corners and joins, and that
is precisely where the skeleton pulls away from the outline — hence "cutting corners".

Verdieping is the worst case because its source art is large and finely detailed, so
proportionally little of its fill survives.

Confirmed in the DOM:

| SVG | viewBox | mask paths | mask stroke-width | fill | rendered |
|---|---|---|---|---|---|
| card-verdieping-bg | 1641×895 | 367 | 5.8 – 12.7 | `#696857` | 398×217, near-blank |
| about-portrait-1 | 1060×1580 | 86 | 24.2 | `#fffbf5` | (desktop) |
| about-portrait-2 | 795×1185 | 53 | 5.8 | `#fffbf5` | (desktop) |

The filled artwork geometry itself is **good** — Verdieping's fill bbox is 1281×859 inside a
1641×895 viewBox, i.e. it fills the frame. Nothing is wrong with the trace. Only the mask
clips.

## Second bug — duplicate mask ids

The About portraits are inlined twice (desktop + mobile markup). Both copies carry the same
`<mask id>`: `dm19661` appears on two SVGs in one document, as does `dm7315`. Duplicate ids
mean the second instance resolves `url(#dm19661)` to the *first* mask, so one portrait is
masked by the other's skeleton. Ids must be unique per inlined instance.

## Third issue — ground truth was deleted

`a74eb55` deleted the source rasters (`static/images/card-verdieping-bg.png`,
`about-portrait-1.png`, `about-portrait-2.png`, the card PNGs). Only
`src/lib/images/hero-illustration.png` survives. They must be restored from git before any
visual verification is possible:

```bash
git show a74eb55^:static/images/card-verdieping-bg.png > <scratch>/card-verdieping-bg.png
git show a74eb55^:static/images/about-portrait-1.png  > <scratch>/about-portrait-1.png
git show a74eb55^:static/images/about-portrait-2.png  > <scratch>/about-portrait-2.png
```

(To a scratch dir — do NOT re-add them to the repo; dropping the raster payload was the
point of the commit.)

## Fourth issue — the generator is gone

`.planning/quick/20260713-hero-draw-on/trace/` is **unmodified** in git and only emits the
old centerline form (`grep -i mask` → 1 incidental hit, a bitmask, not an SVG mask). The
script that produced the working-tree fill+mask SVGs does not exist in the repo. So:

**Do not attempt to re-trace.** The traces are good; only their mask attributes are wrong.
Fix by editing the existing SVG files in place. No Python, no re-trace, no PNG re-import.

## The fix

1. **Back up first.** The working-tree SVGs are uncommitted and are the *only* copy of the
   new traces. Copy all 11 modified/new SVGs to a backup dir before touching them.

2. **Widen each mask stroke.** For every path inside `<mask>`, scale `stroke-width` up so the
   mask fully covers the fill. The mask only needs to be *at least* as wide as the ink;
   overshooting is harmless (a mask wider than the fill reveals nothing extra — the fill is
   the only thing being painted). So bias generously rather than tuning tightly.
   Start by multiplying every in-mask `stroke-width` by ~3× and verify; raise per-image if
   any clipping remains. Keep `stroke-linecap="round"` / `stroke-linejoin="round"` so joins
   don't re-introduce notches.

   Note: widening the mask stroke slightly *lengthens* the perceived draw-on (a fatter pen
   covers ground faster). The `pathLength="1"` + dashoffset timing is unaffected.

3. **Make mask ids unique per instance.** Either give each inlined copy a distinct id at
   render time in `DrawOn.svelte`, or stop inlining the same SVG twice. Whichever is less
   invasive — but a page must never contain two `<mask>`s with the same id.

4. **Verify against the restored PNGs.** Rasterize each fixed SVG at its rendered size and
   compare to the original PNG. The repo already has Playwright + headless Chromium; use it
   (the Chrome extension's viewport is currently stuck at 280×235 and unusable). Check
   desktop (1440×900) and mobile (390). Verdieping must no longer be blank; both portraits
   must be complete.

5. **Re-verify the draw-on still works** — strokes animate, dashoffset lands at 0, art is
   complete at rest, `prefers-reduced-motion` skips the animation, and the no-JS path still
   shows finished art (progressive enhancement: CSS never hides, JS arms — per `a74eb55`).

6. **Gates:** `npm run test` (136 expected), `npm run check` (0 errors).

7. **Do not commit.** Report back; commits need the user's explicit sign-off.

## Out of scope

- Re-tracing or touching the trace scripts.
- The logo (`static/trinity-logo.svg` + `NavLogo.svelte`) — already verified good.
- The small static card SVGs (Kennismaking, De sessie, heart, sprout) — rendering correctly.
- Slice 1 / Tailwind / shadcn work.
