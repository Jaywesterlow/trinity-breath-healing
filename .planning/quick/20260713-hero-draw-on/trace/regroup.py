#!/usr/bin/env python3
"""
regroup.py — re-pace an already-traced draw-on SVG so it reads as being drawn.

Why this exists rather than a flag on drawtrace.py: the source artwork for every trace except
the hero is no longer in the repository (src/lib/assets/images/*.png are 70-byte 1x1 stubs),
so the traces cannot be regenerated. This works on the emitted SVG instead.

It never touches path geometry. Only the `--t` (delay) and `--d` (duration) values inside each
mask stroke's `style` attribute are rewritten, so the artwork cannot change — only the pacing.

The problem
-----------
drawtrace.py sorts mask strokes top-to-bottom, spreads their delays over `duration * 0.55`,
and gives each stroke `duration * 0.45`. For card-verdieping-bg that is 367 strokes staggered
across 1.21s while each takes ~1s — a new stroke every 3.3ms, hundreds mid-draw at any instant.
It reads as the whole image fading in at once rather than being drawn. That is the reported bug.

Note the order was never the problem: the strokes are already sorted top-to-bottom. The
overlap is.

Why not cluster into objects
----------------------------
Tried and abandoned: union-find over dilated stroke bounding boxes. In line art a long curved
stroke has a bounding box covering much of the canvas, so boxes overlap between strokes that
belong to different objects. Results were wildly unstable — card-kennismaking gave 18 clusters
at zero dilation, 2 at 0.2%, and 1 at 0.5%. There is no stable object scale to find this way,
and a metric that needs per-image tuning is not an improvement over what it replaces.

What this does instead
----------------------
Fixes the ratio. The stagger is spread across the whole draw, and each stroke is short enough
that only a handful are in flight at once — so you see a point of progress moving through the
drawing instead of the entire image resolving together.

Usage:
    python regroup.py path/to/trace.svg [--total 2.6] [--stroke 0.26] [--dry-run]
"""

import argparse
import re
import sys
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument('src', type=Path)
ap.add_argument('--out', type=Path, default=None, help='defaults to overwriting src')
ap.add_argument('--total', type=float, default=2.6, help='total draw time, seconds')
ap.add_argument('--stroke', type=float, default=0.26, help='per-stroke duration, seconds')
ap.add_argument(
    '--order',
    default='y',
    choices=['y', 'y-up', 'len', 'keep'],
    help='y: top to bottom (default). y-up: bottom to top — right when the subject reads as '
    'building upward, e.g. cups before the steam above them. len: longest first, structure '
    'before detail. keep: leave the existing order alone.',
)
ap.add_argument('--dry-run', action='store_true', help='report, write nothing')
a = ap.parse_args()

svg = a.src.read_text(encoding='utf-8')

# Only paths carrying pathLength="1" are draw strokes; the artwork itself is a separate
# compound fill path with no pathLength and must not be touched.
PATH_RE = re.compile(r'<path pathLength="1"[^>]*?d="([^"]+)"[^>]*?/>')
matches = list(PATH_RE.finditer(svg))
if not matches:
    sys.exit(f'{a.src}: no draw strokes found (no pathLength="1" paths)')

NUM = re.compile(r'-?\d+(?:\.\d+)?')


def measure(d):
    """Centroid and rough length. Traces emit M/L polylines only, so this is exact."""
    n = [float(x) for x in NUM.findall(d)]
    pts = list(zip(n[0::2], n[1::2]))
    cy = sum(p[1] for p in pts) / len(pts)
    length = sum(
        ((pts[i + 1][0] - pts[i][0]) ** 2 + (pts[i + 1][1] - pts[i][1]) ** 2) ** 0.5
        for i in range(len(pts) - 1)
    )
    return cy, length


strokes = [{'match': m, 'i': i, 'cy': measure(m.group(1))[0], 'len': measure(m.group(1))[1]}
           for i, m in enumerate(matches)]

if a.order == 'y':
    strokes.sort(key=lambda s: s['cy'])
elif a.order == 'y-up':
    strokes.sort(key=lambda s: -s['cy'])
elif a.order == 'len':
    strokes.sort(key=lambda s: -s['len'])

n = max(len(strokes) - 1, 1)
concurrent = max(1, round(len(strokes) * a.stroke / a.total))
print(
    f'{a.src.name}: {len(strokes)} strokes, order={a.order}, '
    f'{a.stroke:.2f}s each over {a.total:.2f}s -> ~{concurrent} drawing at once'
)
if a.dry_run:
    sys.exit(0)

new_times = {
    id(s['match']): (a.total * (k / n) * (1 - a.stroke / a.total), a.stroke)
    for k, s in enumerate(strokes)
}

STYLE_RE = re.compile(r'style="--t:[0-9.]+s;--d:[0-9.]+s"')
out, last = [], 0
for m in matches:
    t, dur = new_times[id(m)]
    frag, count = STYLE_RE.subn(f'style="--t:{t:.2f}s;--d:{dur:.2f}s"', m.group(0))
    if count != 1:
        sys.exit(f'{a.src}: expected exactly one style per stroke, got {count}')
    out.append(svg[last : m.start()])
    out.append(frag)
    last = m.end()
out.append(svg[last:])

dest = a.out or a.src
dest.write_text(''.join(out), encoding='utf-8')
print(f'  -> {dest.name} rewritten; completes at {max(t + d for t, d in new_times.values()):.2f}s')
