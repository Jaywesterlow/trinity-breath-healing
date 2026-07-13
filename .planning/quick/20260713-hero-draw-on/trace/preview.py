"""Simulate the CSS stroke-dashoffset animation offline and render a filmstrip.

Reads the delays/durations straight out of the emitted SVG, so what we see here
is what the browser will do — not an approximation of a different pipeline.
"""
import re
import numpy as np
from PIL import Image, ImageDraw

svg = open('hero-illustration.svg').read()
W = int(re.search(r'width="(\d+)"', svg).group(1))
H = int(re.search(r'height="(\d+)"', svg).group(1))

items = []
for m in re.finditer(r'--t:([\d.]+)s;--d:([\d.]+)s" d="([^"]+)"', svg):
    t, d, path = float(m.group(1)), float(m.group(2)), m.group(3)
    pts = [tuple(map(float, p.split())) for p in
           re.findall(r'[ML]([-\d]+ [-\d]+)', path)]
    items.append((t, d, pts))
print(f'{len(items)} paths parsed from SVG')


def ease_out(x):                       # CSS ease-out ~= cubic-bezier(0,0,.58,1)
    return 1 - (1 - x) ** 2.2


def partial(pts, frac):
    """First `frac` of the polyline, by arc length — exactly what dashoffset does."""
    if frac <= 0:
        return []
    a = np.array(pts, float)
    seg = np.hypot(*np.diff(a, axis=0).T)
    total = seg.sum()
    if total == 0:
        return []
    want = total * min(frac, 1.0)
    out, run = [tuple(a[0])], 0.0
    for i, s in enumerate(seg):
        if run + s >= want:
            r = (want - run) / s if s else 0
            p = a[i] + (a[i + 1] - a[i]) * r
            out.append(tuple(p))
            break
        run += s
        out.append(tuple(a[i + 1]))
    return out


TIMES = [0.3, 0.8, 1.3, 1.8, 2.2, 2.9]
frames = []
for t in TIMES:
    im = Image.new('RGB', (W, H), (250, 240, 230))     # --color-bg-sand
    dr = ImageDraw.Draw(im)
    drawn = 0
    for delay, dur, pts in items:
        f = (t - delay) / dur
        if f <= 0:
            continue
        seg = partial(pts, ease_out(min(f, 1.0)))
        if len(seg) > 1:
            dr.line(seg, fill=(33, 31, 29), width=4)
            drawn += 1
    dr.text((20, 20), f't={t}s  ({drawn}/{len(items)})', fill=(150, 60, 60))
    frames.append(im.resize((W // 3, H // 3), Image.LANCZOS))
    print(f'  t={t}s: {drawn}/{len(items)} paths started')

fw, fh = frames[0].size
strip = Image.new('RGB', (fw * 3, fh * 2), 'white')
for i, f in enumerate(frames):
    strip.paste(f, ((i % 3) * fw, (i // 3) * fh))
strip.save('filmstrip.png')
print('wrote filmstrip.png')
