"""Centerline-trace a line-art PNG into an SVG.

Same pipeline proven on the hero:
  alpha -> skeletonize -> walk skeleton graph -> RDP -> extend free tips -> per-path width

Per-path stroke-width comes from the distance transform (2 x radius, x K). A single
width flattens the artwork's weight hierarchy and reads bolder than the original.

Usage:
  python linetrace.py <in.png> <out.svg> --color "#FFFBF5" [--animate] [--order y|len]
"""
import argparse
import json
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt
from skimage.morphology import skeletonize, remove_small_objects

K = 0.55                # starting guess; re-calibrated per image below
EPS = 0.9               # RDP tolerance
MIN_LEN = 4             # skeleton run shorter than this is a speck
sys.setrecursionlimit(20000)

ap = argparse.ArgumentParser()
ap.add_argument('src')
ap.add_argument('out')
ap.add_argument('--color', default='#FFFBF5')
ap.add_argument('--animate', action='store_true')
ap.add_argument('--order', default='y', choices=['y', 'len'])
ap.add_argument('--duration', type=float, default=2.2)
ap.add_argument('--klass', default='')
ap.add_argument('--slice', action='store_true',
                help='preserveAspectRatio=slice: the SVG equivalent of object-fit:cover')
a = ap.parse_args()

alpha = np.array(Image.open(a.src).convert('RGBA'))[..., 3]
ink = remove_small_objects(alpha > 80, min_size=6)
H, W = ink.shape
skel = skeletonize(ink)

# Stroke-width clamp must scale with the artwork. A fixed 4.0px cap (tuned on the
# 2015px hero) hard-clipped the heart's fat brush stroke in a 235px canvas, which is
# why the icons came out thin. Bounds are relative to the image's short side.
SW_MIN = max(0.8, min(W, H) * 0.004)
SW_MAX = max(4.0, min(W, H) * 0.06)

pad = np.pad(skel, 1)
neigh = np.zeros_like(skel, dtype=np.uint8)
for dy in (-1, 0, 1):
    for dx in (-1, 0, 1):
        if dy or dx:
            neigh += pad[1 + dy:1 + dy + H, 1 + dx:1 + dx + W].astype(np.uint8)
neigh *= skel

OFFS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
skel_set = set(map(tuple, np.argwhere(skel)))
nodes = {p for p in skel_set if neigh[p] != 2}


def nbrs(p):
    y, x = p
    return [(y + dy, x + dx) for dy, dx in OFFS if (y + dy, x + dx) in skel_set]


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
for p in sorted(skel_set):                       # closed loops have no nodes
    for n in nbrs(p):
        if frozenset((p, n)) not in visited:
            polys.append(walk(p, n))


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


def in_ink(x, y):
    xi, yi = int(round(x)), int(round(y))
    return 0 <= xi < W and 0 <= yi < H and ink[yi, xi]


def extend_tip(pts, i_tip, i_in):
    """skeletonize() erodes open ends inward; push them back out to the ink boundary."""
    (tx, ty), (bx, by) = pts[i_tip], pts[i_in]
    dx, dy = tx - bx, ty - by
    n = np.hypot(dx, dy)
    if n == 0:
        return pts[i_tip]
    dx, dy = dx / n, dy / n
    t, last = 0.0, 0.0
    while t < 20:
        t += 0.25
        if in_ink(tx + dx * t, ty + dy * t):
            last = t
        else:
            break
    return (tx + dx * last, ty + dy * last)


edt = distance_transform_edt(ink)
paths = []
for p in polys:
    if len(p) < MIN_LEN:
        continue
    pts = [(float(x), float(y)) for y, x in rdp(p, EPS)]
    if len(pts) < 2:
        continue
    if neigh[p[0]] == 1:
        pts[0] = extend_tip(pts, 0, 1)
    if neigh[p[-1]] == 1:
        pts[-1] = extend_tip(pts, -1, -2)
    r = [edt[int(round(y)), int(round(x))] for x, y in pts
         if 0 <= int(round(x)) < W and 0 <= int(round(y)) < H
         and edt[int(round(y)), int(round(x))] > 0]
    arr = np.array(pts)
    paths.append({
        'pts': pts,
        'raw_sw': float(np.median(r)) * 2 if r else 3.6,   # true width; K applied after
        'len': float(np.hypot(*np.diff(arr, axis=0).T).sum()),
        'cy': float(arr[:, 1].mean()),
    })

# --- calibrate K against THIS image ---------------------------------------------------
# The mask's distance transform overestimates true ink width (it counts antialiased edge
# pixels), by an amount that depends on how the art was drawn. A K tuned on one image is
# wrong on another: 0.55 (from the hero) rendered these icons visibly thinner than their
# PNGs. So sweep K per image and keep whichever minimises RMSE against the source.
from PIL import ImageDraw as _ID

_src = Image.open(a.src).convert('RGBA')
_bg = (61, 74, 53) if a.color.lower() == '#fffbf5' else (250, 240, 230)   # card vs page
_base = Image.new('RGBA', _src.size, _bg + (255,))
_base.alpha_composite(_src)
_ref = np.array(_base.convert('L'), dtype=float)
_ink = tuple(int(a.color[i:i + 2], 16) for i in (1, 3, 5))
_inkL = float(np.array(Image.new('RGB', (1, 1), _ink).convert('L'))[0, 0])
_bgL = float(np.array(Image.new('RGB', (1, 1), _bg).convert('L'))[0, 0])

_best = (K, 1e9)
for _k in [0.40, 0.50, 0.55, 0.60, 0.70, 0.80, 0.90, 1.00, 1.10, 1.25]:
    _im = Image.new('L', (W, H), round(_bgL))
    _dr = _ID.Draw(_im)
    for p in paths:
        w = min(max(p['raw_sw'] * _k, SW_MIN), SW_MAX)
        _dr.line(p['pts'], fill=round(_inkL), width=max(1, round(w)), joint='curve')
    _rmse = float(np.sqrt(((np.array(_im, dtype=float) - _ref) ** 2).mean()))
    if _rmse < _best[1]:
        _best = (_k, _rmse)
K = _best[0]
print(f'  calibrated K={K:.2f} (RMSE {_best[1]:.2f})', file=sys.stderr)

for p in paths:
    p['sw'] = round(min(max(p['raw_sw'] * K, SW_MIN), SW_MAX), 2)

if a.order == 'y':
    paths.sort(key=lambda p: p['cy'])            # top to bottom
else:
    paths.sort(key=lambda p: -p['len'])          # main lines first, detail after

med = sorted(p['len'] for p in paths)[len(paths) // 2] if paths else 1


def d_attr(pts):
    out = [f'M{round(pts[0][0])} {round(pts[0][1])}']
    out += [f'L{round(x)} {round(y)}' for x, y in pts[1:]]
    return ''.join(out)


cls = f' {a.klass}' if a.klass else ''
par = ' preserveAspectRatio="xMidYMid slice"' if a.slice else ''
head = (f'<svg class="lt{cls}" width="{W}" height="{H}" viewBox="0 0 {W} {H}"{par} fill="none" '
        f'stroke="{a.color}" stroke-linecap="round" stroke-linejoin="round" '
        f'xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">')
lines = [head]

n = max(len(paths) - 1, 1)
STAGGER = a.duration * 0.55          # spread of start times
BASE = a.duration * 0.45             # nominal per-stroke draw time
for i, p in enumerate(paths):
    if a.animate:
        t = STAGGER * (i / n)
        dur = BASE * min(max((p['len'] / med) ** 0.5, 0.65), 1.6)
        lines.append(f'\t<path pathLength="1" stroke-width="{p["sw"]}" '
                     f'style="--t:{t:.2f}s;--d:{dur:.2f}s" d="{d_attr(p["pts"])}"/>')
    else:
        lines.append(f'\t<path stroke-width="{p["sw"]}" d="{d_attr(p["pts"])}"/>')
lines.append('</svg>')

svg = '\n'.join(lines)
open(a.out, 'w').write(svg)

import gzip, os
raw = os.path.getsize(a.src)
print(f'{os.path.basename(a.src):<26} {len(paths):>4} paths  '
      f'{raw/1024:>7.0f} KB -> {len(svg)/1024:>5.1f} KB svg '
      f'({len(gzip.compress(svg.encode(),9))/1024:.1f} KB gz)')
