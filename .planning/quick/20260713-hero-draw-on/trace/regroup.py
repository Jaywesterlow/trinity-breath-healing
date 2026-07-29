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
    default='wave',
    choices=['wave', 'speed', 'even'],
    help='wave (default): the hero\'s character — long per-stroke durations packed into a tight '
    'stagger, so a broad band of strokes is in flight at once and the image resolves quickly. '
    "speed: constant pen speed — every stroke's duration and start time are proportional to its "
    'length. Truer to a real pen, but only ~10 strokes are ever moving, so it reads slow and '
    'the viewer waits. even: every stroke gets --stroke seconds and an equal slice of the '
    'timeline (drawtrace.py\'s original).',
)
ap.add_argument(
    '--spread',
    type=float,
    default=0.73,
    help='wave pacing only: fraction of the timeline over which stroke start times are spread. '
    'The remainder is what the last stroke has left to draw in, so it also sets the nominal '
    'per-stroke duration. Lower = denser wavefront, messier. 0.73 is the hero. Ignored when '
    '--concurrency is given.',
)
ap.add_argument(
    '--concurrency',
    type=float,
    default=None,
    help='wave pacing only, and the knob that actually matters: how many strokes are mid-draw '
    'at any instant. Solves for the --spread that hits it. This does NOT change how fast the '
    'image resolves — new ink still arrives at n/total either way — it changes whether strokes '
    'are drawn slowly and overlapping (high) or quickly and crisply (low). It IS the frame '
    'cost, though: every stroke mid-draw is geometry the browser must re-rasterise each frame, '
    "and when the strokes live in a <mask> that means re-rasterising the mask. The hero runs 84 "
    'because it has no mask and re-rasterises nothing. Masked art cannot afford that — measured '
    'on a 4x-throttled phone-class profile, 367 masked strokes drop 8 frames at 84 and 2 at 20. '
    'Keep masked traces at ~20.',
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
ap.add_argument(
    '--last',
    action='append',
    default=[],
    metavar='X0,Y0,X1,Y1',
    help='defer every stroke whose bounding box falls inside this region to the very end of the '
    'draw, after everything else, however near the pen passed it. Repeatable. Nearest-neighbour '
    'order is adjacency, and adjacency is not always the story: the steam on card-kennismaking '
    'touches the cup rims, so the pen draws it on the way past and the tea steams before the cup '
    'it rises from exists. Naming the region is more honest than inventing a heuristic — these '
    'are eight hand-drawn illustrations, not a pipeline, and a rule tuned until it happens to '
    'split one of them is not a rule.',
)
ap.add_argument(
    '--last-order',
    default='y-up',
    choices=['y-up', 'y', 'nn', 'keep'],
    help='how to order the strokes --last defers. y-up (default) draws them bottom to top, which '
    'is what anything rising wants.',
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
    """Endpoints, centroid, bbox and length. Traces emit M/L polylines only, so this is exact."""
    n = [float(x) for x in NUM.findall(d)]
    pts = list(zip(n[0::2], n[1::2]))
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    length = sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
    return {
        'start': pts[0],
        'end': pts[-1],
        'cy': sum(ys) / len(ys),
        'len': length,
        'bbox': (min(xs), min(ys), max(xs), max(ys)),
    }


strokes = []
for i, m in enumerate(matches):
    s = measure(m.group(1))
    s['match'] = m
    s['i'] = i
    strokes.append(s)


def order_by(items, how, anchor=None):
    """Sort a stroke list. `nn` walks nearest-neighbour from `anchor`; the rest are plain sorts."""
    if how == 'y':
        return sorted(items, key=lambda s: s['cy'])
    if how == 'y-up':
        return sorted(items, key=lambda s: -s['cy'])
    if how == 'len':
        return sorted(items, key=lambda s: -s['len'])
    if how != 'nn':
        return list(items)
    if anchor is None:
        xs = [p for s in items for p in (s['start'][0], s['end'][0])]
        ys = [p for s in items for p in (s['start'][1], s['end'][1])]
        anchor = (min(xs), max(ys))  # bottom-left of the ink
    # Greedy nearest-neighbour over stroke endpoints. Geometry is never rewritten, so a stroke
    # always draws start -> end; but adjacency is what the eye reads, so the cost is the distance
    # to the *nearer* endpoint and the pen is left at the other one. O(n^2) — the largest trace
    # here is 367 strokes, ~67k distance checks, instant.
    remaining, pen, walked = list(items), anchor, []
    while remaining:
        best_i, best_cost, best_pen = 0, math.inf, pen
        for idx, s in enumerate(remaining):
            ds, de = math.dist(pen, s['start']), math.dist(pen, s['end'])
            cost, far = (ds, s['end']) if ds <= de else (de, s['start'])
            if cost < best_cost:
                best_i, best_cost, best_pen = idx, cost, far
        walked.append(remaining.pop(best_i))
        pen = best_pen
    return walked


# Strokes named by --last are pulled out before ordering and appended after it, so nothing in the
# main pass can wander into them and nothing in them can be drawn early.
regions = []
for r in a.last:
    try:
        x0, y0, x1, y1 = (float(v) for v in r.split(','))
    except ValueError:
        sys.exit(f'--last expects X0,Y0,X1,Y1 — got {r!r}')
    regions.append((min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)))


def deferred(s):
    bx0, by0, bx1, by1 = s['bbox']
    return any(x0 <= bx0 and by0 >= y0 and bx1 <= x1 and by1 <= y1 for x0, y0, x1, y1 in regions)


held = [s for s in strokes if deferred(s)]
strokes = [s for s in strokes if not deferred(s)]
if regions and not held:
    sys.exit(f'{a.src.name}: --last matched no strokes — check the region against the viewBox')

# ── Order ───────────────────────────────────────────────────────────────────────────────────
anchor = tuple(float(v) for v in a.anchor.split(',')) if a.anchor else None
strokes = order_by(strokes, a.order, anchor)
# The held-back strokes are walked among themselves, then appended. The pen finishing the main
# pass is where they start from, so they still join on rather than teleporting.
if held:
    strokes += order_by(held, a.last_order, strokes[-1]['end'] if strokes else anchor)

# ── Pacing ──────────────────────────────────────────────────────────────────────────────────
total_ink = sum(s['len'] for s in strokes) or 1.0

if a.pace == 'wave':
    # What makes the hero read as fast is not a shorter timeline — it is 2.86s for 372 strokes,
    # about the same as everything else here. It is that ~84 strokes are drawing at any instant
    # instead of ~10. Progress is visible everywhere at once, so the image resolves before the
    # viewer starts waiting for it. Slightly messy, and that is the trade being made on purpose.
    #
    # Two levers produce that: start times packed into a fraction of the timeline, and per-stroke
    # durations long enough to overlap heavily. Concurrency works out to roughly
    # n * (mean duration) / total.
    #
    # But concurrency is ALSO the frame cost, and that caps how much of the hero's character
    # masked art can borrow. Every stroke mid-draw is geometry to re-rasterise each frame, and
    # for strokes inside a <mask> that means re-rasterising the whole mask. Measured on a
    # 4x-throttled phone-class profile, card-verdieping-bg's 367 masked strokes drop a median of
    # 8 frames per run at concurrency 84 and 2 at 20; the same strokes with the mask removed drop
    # 1 at either. The hero gets away with 84 precisely because nothing masks it.
    #
    # What concurrency does NOT change is how fast the image resolves: new ink arrives at
    # n/total either way. It only decides whether strokes are drawn slowly and overlapping or
    # quickly and crisply. So the frame-cost ceiling costs some texture, never speed.
    n = max(len(strokes) - 1, 1)
    # Duration still tracks length, or long lines whoosh past while specks crawl. But it tracks
    # it through a sqrt and a clamp rather than proportionally: real lengths here span 447x
    # (2px to 894px), and honouring that ratio at this concurrency would give the longest stroke
    # ~10s. The hero's own durations span only about 3x, which is the range being matched.
    p90 = sorted(x['len'] for x in strokes)[int(len(strokes) * 0.9)] or 1.0
    scales = [min(max(0.45 + 0.9 * math.sqrt(s['len'] / p90), 0.4), 1.6) for s in strokes]

    def pace(spread):
        # The nominal duration is whatever the LAST stroke has left once the stagger has run —
        # so `spread` sets the stagger and the duration together and they cannot drift apart.
        base = a.total * (1 - spread)
        t = [[(k / n) * a.total * spread, max(base * sc, a.min_d)] for k, sc in enumerate(scales)]
        end = max(x + d for x, d in t)
        if end > 0:
            f = a.total / end
            t = [[x * f, d * f] for x, d in t]
        return t, sum(d for _, d in t) / a.total

    if a.concurrency is None:
        times, concurrent = pace(a.spread)
    else:
        # Concurrency falls monotonically as spread rises, so bisect. Closed form would have to
        # invert the duration floor and the rescale, and this converges in 40 steps regardless.
        lo, hi = 0.0, 0.999
        for _ in range(40):
            mid = (lo + hi) / 2
            if pace(mid)[1] > a.concurrency:
                lo = mid
            else:
                hi = mid
        times, concurrent = pace(hi)
    new_times = {id(s['match']): tuple(t) for s, t in zip(strokes, times)}
    floored = sum(1 for _, d in times if d <= a.min_d * 1.001)
elif a.pace == 'speed':
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
if a.pace != 'even':
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
