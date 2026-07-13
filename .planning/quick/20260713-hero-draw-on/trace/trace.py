"""Centerline-trace the hero line art into ordered SVG polylines.

binarize(alpha) -> skeletonize -> walk skeleton graph -> RDP simplify -> paths
"""
import numpy as np
from PIL import Image
from skimage.morphology import skeletonize, remove_small_objects
import json, sys

SRC = r'C:\Users\jaywe\OneDrive\Desktop\AI\Coding projects\Claude Coding\trinity-breath-healing-rework\src\lib\images\hero-illustration.png'

im = Image.open(SRC)
alpha = np.array(im)[..., 3]
ink = alpha > 100
ink = remove_small_objects(ink, min_size=12)
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
MIN_LEN = 8          # drop specks shorter than this (px of skeleton run)

clean = []
for p in polys:
    if len(p) < MIN_LEN:
        continue
    simp = rdp(p, EPS)
    # (y,x) -> (x,y)
    clean.append([(float(x), float(y)) for y, x in simp])

print(f'kept polylines: {len(clean)}', file=sys.stderr)


def plen(pts):
    a = np.array(pts)
    return float(np.hypot(*np.diff(a, axis=0).T).sum())


out = []
for pts in clean:
    a = np.array(pts)
    out.append({
        'pts': [[round(x, 1), round(y, 1)] for x, y in pts],
        'len': round(plen(pts), 1),
        'cx': round(float(a[:, 0].mean()), 1),
        'cy': round(float(a[:, 1].mean()), 1),
        'x0': float(a[:, 0].min()), 'x1': float(a[:, 0].max()),
        'y0': float(a[:, 1].min()), 'y1': float(a[:, 1].max()),
    })

json.dump({'w': W, 'h': H, 'paths': out}, open('paths.json', 'w'))
tot = sum(p['len'] for p in out)
print(f'total ink length: {tot:.0f}px  | paths: {len(out)}', file=sys.stderr)
