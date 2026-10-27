// The base image in dim light: everything brighter than the paper (gold lines, the white
// lines on the trunk's left, the painted river glow) is pulled down toward it, so the lights
// on the page, not the painting, decide what is bright. Above the threshold T, brightness is
// compressed to KEEP of its height; hue is kept by scaling RGB together.
// node dim.cjs <in> <out> [T=150] [KEEP=0.3]
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
(async () => {
  const [IN, OUT, T = 150, KEEP = 0.3] = process.argv.slice(2).map((v, i) => (i > 1 ? +v : v));
  const { data, info } = await sharp(IN).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) {
    const L = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
    if (L <= T) continue;
    const s = (T + (L - T) * KEEP) / L;
    data[i] *= s; data[i + 1] *= s; data[i + 2] *= s;
  }
  await sharp(data, { raw: info }).webp({ quality: 82 }).toFile(OUT);
  console.log(OUT, info.width, info.height);
})();
