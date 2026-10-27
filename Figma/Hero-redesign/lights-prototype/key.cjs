// Lit layer for the breathing hero: the gold lines (warm hue) and the brightest paint,
// cut from the approved image by colour, on black so `mix-blend-mode: screen` adds only light.
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const SRC = 'P:/AI/trinity-breath-healing/src/lib/images/redesign/hero-landscape-21x9.webp';
const W = 3168;
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
(async () => {
  const { data, info } = await sharp(SRC).resize(W).raw().toBuffer({ resolveWithObject: true });
  const C = info.channels, gold = Buffer.alloc(info.width * info.height * 3), glow = Buffer.alloc(gold.length);
  for (let p = 0, i = 0; i < data.length; i += C, p += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2], lum = 0.3 * r + 0.59 * g + 0.11 * b;
    const warm = ss(6, 28, r - g);           // gold lines
    const bright = ss(160, 215, lum) * 0.6;  // river glow, canopy highlights
    const m = Math.max(warm, bright);
    // gold layer: the line's own colour, pushed warmer and brighter
    gold[p] = Math.min(255, r * 1.15 * m); gold[p + 1] = Math.min(255, g * 1.0 * m); gold[p + 2] = Math.min(255, b * 0.75 * m);
    // glow source: lines only, pure warm light
    glow[p] = 255 * warm; glow[p + 1] = 200 * warm; glow[p + 2] = 120 * warm;
  }
  const raw = { raw: { width: info.width, height: info.height, channels: 3 } };
  await sharp(gold, raw).webp({ quality: 82 }).toFile('lit-lines.webp');
  await sharp(glow, raw).blur(14).webp({ quality: 70 }).toFile('lit-glow.webp');
  await sharp(SRC).resize(W).webp({ quality: 82 }).toFile('base.webp');
  await sharp(gold, raw).resize(2112).png().toFile('lit-preview.png');
  console.log(info.width, info.height);
})();
