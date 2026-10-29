// Centreline trace of the line mask, in Node (the Python pipeline in
// .planning/quick/20260713-hero-draw-on/trace/ does the same: threshold -> skeletonize ->
// walk the skeleton graph -> RDP). Output: strokes for a draw-on MASK, each starting at the
// end nearest the origin (the tree's base) so the drawing grows out from there.
// node trace.cjs <mask.png> <coordW> <coordH> <originX> <originY> <out.json>
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const [MASK, CW, CH, OX, OY, OUT, SCALE = 1] = process.argv.slice(2).map((v, i) => (i >= 1 && i <= 4 || i === 6 ? +v : v)); // SCALE: trace finer, emit coords × SCALE
const MIN_LEN = 6, EPS = 1;
(async () => {
  const { data, info } = await sharp(MASK).resize(CW, CH).threshold(110).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const g = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) g[p] = data[p * C] > 0 ? 1 : 0;
  for (let x = 0; x < W; x++) g[x] = g[(H - 1) * W + x] = 0;
  for (let y = 0; y < H; y++) g[y * W] = g[y * W + W - 1] = 0;
  // Zhang–Suen thinning
  const N = (p) => [g[p - W], g[p - W + 1], g[p + 1], g[p + W + 1], g[p + W], g[p + W - 1], g[p - 1], g[p - W - 1]];
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of [0, 1]) {
      const del = [];
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const p = y * W + x; if (!g[p]) continue;
        const n = N(p), b = n.reduce((a, v) => a + v, 0); if (b < 2 || b > 6) continue;
        let a = 0; for (let i = 0; i < 8; i++) if (!n[i] && n[(i + 1) % 8]) a++;
        if (a !== 1) continue;
        if (step === 0 ? (n[0] * n[2] * n[4] || n[2] * n[4] * n[6]) : (n[0] * n[2] * n[6] || n[0] * n[4] * n[6])) continue;
        del.push(p);
      }
      for (const p of del) g[p] = 0;
      if (del.length) changed = true;
    }
  }
  // Walk the skeleton greedily into long strokes: start at free tips, and at every step take
  // the unvisited neighbour that best keeps the current direction. Junctions are simply
  // passed straight through; side branches become their own strokes from their tips.
  const OFF = [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1];
  const vis = new Uint8Array(W * H);
  const free = (p) => OFF.filter((o) => g[p + o] && !vis[p + o]);
  const deg = (p) => OFF.filter((o) => g[p + o]).length;
  const seeds = [];
  for (let p = 0; p < W * H; p++) if (g[p] && deg(p) === 1) seeds.push(p);
  for (let p = 0; p < W * H; p++) if (g[p] && deg(p) !== 1) seeds.push(p);
  const paths = [];
  for (const s of seeds) {
    if (vis[s]) continue;
    const pts = [s]; vis[s] = 1;
    while (true) {
      const opts = free(pts.at(-1)); if (!opts.length) break;
      let best = opts[0];
      if (pts.length > 1) {
        const a = pts[Math.max(0, pts.length - 5)], b = pts.at(-1);
        const dx = b % W - a % W, dy = Math.floor(b / W) - Math.floor(a / W), l = Math.hypot(dx, dy) || 1;
        let bd = -2; for (const o of opts) { const q = b + o, ox = q % W - b % W, oy = Math.floor(q / W) - Math.floor(b / W);
          const d = (ox * dx + oy * dy) / (l * Math.hypot(ox, oy)); if (d > bd) { bd = d; best = o; } }
        if (bd < -0.2) break; // would turn back on itself: end the stroke here
      }
      const q = pts.at(-1) + best; vis[q] = 1; pts.push(q);
    }
    paths.push(pts);
  }
  // RDP + filter + orient
  const rdp = (pts) => {
    if (pts.length < 3) return pts;
    const [a, b] = [pts[0], pts[pts.length - 1]]; let dm = 0, im = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      const d = Math.abs(dy * x - dx * y + b[0] * a[1] - b[1] * a[0]) / l; if (d > dm) { dm = d; im = i; }
    }
    return dm > EPS ? [...rdp(pts.slice(0, im + 1)).slice(0, -1), ...rdp(pts.slice(im))] : [a, b];
  };
  const out = [];
  for (const raw of paths) {
    let pts = raw.map((p) => [p % W, Math.floor(p / W)]);
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (len < MIN_LEN) continue;
    const d0 = Math.hypot(pts[0][0] - OX, pts[0][1] - OY), d1 = Math.hypot(pts.at(-1)[0] - OX, pts.at(-1)[1] - OY);
    if (d1 < d0) pts.reverse();
    pts = rdp(pts);
    const f = (v) => +(v * SCALE).toFixed(1);
    out.push({ d: 'M' + pts.map((q) => f(q[0]) + ' ' + f(q[1])).join('L'), len: f(len), dist: f(Math.min(d0, d1)) });
  }
  out.sort((a, b) => a.dist - b.dist);
  require('fs').writeFileSync(OUT, JSON.stringify(out));
  console.log(OUT, 'paths', out.length, 'chars', JSON.stringify(out).length);
})();
