// Strokes drawn in red over the line layer, to check the trace covers the lines.
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const [LAYER, JSONF, CW, CH, x0, y0, w, h, OUT] = process.argv.slice(2).map((v, i) => (i >= 2 && i <= 7 ? +v : v));
(async () => {
  const S = 3, k = (await sharp(LAYER).metadata()).width / CW;
  const P = JSON.parse(require('fs').readFileSync(JSONF, 'utf8'));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * S}" height="${h * S}" viewBox="${x0} ${y0} ${w} ${h}">` + P.map((p) => `<path d="${p.d}" fill="none" stroke="red" stroke-width="0.5"/>`).join('') + '</svg>';
  await sharp(LAYER).extract({ left: Math.round(x0 * k), top: Math.round(y0 * k), width: Math.round(w * k), height: Math.round(h * k) }).resize(w * S, h * S).composite([{ input: Buffer.from(svg) }]).png().toFile(OUT);
})();
