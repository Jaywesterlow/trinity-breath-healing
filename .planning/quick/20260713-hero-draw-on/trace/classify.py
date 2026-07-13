"""Assign each traced polyline to a draw layer, then render it in colour to verify.

Ridges vs tree canopy overlap geometrically, so a bbox test alone misfires.
Instead: label the ink's connected components, and identify ridge components by
shape + density — a ridge is a long, wide, shallow, SPARSE sweep, whereas the
canopy is dense (many short strokes packed into its bbox).
"""
import json
import numpy as np
from PIL import Image, ImageDraw
from skimage.morphology import remove_small_objects
from skimage.measure import label

SRC = r'C:\Users\jaywe\OneDrive\Desktop\AI\Coding projects\Claude Coding\trinity-breath-healing-rework\src\lib\images\hero-illustration.png'

d = json.load(open('paths.json'))
W, H = d['w'], d['h']

ink = np.array(Image.open(SRC))[..., 3] > 100
ink = remove_small_objects(ink, min_size=12)
lab = label(ink, connectivity=2)

# --- component stats ---
comps = {}
for i in range(1, lab.max() + 1):
    ys, xs = np.nonzero(lab == i)
    w, h = int(xs.max() - xs.min()), int(ys.max() - ys.min())
    comps[i] = dict(px=len(ys), x0=int(xs.min()), x1=int(xs.max()),
                    y0=int(ys.min()), y1=int(ys.max()), w=w, h=h,
                    dens=len(ys) / max(w + h, 1))

# A ridge component: wide, shallow, up in the sky band, and sparse.
ridge_ids = {i for i, c in comps.items()
             if c['w'] > 300 and c['h'] < 260
             and c['y0'] >= 280 and c['y1'] <= 700
             and c['dens'] < 5.5}
print('ridge components:', sorted(ridge_ids))
for i in sorted(ridge_ids):
    c = comps[i]
    print(f"   #{i}: {c['px']}px  x{c['x0']}-{c['x1']} y{c['y0']}-{c['y1']} dens={c['dens']:.1f}")


def comp_of(p):
    """Component id under this polyline (majority vote over its vertices)."""
    votes = {}
    for x, y in p['pts']:
        xi, yi = int(round(x)), int(round(y))
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                yy, xx = yi + dy, xi + dx
                if 0 <= yy < H and 0 <= xx < W and lab[yy, xx]:
                    votes[lab[yy, xx]] = votes.get(lab[yy, xx], 0) + 1
    return max(votes, key=votes.get) if votes else 0


def layer(p):
    cx, cy = p['cx'], p['cy']
    if p['comp'] in ridge_ids:
        return 'ridges'
    if cy > 1235:
        return 'waterfall'
    # trunk, roots and grass tufts sit below the canopy but belong to the tree
    if 640 < cy <= 950 and 950 <= cx <= 1680:
        return 'tree'
    if cy > 640:
        return 'river'
    return 'tree'


for p in d['paths']:
    p['comp'] = int(comp_of(p))
    p['layer'] = layer(p)

COL = {'ridges': (150, 150, 160), 'tree': (200, 60, 60),
       'river': (60, 120, 200), 'waterfall': (30, 170, 130)}

im = Image.new('RGB', (W, H), 'white')
dr = ImageDraw.Draw(im)
for p in d['paths']:
    pts = [tuple(q) for q in p['pts']]
    if len(pts) > 1:
        dr.line(pts, fill=COL[p['layer']], width=4)
im.resize((W // 2, H // 2), Image.LANCZOS).save('layer_check.png')

json.dump(d, open('paths.json', 'w'))

from collections import Counter
c, ln = Counter(), Counter()
for p in d['paths']:
    c[p['layer']] += 1
    ln[p['layer']] += p['len']
print()
for k in ('ridges', 'tree', 'river', 'waterfall'):
    print(f'{k:>10}: {c[k]:>3} paths  {ln[k]:>8.0f}px')
