"""Vectorise line art exactly, and (optionally) let it draw itself on.

Why not just stroke the centerline (the old approach):
    The artwork is drawn with TAPERED brush strokes — thick in the middle, narrowing to a
    point. A centerline stroke has one width per path, so tapered strokes came out chunky,
    blobby and visibly broken. No amount of smoothing fixes that; the width is the problem.

What this does instead:
    fill  = the ink's actual boundary (marching squares on alpha), as a filled path with
            fill-rule="evenodd". Reproduces the artwork exactly, taper and all.
    mask  = the centerline skeleton, stroked wide enough to cover the fill, animated with
            stroke-dashoffset. As the mask strokes "draw", they reveal the exact artwork.

    So the drawn result is pixel-faithful, and the animation is still a real pen stroke.

    Fail-safe is preserved: with no dash-array applied (no JS / reduced motion), the mask
    strokes are solid, the mask is fully open, and the finished artwork simply shows.

Usage:
  python drawtrace.py in.png out.svg --color "#FFFBF5" [--animate] [--order y|len]
"""
import argparse
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt
from skimage import measure
from skimage.morphology import skeletonize, remove_small_objects

ap = argparse.ArgumentParser()
ap.add_argument('src')
ap.add_argument('out')
ap.add_argument('--color', default='#FFFBF5')
ap.add_argument('--animate', action='store_true')
ap.add_argument('--order', default='y', choices=['y', 'len'])
ap.add_argument('--duration', type=float, default=2.2)
ap.add_argument('--klass', default='')
ap.add_argument('--slice', action='store_true')
ap.add_argument('--layers', action='store_true', help='hero-only: ridges/tree/river/waterfall')
a = ap.parse_args()
sys.setrecursionlimit(50000)

img = Image.open(a.src).convert('RGBA')
if min(img.size) < 700:                       # small sources trace to stair-stepped paths
    s = int(np.ceil(700 / min(img.size)))
    img = img.resize((img.width * s, img.height * s), Image.LANCZOS)
    print(f'  supersampled x{s} -> {img.width}x{img.height}', file=sys.stderr)

W, H = img.size
alpha = np.array(img)[..., 3].astype(float) / 255.0
ink = remove_small_objects(alpha > 0.4, min_size=6)


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    arr = np.array(pts, float)
    s, e = arr[0], arr[-1]
    d = e - s
    L = np.hypot(*d)
    dist = np.hypot(*(arr - s).T) if L == 0 else np.abs(np.cross(d, s - arr)) / L
    i = int(dist.argmax())
    if dist[i] > eps:
        return rdp(pts[:i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]


def bez(pts, close=False):
    """Catmull-Rom -> cubic bezier. Straight L-segments visibly facet these curves."""
    if len(pts) < 3:
        return 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)
    n = len(pts)
    out = [f'M{pts[0][0]:.1f} {pts[0][1]:.1f}']
    last = n if close else n - 1
    for i in range(last):
        p0 = pts[(i - 1) % n] if close else (pts[i - 1] if i > 0 else pts[i])
        p1 = pts[i % n]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if close else (pts[i + 2] if i + 2 < n else p2)
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        out.append(f'C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}')
    if close:
        out.append('Z')
    return ''.join(out)


# ---------- 1. the exact artwork: outline contours -> one evenodd fill ----------
def poly_area(p):
    x = np.array([q[0] for q in p])
    y = np.array([q[1] for q in p])
    return 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))


# RDP tolerance must scale with the canvas. A fixed 0.45px kept thousands of points on the
# larger/supersampled sources (a 265 KB logo). Beziers interpolate smoothly through far fewer
# points, so the tolerance can be generous without visible faceting.
EPS_FILL = min(max(min(W, H) * 0.0025, 0.6), 4.0)
MIN_AREA = max(8.0, (min(W, H) * 0.004) ** 2)

fill_subpaths = []
for c in measure.find_contours(alpha, 0.5):
    pts = [(float(x), float(y)) for y, x in c]
    if len(pts) < 4 or poly_area(pts) < MIN_AREA:
        continue
    simp = rdp(pts, EPS_FILL)
    if len(simp) < 3:
        continue
    fill_subpaths.append(bez(simp, close=True))

# ---------- 2. the pen: centerline skeleton, for the reveal mask ----------
mask_paths = []
if a.animate:
    skel = skeletonize(ink)
    pad = np.pad(skel, 1)
    neigh = np.zeros_like(skel, dtype=np.uint8)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dy or dx:
                neigh += pad[1 + dy:1 + dy + H, 1 + dx:1 + dx + W].astype(np.uint8)
    neigh *= skel

    OFFS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
    sset = set(map(tuple, np.argwhere(skel)))
    nodes = {p for p in sset if neigh[p] != 2}

    def nbrs(p):
        y, x = p
        return [(y + dy, x + dx) for dy, dx in OFFS if (y + dy, x + dx) in sset]

    visited, polys = set(), []

    def walk(start, first):
        path = [start, first]
        visited.add(frozenset((start, first)))
        prev, cur = start, first
        while cur not in nodes:
            nxt = [n for n in nbrs(cur) if n != prev]
            if not nxt:
                break
            n = nxt[0]
            e = frozenset((cur, n))
            if e in visited:
                break
            visited.add(e)
            path.append(n)
            prev, cur = cur, n
        return path

    for node in sorted(nodes):
        for n in nbrs(node):
            if frozenset((node, n)) not in visited:
                polys.append(walk(node, n))
    for p in sorted(sset):
        for n in nbrs(p):
            if frozenset((p, n)) not in visited:
                polys.append(walk(p, n))

    edt = distance_transform_edt(ink)
    # The mask is never seen — it only has to cover the fill it reveals. So it gets cheap
    # polyline segments and a coarse tolerance; only the visible fill needs beziers.
    EPS_MASK = min(max(min(W, H) * 0.004, 1.0), 6.0)
    for p in polys:
        if len(p) < 3:
            continue
        pts = [(float(x), float(y)) for y, x in rdp(p, EPS_MASK)]
        if len(pts) < 2:
            continue
        r = [edt[int(round(y)), int(round(x))] for x, y in pts
             if 0 <= int(round(x)) < W and 0 <= int(round(y)) < H]
        # width = local ink diameter, plus margin so the fill's antialiased edge is not
        # left behind at the reveal boundary.
        w = (max(r) * 2 if r else 4) * 1.9 + 2
        arr = np.array(pts)
        mask_paths.append({
            'd': 'M' + 'L'.join(f'{x:.0f} {y:.0f}' for x, y in pts),
            'w': round(w, 1),
            'len': float(np.hypot(*np.diff(arr, axis=0).T).sum()),
            'cy': float(arr[:, 1].mean()),
            'cx': float(arr[:, 0].mean()),
        })

    mask_paths.sort(key=(lambda p: p['cy']) if a.order == 'y' else (lambda p: -p['len']))

# ---------- 3. emit ----------
cls = f' {a.klass}' if a.klass else ''
par = ' preserveAspectRatio="xMidYMid slice"' if a.slice else ''
uid = 'dm' + str(abs(hash(a.out)) % 100000)

out = [f'<svg class="lt{cls}" width="{W}" height="{H}" viewBox="0 0 {W} {H}"{par} '
       f'xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">']

if a.animate and mask_paths:
    med = sorted(p['len'] for p in mask_paths)[len(mask_paths) // 2]
    n = max(len(mask_paths) - 1, 1)
    STAG, BASE = a.duration * 0.55, a.duration * 0.45
    out.append(f'\t<defs><mask id="{uid}" maskUnits="userSpaceOnUse" '
               f'x="0" y="0" width="{W}" height="{H}">')
    out.append('\t\t<g class="lt-draw" fill="none" stroke="#fff" '
               'stroke-linecap="round" stroke-linejoin="round">')
    for i, p in enumerate(mask_paths):
        t = STAG * (i / n)
        dur = BASE * min(max((p['len'] / med) ** 0.5, 0.65), 1.6)
        out.append(f'\t\t\t<path pathLength="1" stroke-width="{p["w"]}" '
                   f'style="--t:{t:.2f}s;--d:{dur:.2f}s" d="{p["d"]}"/>')
    out.append('\t\t</g>\n\t</defs>')
    out.append(f'\t<path fill="{a.color}" fill-rule="evenodd" mask="url(#{uid})" '
               f'd="{"".join(fill_subpaths)}"/>')
else:
    out.append(f'\t<path fill="{a.color}" fill-rule="evenodd" d="{"".join(fill_subpaths)}"/>')

out.append('</svg>')
svg = '\n'.join(out)
open(a.out, 'w').write(svg)

import gzip, os
print(f'{os.path.basename(a.src):<26} fill {len(fill_subpaths):>3} contours, '
      f'mask {len(mask_paths):>3} strokes  {os.path.getsize(a.src)/1024:>7.0f} KB -> '
      f'{len(svg)/1024:>5.1f} KB ({len(gzip.compress(svg.encode(),9))/1024:.1f} KB gz)')
