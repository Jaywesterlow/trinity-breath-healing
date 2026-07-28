#!/usr/bin/env python3
"""
regroup.py — re-pace an already-traced draw-on SVG so it reads as being *drawn*.

Why this exists rather than a flag on drawtrace.py: the source artwork for every trace except
the hero is no longer in the working tree (src/lib/assets/images/*.png are 70-byte 1x1 stubs;
the real files are recoverable from git history by blob SHA — see DRAW-ON-PLAYBOOK.md), so in
practice the traces are re-paced rather than regenerated. This works on the emitted SVG.

It never touches path geometry. Only the `--t` (delay) and `--d` (duration) values inside each
mask stroke's `style` attribute are rewritten, so the artwork cannot change — only the pacing
and the order.

The two things that make a trace look mechanical
------------------------------------------------
**1. Order.** drawtrace.py sorts strokes top-to-bottom. On line art that is a scanline: a
horizontal band of progress sweeping down the canvas, filling in whatever it passes. On
card-verdieping-bg it also draws every leaf *before* the branch it hangs from, because the
leaves are higher up. The reported symptom was "it looks like a printer".

**2. Pacing.** Every stroke got the same duration and an equal share of the timeline regardless
of length. In card-verdieping-bg, 51% of the strokes are under 30px but carry only 13% of the
total ink — so half the animation was spent on stipple while an 894px path line was rushed
through in the same 0.26s. Short strokes pop, long strokes whoosh. Nothing about that reads as
a pen.

`--order nn` fixes the first, `--pace speed` fixes the second. They are independent, but the
combination is the point: a pen that moves at a constant speed to wherever it just was.

Why not cluster into objects
----------------------------
Tried and abandoned: union-find over dilated stroke bounding boxes. In line art a long curved
stroke has a bounding box covering much of the canvas, so boxes overlap between strokes that
belong to different objects. Results were wildly unstable — card-kennismaking gave 18 clusters
at zero dilation, 2 at 0.2%, and 1 at 0.5%. There is no stable object scale to find this way,
and a metric that needs per-image tuning is not an improvement over what it replaces.

`--order nn` gets the benefit without the classification: a nearest-neighbour walk finishes a
leaf, a cup, a limb before it moves on, because the strokes of one object *are* each other's
nearest neighbours. It never has to decide where an object ends.

Usage:
    python regroup.py trace.svg --order nn --anchor 330,615 --pace speed --total 2.6
"""

import argparse
import math
import re
import sys
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument('src', type=Path)
ap.add_argument('--out', type=Path, default=None, help='defaults to overwriting src')
ap.add_argument('--total', type=float, default=2.6, help='total draw time, seconds')
ap.add_argument(
    '--order',
    default='nn',
    choices=['nn', 'y', 'y-up', 'len', 'keep'],
    help='nn (default): nearest-neighbour walk from --anchor — the pen finishes what it is near '
    'before moving on, so objects complete instead of the canvas filling in bands. y: top to '
    "bottom (drawtrace.py's original, kept for comparison). y-up: bottom to top. len: longest "
    'first, structure before detail. keep: leave the existing order alone.',
)
ap.add_argument(
    '--anchor',
    default=None,
    metavar='X,Y',
    help='where the pen starts, in viewBox units — nn order only. Pick the point the subject '
    'grows from: the trunk base of a tree, the foot of the nearest cup. Defaults to the '
    "bottom-left of the ink's bounding box.",
)
ap.add_argument(
    '--pace',
    default='speed',
    choices=['speed', 'even'],
    help="speed (default): constant pen speed — every stroke's duration and start time are "
    'proportional to its length, so the timeline is spent on ink rather than on stroke count. '
    'even: every stroke gets --stroke seconds and an equal slice of the timeline (the old '
    'behaviour).',
)
ap.add_argument(
    '--stroke', type=float, default=0.26, help='per-stroke duration, seconds — even pacing only'
)
ap.add_argument(
    '--overlap',
    type=float,
    default=2.0,
    help='speed pacing only: roughly how many strokes are in flight at once. 1.0 is strictly '
    'one at a time and reads staccato; higher blends each stroke into the next.',
)
ap.add_argument(
    '--min-d',
    type=float,
    default=0.12,
    help="speed pacing only: floor on a single stroke's duration, seconds. Without it the 2px "
    'specks in a stipple would be given ~0.3ms and appear as instant pops. These strokes are '
    'round-capped at up to 22px wide, so even the shortest is a visible mark and needs a beat '
    'to arrive.',
)
ap.add_argument('--dry-run', action='store_true', help='report, write nothing')
a = ap.parse_args()

svg = a.src.read_text(encoding='utf-8')

# Only paths carrying pathLength="1" are draw strokes; the artwork itself is a separate
# compound fill path (or an <image>) with no pathLength and must not be touched.
PATH_RE = re.compile(r'<path pathLength="1"[^>]*?d="([^"]+)"[^>]*?/>')
matches = list(PATH_RE.finditer(svg))
if not matches:
    sys.exit(f'{a.src}: no draw strokes found (no pathLength="1" paths)')

NUM = re.compile(r'-?\d+(?:\.\d+)?')


def measure(d):
    """Endpoints, centroid and length. Traces emit M/L polylines only, so this is exact."""
    n = [float(x) for x in NUM.findall(d)]
    pts = list(zip(n[0::2], n[1::2]))
    cy = sum(p[1] for p in pts) / len(pts)
    length = sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
    return {'start': pts[0], 'end': pts[-1], 'cy': cy, 'len': length}


strokes = []
for i, m in enumerate(matches):
    s = measure(m.group(1))
    s['match'] = m
    s['i'] = i
    strokes.append(s)

# ── Order ───────────────────────────────────────────────────────────────────────────────────
if a.order == 'y':
    strokes.sort(key=lambda s: s['cy'])
elif a.order == 'y-up':
    strokes.sort(key=lambda s: -s['cy'])
elif a.order == 'len':
    strokes.sort(key=lambda s: -s['len'])
elif a.order == 'nn':
    if a.anchor:
        ax, ay = (float(v) for v in a.anchor.split(','))
    else:
        xs = [p for s in strokes for p in (s['start'][0], s['end'][0])]
        ys = [p for s in strokes for p in (s['start'][1], s['end'][1])]
        ax, ay = min(xs), max(ys)  # bottom-left of the ink

    # Greedy nearest-neighbour over stroke endpoints. Geometry is never rewritten, so a stroke
    # always draws start -> end; but adjacency is what the eye reads, so the cost is the
    # distance to the *nearer* endpoint and the pen is left at the other one. O(n^2) — the
    # largest trace here is 367 strokes, ~67k distance checks, instant.
    remaining = list(strokes)
    pen = (ax, ay)
    walked = []
    while remaining:
        best_i, best_cost, best_pen = 0, math.inf, pen
        for idx, s in enumerate(remaining):
            ds, de = math.dist(pen, s['start']), math.dist(pen, s['end'])
            cost, far = (ds, s['end']) if ds <= de else (de, s['start'])
            if cost < best_cost:
                best_i, best_cost, best_pen = idx, cost, far
        walked.append(remaining.pop(best_i))
        pen = best_pen
    strokes = walked

# ── Pacing ──────────────────────────────────────────────────────────────────────────────────
total_ink = sum(s['len'] for s in strokes) or 1.0

if a.pace == 'speed':
    times, cum = [], 0.0
    for s in strokes:
        # Serial baseline: the pen covers `total_ink` units in `--total` seconds, so a stroke
        # starts when the pen reaches it and lasts as long as its own length takes.
        times.append(
            [
                (cum / total_ink) * a.total,
                max((s['len'] / total_ink) * a.total * a.overlap, a.min_d),
            ]
        )
        cum += s['len']
    # The overlap multiplier and the duration floor both push the end past --total. Rescale
    # uniformly so the drawing still finishes exactly when it was asked to; the relative pacing
    # — the whole point — is untouched by a uniform scale.
    end = max(t + d for t, d in times)
    if end > 0:
        k = a.total / end
        times = [[t * k, d * k] for t, d in times]
    new_times = {id(s['match']): tuple(t) for s, t in zip(strokes, times)}
    concurrent = sum(d for _, d in times) / a.total
    floored = sum(
        1 for s in strokes if (s['len'] / total_ink) * a.total * a.overlap < a.min_d
    )
else:
    n = max(len(strokes) - 1, 1)
    new_times = {
        id(s['match']): (a.total * (k / n) * (1 - a.stroke / a.total), a.stroke)
        for k, s in enumerate(strokes)
    }
    concurrent = len(strokes) * a.stroke / a.total
    floored = 0

print(
    f'{a.src.name}: {len(strokes)} strokes, order={a.order}, pace={a.pace}, '
    f'{a.total:.2f}s total -> ~{concurrent:.1f} drawing at once'
)
if a.pace == 'speed':
    print(f'  {floored}/{len(strokes)} strokes short enough to hit the {a.min_d}s floor')
if a.dry_run:
    sys.exit(0)

STYLE_RE = re.compile(r'style="--t:[0-9.]+s;--d:[0-9.]+s"')
out, last = [], 0
for m in matches:
    t, dur = new_times[id(m)]
    frag, count = STYLE_RE.subn(f'style="--t:{t:.3f}s;--d:{dur:.3f}s"', m.group(0))
    if count != 1:
        sys.exit(f'{a.src}: expected exactly one style per stroke, got {count}')
    out.append(svg[last : m.start()])
    out.append(frag)
    last = m.end()
out.append(svg[last:])

dest = a.out or a.src
dest.write_text(''.join(out), encoding='utf-8')
print(f'  -> {dest.name} rewritten; completes at {max(t + d for t, d in new_times.values()):.2f}s')
