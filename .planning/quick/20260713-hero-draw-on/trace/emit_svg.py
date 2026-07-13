"""Emit the hero SVG: 4 draw layers, per-path delay (--t) and duration (--d).

pathLength="1" normalises every path so CSS can dash-offset 1 -> 0 uniformly,
regardless of the path's true length. Duration still scales with sqrt(length)
so long river sweeps don't whip past while short twigs crawl.
"""
import json

d = json.load(open('paths.json'))
W, H = d['w'], d['h']
paths = d['paths']

# (start, stagger window, base duration) per layer — total ~2.8s
TIMING = {
    'ridges':    (0.00, 0.28, 0.65),
    'tree':      (0.45, 0.85, 0.60),
    'river':     (1.35, 0.40, 0.60),
    'waterfall': (1.80, 0.28, 0.50),
}
# draw order within each layer
SORT = {
    'ridges':    lambda p: p['cx'],       # left to right
    'tree':      lambda p: -p['cy'],      # bottom up — the tree grows
    'river':     lambda p: p['cy'],       # downstream
    'waterfall': lambda p: p['cy'],       # top down — it falls
}

groups = {k: sorted([p for p in paths if p['layer'] == k], key=SORT[k])
          for k in TIMING}

med = sorted(p['len'] for p in paths)[len(paths) // 2]


def fmt(pts):
    out = [f"M{round(pts[0][0])} {round(pts[0][1])}"]
    for x, y in pts[1:]:
        out.append(f"L{round(x)} {round(y)}")
    return ''.join(out)


lines = [
    f'<svg class="hero__img hero__draw" width="{W}" height="{H}" '
    f'viewBox="0 0 {W} {H}" fill="none" stroke="currentColor" stroke-width="3.4" '
    f'stroke-linecap="round" stroke-linejoin="round" '
    f'xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
]

for layer, (start, window, base) in TIMING.items():
    g = groups[layer]
    lines.append(f'\t<g class="hd-{layer}">')
    n = max(len(g) - 1, 1)
    for i, p in enumerate(g):
        t = start + window * (i / n)
        # sqrt-scaled duration, clamped — keeps long and short strokes both readable
        scale = min(max((p['len'] / med) ** 0.5, 0.65), 1.6)
        dur = base * scale
        lines.append(
            f'\t\t<path pathLength="1" style="--t:{t:.2f}s;--d:{dur:.2f}s" '
            f'd="{fmt(p["pts"])}"/>'
        )
    lines.append('\t</g>')

lines.append('</svg>')
svg = '\n'.join(lines)
open('hero-illustration.svg', 'w').write(svg)

end = max(s + w + b * 1.6 for s, w, b in TIMING.values())
print(f'paths: {len(paths)}  bytes: {len(svg):,}  animation ends ~{end:.2f}s')
for k, g in groups.items():
    print(f'  {k:>10}: {len(g):>3} paths')
