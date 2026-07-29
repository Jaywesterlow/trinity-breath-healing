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
    default='chain',
    choices=['chain', 'nn', 'y', 'y-up', 'len', 'keep'],
    help='chain (default): greedy-edge tour — commits the shortest joins between stroke ends '
    'first, so a line that continues into another is drawn back to back. nn: nearest-neighbour walk from --anchor — the pen finishes what it is near '
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
    choices=['y-up', 'y', 'nn', 'chain', 'keep'],
    help='how to order the strokes --last defers. y-up (default) draws them bottom to top, which '
    'is what anything rising wants.',
)
ap.add_argument(
    '--section',
    action='append',
    default=[],
    metavar='NAME:INDICES',
    help='draw the named strokes as one section, sections in the order given: '
    '--section "front rim:23,26,28-29,32-36". Indices are stroke positions in document order; '
    'render an index map to read them off. Every stroke must land in exactly one section — '
    'anything missed is an error, not a silent leftover. This replaces guessing: --order and '
    '--last infer structure from geometry, and geometry does not know that two overlapping '
    'ellipses are two cups. Sections say so directly. Ranges (a-b) and repeats are allowed.',
)
ap.add_argument(
    '--section-overlap',
    type=float,
    default=0.15,
    help='fraction of a section that the next one starts early, so sections bleed into each '
    'other instead of stopping dead. 0 draws them strictly one after another.',
)
ap.add_argument(
    '--no-snap',
    action='store_true',
    help='do not snap sections to whole lines. Only for inspecting what the raw per-stroke '
    'assignment does; leaving it on is what stops a line being split across two sections.',
)
ap.add_argument(
    '--dump-sections',
    action='store_true',
    help='print final section membership after snapping, for rendering a check image',
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
    # Outgoing direction at each end — the way the line is heading as it leaves the stroke.
    # Used to tell a continuation from a crossing: two fragments of the same line leave their
    # shared junction in opposite directions, a line crossing another does not.
    def away(a_, b_):
        dx, dy = a_[0] - b_[0], a_[1] - b_[1]
        m = math.hypot(dx, dy) or 1.0
        return (dx / m, dy / m)

    return {
        'start': pts[0],
        'end': pts[-1],
        'dir0': away(pts[0], pts[1] if len(pts) > 1 else pts[0]),
        'dir1': away(pts[-1], pts[-2] if len(pts) > 1 else pts[-1]),
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


def chain_order(items, anchor):
    """Order strokes so that lines which continue each other are drawn back to back.

    Greedy nearest-neighbour gets this wrong in a way that is very visible. It is myopic: at a
    junction where several strokes meet, it takes one and walks away, and the others sit
    unvisited until the walk happens back past them. On card-kennismaking that left 70 of 238
    end-to-end continuations split by more than 0.3s — half a curl of steam drawn at 0.1s and
    its other half at 1.2s, which is what "they just start halfway and later the other half
    starts" describes.

    This builds the tour by greedy *edge* instead. Every possible join between two stroke
    endpoints is sorted by length, and the shortest are committed first, subject to each
    endpoint being used once and no premature cycle — Kruskal's rule, applied to a path. The
    consequence that matters: two strokes that continue each other are separated by a gap of
    almost zero, so their join is near the very front of the sorted list and gets committed
    before anything else can claim either end. Continuations are consecutive by construction
    rather than by luck.

    Costs one sort of about 4 * n^2 / 2 candidate joins — 268k for the largest trace here,
    which is a fraction of a second and runs offline anyway.
    """
    n = len(items)
    if n < 2:
        return list(items)
    ends = [(s['start'], s['end']) for s in items]

    cand = []
    for i in range(n):
        for j in range(i + 1, n):
            for ei in (0, 1):
                for ej in (0, 1):
                    cand.append((math.dist(ends[i][ei], ends[j][ej]), i, ei, j, ej))
    cand.sort()

    par = list(range(n))

    def find(x):
        while par[x] != x:
            par[x] = par[par[x]]
            x = par[x]
        return x

    taken = [[False, False] for _ in range(n)]  # endpoint already carries a join
    adj = [[] for _ in range(n)]
    joins = 0
    for _, i, ei, j, ej in cand:
        if joins == n - 1:
            break
        if taken[i][ei] or taken[j][ej] or len(adj[i]) >= 2 or len(adj[j]) >= 2:
            continue
        if find(i) == find(j):
            continue
        taken[i][ei] = taken[j][ej] = True
        adj[i].append(j)
        adj[j].append(i)
        par[find(i)] = find(j)
        joins += 1

    # A path has exactly two ends; start from whichever free endpoint is nearest the anchor so
    # the drawing still begins where the subject grows from.
    terminals = [i for i in range(n) if len(adj[i]) < 2]
    if anchor is None:
        anchor = (min(e[0][0] for e in ends), max(e[0][1] for e in ends))

    def free_dist(i):
        free = [ends[i][k] for k in (0, 1) if not taken[i][k]] or [ends[i][0]]
        return min(math.dist(anchor, p) for p in free)

    start = min(terminals, key=free_dist) if terminals else 0
    walked, seen, prev, cur = [], set(), None, start
    while cur is not None and cur not in seen:
        walked.append(items[cur])
        seen.add(cur)
        nxt = next((k for k in adj[cur] if k != prev and k not in seen), None)
        prev, cur = cur, nxt
    # Any stroke the path could not absorb (only possible if joins ran out) is appended in
    # nearest-neighbour order rather than dropped.
    leftover = [s for k, s in enumerate(items) if k not in seen]
    if leftover:
        walked += order_by(leftover, 'nn', walked[-1]['end'] if walked else anchor)
    return walked


def order_by(items, how, anchor=None):
    """Sort a stroke list. `chain`/`nn` walk from `anchor`; the rest are plain sorts."""
    if how == 'chain':
        return chain_order(items, anchor)
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


def inside(s, box):
    x0, y0, x1, y1 = box
    bx0, by0, bx1, by1 = s['bbox']
    return x0 <= bx0 and y0 <= by0 and bx1 <= x1 and by1 <= y1


# Each region is its own group, kept separate and drawn in the order the flags were given.
# Pooling them was the bug behind "half of the smoke is generated and later the other half":
# with both steam curls in one bucket sorted bottom-to-top, their strokes interleave by height,
# so the right curl drew its base, waited while the left curl caught up, drew its middle, waited
# again, and finished 0.14s before the end — three visibly disconnected instalments. One curl at
# a time is the whole fix.
groups = []
for box in regions:
    g = [s for s in strokes if inside(s, box)]
    if not g:
        sys.exit(f'{a.src.name}: --last region {box} matched no strokes — check it against the viewBox')
    groups.append(g)
    strokes = [s for s in strokes if not inside(s, box)]

# ── Crossings ───────────────────────────────────────────────────────────────────────────────
def pair_ends(items, join=15.0, max_turn=55.0):
    """For each stroke end, the stroke that carries the same line onwards.

    The tracer cuts every line where another crosses it, so a cup rim arrives as several
    fragments with the crossing line's fragments mixed in among them. At a junction the two
    fragments continuing the same line leave in opposite directions; a line merely passing
    through leaves at an angle. Pairing ends by how straight the continuation is, straightest
    first and one link per end, recovers which fragment continues which line.

    Returns {(stroke index, end) -> (stroke index, end)}.
    """
    pos = [[s['start'] for s in items], [s['end'] for s in items]]
    dirs = [[s['dir0'] for s in items], [s['dir1'] for s in items]]
    cand = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            for ei in (0, 1):
                for ej in (0, 1):
                    if math.dist(pos[ei][i], pos[ej][j]) > join:
                        continue
                    di, dj = dirs[ei][i], dirs[ej][j]
                    dot = max(-1.0, min(1.0, di[0] * dj[0] + di[1] * dj[1]))
                    turn = 180.0 - math.degrees(math.acos(dot))
                    if turn <= max_turn:
                        cand.append((turn, i, ei, j, ej))
    cand.sort()
    link = {}
    for _, i, ei, j, ej in cand:
        if (i, ei) in link or (j, ej) in link:
            continue
        link[(i, ei)] = (j, ej)
        link[(j, ej)] = (i, ei)
    return link


# ── Sections ────────────────────────────────────────────────────────────────────────────────
# --section is the explicit alternative to inferring structure from geometry. --order and --last
# work from proximity, and proximity does not know that two overlapping ellipses are two cups, or
# that a curl crossing a rim is still one curl. Naming the strokes says so outright.
sections = []
if a.section:
    if a.last:
        sys.exit('--section and --last do the same job by different means; use one or the other')
    by_index = {s['i']: s for s in strokes}
    claimed = {}
    for spec in a.section:
        name, _, body = spec.partition(':')
        if not body:
            sys.exit(f'--section expects NAME:INDICES — got {spec!r}')
        idx = []
        for part in body.split(','):
            part = part.strip()
            if not part:
                continue
            if '-' in part.lstrip('-'):
                lo, hi = part.split('-')
                idx.extend(range(int(lo), int(hi) + 1))
            else:
                idx.append(int(part))
        group = []
        for k in idx:
            if k not in by_index:
                sys.exit(f'--section {name!r}: stroke {k} does not exist (0..{len(strokes) - 1})')
            if k in claimed:
                sys.exit(f'--section {name!r}: stroke {k} already claimed by {claimed[k]!r}')
            claimed[k] = name
            group.append(by_index[k])
        sections.append((name, group))
    # A stroke is a fragment, not a line: the tracer cut every line where another crosses it.
    # Assigning fragments to sections by hand therefore leaves *bridge* fragments — the short
    # pieces of a line that sit inside a crossing — in whichever section the crossing line went
    # to. The line they belong to then draws with a hole in it, filled in later by an unrelated
    # section. That is the broken-lines problem.
    #
    # The rule is deliberately narrow: if BOTH of a fragment's collinear continuations are in the
    # same section, the fragment belongs there too. Nothing else moves. Merging whole connected
    # lines instead was tried and is far too coarse — a cup's rim really does continue into its
    # body, so it swallows the entire cup into one section and the sections stop meaning
    # anything. A rim-to-body corner has rim on one side and body on the other, so this rule
    # leaves it exactly where it was put.
    if not a.no_snap:
        link = pair_ends(strokes)
        moved = 0
        for _ in range(4):  # a bridge can sit next to a bridge; settle before giving up
            changed = 0
            for st in strokes:
                k = st['i']
                nb = [link.get((k, e)) for e in (0, 1)]
                if any(x is None for x in nb):
                    continue
                secs_ = {claimed.get(strokes[j]['i']) for j, _ in nb}
                if len(secs_) == 1:
                    only = secs_.pop()
                    if only is not None and claimed.get(k) != only:
                        claimed[k] = only
                        changed += 1
            moved += changed
            if not changed:
                break
        if moved:
            print(f'  moved {moved} bridge fragment(s) into the line they continue')
        sections = [(nm, [by_index[k] for k in sorted(by_index) if claimed.get(k) == nm])
                    for nm, _ in sections]
        if a.dump_sections:
            for nm, g in sections:
                print(f'  SECTION {nm}: {",".join(str(x["i"]) for x in g)}')

    missed = sorted(set(by_index) - set(claimed))
    if missed:
        sys.exit(
            f'{a.src.name}: {len(missed)} strokes are in no section: {missed}\n'
            'Every stroke must be placed — a silent leftover would draw at an arbitrary time.'
        )

# ── Order ───────────────────────────────────────────────────────────────────────────────────
anchor = tuple(float(v) for v in a.anchor.split(',')) if a.anchor else None
if sections:
    # Ordered within a section only. Across sections the order is the one given on the command
    # line, which is the whole point of naming them.
    pen = anchor
    sections = [(nm, order_by(g, a.order, pen)) for nm, g in sections]
    for _, g in sections:
        pen = g[-1]['end']
    strokes = [s for _, g in sections for s in g]
else:
    strokes = order_by(strokes, a.order, anchor)
# Each deferred group is walked among itself and appended. The pen finishing the previous group
# is where the next starts from, so groups still join on rather than teleporting.
for g in groups:
    strokes += order_by(g, a.last_order, strokes[-1]['end'] if strokes else anchor)

# ── Pacing ──────────────────────────────────────────────────────────────────────────────────
def pace_wave(items, total, concurrency, spread, min_d):
    """Hero-style pacing: long per-stroke durations packed into a tight stagger.

    What makes the hero read as fast is not a shorter timeline — it is 2.86s for 372 strokes,
    about the same as everything else here. It is that ~84 strokes are drawing at any instant
    instead of ~10. Progress is visible everywhere at once, so the image resolves before the
    viewer starts waiting for it.

    Concurrency is also the frame cost, which caps how much of that character masked art can
    borrow. Every stroke mid-draw is geometry to re-rasterise each frame, and for strokes inside
    a <mask> that means re-rasterising the whole mask. What concurrency does NOT change is how
    fast the image resolves: new ink arrives at n/total either way. So the ceiling costs some
    texture, never speed.
    """
    n = max(len(items) - 1, 1)
    # Duration tracks length, or long lines whoosh past while specks crawl — but through a sqrt
    # and a clamp, not proportionally: real lengths span 447x here, and honouring that ratio at
    # this concurrency would give the longest stroke ~10s. The hero's own durations span ~3x.
    p90 = sorted(x['len'] for x in items)[int(len(items) * 0.9)] or 1.0
    scales = [min(max(0.45 + 0.9 * math.sqrt(s['len'] / p90), 0.4), 1.6) for s in items]

    def at(sp):
        # The nominal duration is whatever the LAST stroke has left once the stagger has run, so
        # the stagger and the duration cannot drift apart.
        base = total * (1 - sp)
        t = [[(k / n) * total * sp, max(base * sc, min_d)] for k, sc in enumerate(scales)]
        end = max(x + d for x, d in t) or 1.0
        f = total / end
        t = [[x * f, d * f] for x, d in t]
        return t, sum(d for _, d in t) / total

    if concurrency is None:
        return at(spread)
    # Concurrency falls monotonically as spread rises, so bisect. A closed form would have to
    # invert both the duration floor and the rescale; this converges in 40 steps regardless.
    lo, hi = 0.0, 0.999
    for _ in range(40):
        mid = (lo + hi) / 2
        if at(mid)[1] > concurrency:
            lo = mid
        else:
            hi = mid
    return at(hi)


total_ink = sum(s['len'] for s in strokes) or 1.0

if sections:
    # Each section is paced on its own little timeline, then slid into place.
    #
    # Section length follows the SQUARE ROOT of its ink, not its ink. Straight proportionality
    # is what a pen would do and it starves thin detail: on the teacups the two steam curls are
    # 22 of 80 strokes but a twentieth of the ink, so they got 0.27s of a 2s draw between them —
    # 4 strokes in 0.06s for the far one, a flash rather than a section. The sqrt keeps the big
    # sections longer without letting the small ones vanish. Equal shares would be the other
    # extreme: the cup body carries most of the drawing and should visibly take most of the time.
    weights = [math.sqrt(sum(x['len'] for x in g)) or 1.0 for _, g in sections]
    lengths = [w / sum(weights) for w in weights]
    starts, cursor = [], 0.0
    for L in lengths:
        starts.append(cursor)
        cursor += L * (1 - a.section_overlap)
    span = cursor + lengths[-1] * a.section_overlap
    scale = a.total / span
    ordered, times = [], []
    for (name, g), st, L in zip(sections, starts, lengths):
        t, _ = pace_wave(g, L * scale, a.concurrency, a.spread, a.min_d)
        for s_, (d0, dur) in zip(g, t):
            ordered.append(s_)
            times.append([st * scale + d0, dur])
    strokes = ordered
    new_times = {id(s['match']): tuple(t) for s, t in zip(strokes, times)}
    concurrent = sum(d for _, d in times) / a.total
    floored = sum(1 for _, d in times if d <= a.min_d * 1.001)
elif a.pace == 'wave':
    times, concurrent = pace_wave(strokes, a.total, a.concurrency, a.spread, a.min_d)
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
