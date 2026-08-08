#!/usr/bin/env python3
"""
maskclip.py — convert a draw-on trace from an animated <mask> to a static <clipPath>.

Why
---
drawtrace.py emits the reveal as an SVG <mask>: a group of stroked paths whose
`stroke-dashoffset` animates from hidden to drawn, masking the artwork underneath. It produces
the right picture and it is ruinously expensive. A mask is an alpha-compositing pass, and its
contents change on every frame of the animation, so the browser re-rasterises the whole masked
element 60 times a second.

Measured with a Chrome trace, card-verdieping-bg at 397x217 CSS px on a DPR-3 viewport, summing
RasterTask over the 2.4s draw:

    mask, as emitted .................. 811 ms
    the same strokes with no mask ..... 170 ms
    clipPath (this script) ............   7 ms

Nothing else moved the number. Concurrency did not (713 ms at 5 strokes in flight, 888 ms at 40
— a 16x range for 25%); neither did what sat under the mask (a 195-subpath compound fill, a flat
rect and a raster <image> were all within noise of each other); neither did
shape-rendering="optimizeSpeed". The cost is the mask itself, and it is close to fixed per frame.

How
---
When the artwork is a single flat colour, the mask is doing something a clip can do instead.
`artwork ∩ strokes` is the same set of pixels as `strokes ∩ artwork` — so rather than painting
the artwork and masking it with the strokes, paint the *strokes* in the artwork's own fill
colour and clip them to the artwork's outline. A clipPath is a static geometric intersection:
its contents never change, so it is rasterised once and the animated strokes composite against
it for free.

The final frame is pixel-identical, and so is every frame in between, because the intersection
is symmetric. Verified against the mask version at eight points through the draw.

Limits
------
Only works when the artwork is a **flat-filled path**. card-kennismaking reveals a photographic
<image>, and strokes cannot be painted "in the colour of" a photo — that one has to keep its
mask. Anything with a gradient or multiple fills is out for the same reason.

Usage:
    python maskclip.py src/lib/images/card-verdieping-bg.svg
"""

import argparse
import re
import sys
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument('src', type=Path)
ap.add_argument('--out', type=Path, default=None, help='defaults to overwriting src')
ap.add_argument('--dry-run', action='store_true')
a = ap.parse_args()

svg = a.src.read_text(encoding='utf-8')

if '<clipPath' in svg:
    sys.exit(f'{a.src.name}: already converted')
if '<image' in svg:
    sys.exit(
        f'{a.src.name}: artwork is a raster <image>; strokes cannot take its colour, so this '
        'one has to keep its mask (see "Limits" in this script).'
    )

mask_id = re.search(r'<mask id="([^"]+)"', svg)
if not mask_id:
    sys.exit(f'{a.src.name}: no <mask> found — nothing to convert')
mask_id = mask_id.group(1)

# The artwork: the one path that is NOT a draw stroke (draw strokes carry pathLength="1").
art = re.search(r'<path (?![^>]*pathLength)([^>]*)/>', svg)
if not art:
    sys.exit(f'{a.src.name}: no artwork path found')
attrs = art.group(1)
d = re.search(r'\bd="([^"]+)"', attrs)
fill = re.search(r'\bfill="([^"]+)"', attrs)
if not d or not fill:
    sys.exit(f'{a.src.name}: artwork path has no d= or no flat fill=')
rule = (re.search(r'\bfill-rule="([^"]+)"', attrs) or [None, 'nonzero'])[1]
if not re.fullmatch(r'#[0-9a-fA-F]{3,8}', fill.group(1)):
    sys.exit(f'{a.src.name}: artwork fill "{fill.group(1)}" is not a flat colour')

# The stroke group, verbatim — geometry, widths, per-stroke --t/--d all untouched. Only the
# paint colour changes: in a mask the strokes had to be #fff (mask luminance); painted directly
# they take the artwork's own colour.
group = re.search(r'<g class="lt-draw"[^>]*>[\s\S]*?</g>', svg)
if not group:
    sys.exit(f'{a.src.name}: no <g class="lt-draw"> found')
strokes = re.sub(r'\bstroke="#fff"', f'stroke="{fill.group(1)}"', group.group(0), count=1)
if 'stroke="#fff"' in group.group(0) and strokes == group.group(0):
    sys.exit(f'{a.src.name}: could not recolour the stroke group')

clip_id = f'{mask_id}-clip'
out = re.sub(
    r'<defs>[\s\S]*?</defs>',
    f'<defs><clipPath id="{clip_id}" clipPathUnits="userSpaceOnUse">'
    f'<path clip-rule="{rule}" d="{d.group(1)}"/></clipPath></defs>',
    svg,
    count=1,
)
out = out.replace(art.group(0), f'<g clip-path="url(#{clip_id})">{strokes}</g>', 1)

if out.count('pathLength="1"') != svg.count('pathLength="1"'):
    sys.exit(f'{a.src.name}: stroke count changed — refusing to write')
if '<mask' in out:
    sys.exit(f'{a.src.name}: a <mask> survived the conversion — refusing to write')

print(
    f'{a.src.name}: mask -> clipPath, {svg.count(chr(112) + "athLength")} strokes kept, '
    f'stroked in {fill.group(1)}, clip-rule={rule}'
)
if a.dry_run:
    sys.exit(0)
dest = a.out or a.src
dest.write_text(out, encoding='utf-8')
print(f'  -> {dest.name} written ({len(svg)} -> {len(out)} bytes)')
