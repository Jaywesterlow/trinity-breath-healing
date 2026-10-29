// Line layer: the painting's gold/white lines only, on transparency, plus a
// binary mask of them for the tracer. A line = brighter than a wide median of its
// surroundings (the median drops thin lines but keeps broad paint like the river glow).
// node lines.cjs <base> <outLayer.webp> <outMask.png> <medianWindow>
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
(async () => {
  const [IN, OUT, MASK, WIN = 41] = process.argv.slice(2);
  const { data: img, info } = await sharp(IN).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const bg = await sharp(IN).removeAlpha().median(+WIN).blur(+WIN / 4).raw().toBuffer();
  const L = (a, i) => 0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2];
  const layer = Buffer.alloc(W * H * 4), mask = Buffer.alloc(W * H); // RGBA: the line's own colour, alpha = how much line
  for (let p = 0, i = 0; p < W * H; p++, i += 3) {
    const d = L(img, i) - L(bg, i);
    const t = Math.min(1, Math.max(0, (d - 6) / 24)), s = t * t * (3 - 2 * t);
    for (let c = 0; c < 3; c++) layer[p * 4 + c] = img[i + c];
    layer[p * 4 + 3] = 255 * s;
    mask[p] = d > 14 ? 255 : 0;
  }
  await sharp(layer, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 85, alphaQuality: 90 }).toFile(OUT);
  await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).png().toFile(MASK);
  console.log(OUT, W, H);
})();
