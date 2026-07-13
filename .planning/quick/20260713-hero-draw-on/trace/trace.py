"""Centerline-trace the hero line art into ordered SVG polylines.

binarize(alpha) -> skeletonize -> walk skeleton graph -> RDP simplify -> paths
"""
import numpy as np
from PIL import Image
from skimage.morphology import skeletonize, remove_small_objects
from scipy.ndimage import distance_transform_edt
import json, sys

# The artwork's strokes are NOT uniform — measured 2.0px (distant ridges) to 7.2px
# (trunk, main branches). A single stroke-width flattens that hierarchy and the drawing
# reads bolder and cruder than the original. Each path therefore carries its own width,
# taken from the distance transform (2 x radius) at its own pixels.
# K calibrates the mask's inflated radii to the real ink: swept against the source PNG,
# K=0.55 minimises RMSE (11.32, vs 12.62 for a uniform 2.1 and 18.76 for the 3.4 we shipped).
K = 0.55
SW_MIN, SW_MAX = 1.1, 4.0

SRC = r'C:\Users\jaywe\OneDrive\Desktop\AI\Coding projects\Claude Coding\trinity-breath-healing-rework\src\lib\images\hero-illustration.png'

im = Image.open(SRC)
alpha = np.array(im)[..., 3]
ink = alpha > 80                      # was 100 — a touch more inclusive of faint strokes
ink = remove_small_objects(ink, min_size=6)   # was 12 — keep the small marks
H, W = ink.shape

skel = skeletonize(ink)
print(f'skeleton px: {skel.sum()}', file=sys.stderr)

# --- build neighbour counts ---
pad = np.pad(skel, 1)
neigh = np.zeros_like(skel, dtype=np.uint8)
for dy in (-1, 0, 1):
    for dx in (-1, 0, 1):
        if dy == 0 and dx == 0:
            continue
        neigh += pad[1 + dy: 1 + dy + H, 1 + dx: 1 + dx + W].astype(np.uint8)
neigh = neigh * skel

OFFS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
skel_set = set(map(tuple, np.argwhere(skel)))          # (y, x)
nodes = {p for p in skel_set if neigh[p] != 2}          # endpoints + junctions


def nbrs(p):
    y, x = p
    return [(y + dy, x + dx) for dy, dx in OFFS if (y + dy, x + dx) in skel_set]


# --- walk skeleton into polylines ---
visited = set()   # visited undirected edges
polys = []


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

# closed loops (no nodes on them) — pick any unvisited pixel and walk around
for p in sorted(skel_set):
    for n in nbrs(p):
        if frozenset((p, n)) not in visited:
            polys.append(walk(p, n))

print(f'raw polylines: {len(polys)}', file=sys.stderr)


# --- Ramer-Douglas-Peucker ---
def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    a = np.array(pts, dtype=float)
    start, end = a[0], a[-1]
    d = end - start
    L = np.hypot(*d)
    if L == 0:
        dist = np.hypot(*(a - start).T)
    else:
        dist = np.abs(np.cross(d, start - a)) / L
    i = int(dist.argmax())
    if dist[i] > eps:
        left = rdp(pts[:i + 1], eps)
        right = rdp(pts[i:], eps)
        return left[:-1] + right
    return [pts[0], pts[-1]]


sys.setrecursionlimit(20000)
EPS = 0.9
MIN_LEN = 4          # was 8 — 8 discarded real twigs/grass, not just specks


def in_ink(x, y):
    xi, yi = int(round(x)), int(round(y))
    return 0 <= xi < W and 0 <= yi < H and ink[yi, xi]


def extend_tip(pts, i_tip, i_in):
    """Push a free stroke end back out to the edge of the ink.

    skeletonize() erodes each open end inward by roughly the stroke radius, and much
    further on a tapered end (measured: mean 3.5px, 9px+ at the 90th percentile) — so
    every twig and blade of grass came out visibly short. Only TRUE tips (degree-1 in
    the skeleton) are extended; junction ends must stay put.
    """
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


clean = []
_ext = []
for p in polys:
    if len(p) < MIN_LEN:
        continue
    simp = rdp(p, EPS)
    pts = [(float(x), float(y)) for y, x in simp]   # (y,x) -> (x,y)
    if len(pts) >= 2:
        # p[0]/p[-1] are (y,x) skeleton pixels; degree 1 == a free end, not a junction
        if neigh[p[0]] == 1:
            new = extend_tip(pts, 0, 1)
            _ext.append(np.hypot(new[0] - pts[0][0], new[1] - pts[0][1]))
            pts[0] = new
        if neigh[p[-1]] == 1:
            new = extend_tip(pts, -1, -2)
            _ext.append(np.hypot(new[0] - pts[-1][0], new[1] - pts[-1][1]))
            pts[-1] = new
    clean.append(pts)

_e = np.array(_ext)
print(f'free tips extended: {len(_e)}  mean +{_e.mean():.2f}px  max +{_e.max():.2f}px  '
      f'(reclaimed {_e.sum():.0f}px of stroke)', file=sys.stderr)

print(f'kept polylines: {len(clean)}', file=sys.stderr)


def plen(pts):
    a = np.array(pts)
    return float(np.hypot(*np.diff(a, axis=0).T).sum())


edt = distance_transform_edt(ink)          # stroke radius at every ink pixel

out = []
for pts in clean:
    a = np.array(pts)
    r = [edt[int(round(y)), int(round(x))]
         for x, y in pts
         if 0 <= int(round(x)) < W and 0 <= int(round(y)) < H
         and edt[int(round(y)), int(round(x))] > 0]
    sw = float(np.median(r)) * 2 * K if r else 2.1
    out.append({
        'pts': [[round(x, 1), round(y, 1)] for x, y in pts],
        'sw': round(min(max(sw, SW_MIN), SW_MAX), 2),
        'len': round(plen(pts), 1),
        'cx': round(float(a[:, 0].mean()), 1),
        'cy': round(float(a[:, 1].mean()), 1),
        'x0': float(a[:, 0].min()), 'x1': float(a[:, 0].max()),
        'y0': float(a[:, 1].min()), 'y1': float(a[:, 1].max()),
    })

_sw = np.array([p['sw'] for p in out])
print(f'stroke widths: min {_sw.min():.2f}  median {np.median(_sw):.2f}  max {_sw.max():.2f}',
      file=sys.stderr)

json.dump({'w': W, 'h': H, 'paths': out}, open('paths.json', 'w'))
tot = sum(p['len'] for p in out)
print(f'total ink length: {tot:.0f}px  | paths: {len(out)}', file=sys.stderr)
