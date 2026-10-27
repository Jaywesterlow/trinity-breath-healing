// River crop with lanes drawn: node lanes.cjs <base> <coordW> <x0> <y0> <w> <h> <scale> <out> <lanes json> [grid]
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
(async () => {
  const [base, cw, x0, y0, w, h, S, out, lanes, grid] = process.argv.slice(2).map((v, i) => (i >= 1 && i <= 6 ? +v : v));
  const k = (await sharp(base).metadata()).width / cw;
  const C = ['#f0f', '#0f0', '#0ff'];
  let g = '';
  if (grid) for (let x = Math.ceil(x0 / 20) * 20; x < x0 + w; x += 20) g += `<line x1="${(x - x0) * S}" y1="0" x2="${(x - x0) * S}" y2="${h * S}" stroke="#fff" stroke-opacity="${x % 100 ? 0.12 : 0.4}"/>` + (x % 100 ? '' : `<text x="${(x - x0) * S + 2}" y="14" font-size="13" fill="#fff">${x}</text>`);
  if (grid) for (let y = Math.ceil(y0 / 20) * 20; y < y0 + h; y += 20) g += `<line x1="0" y1="${(y - y0) * S}" x2="${w * S}" y2="${(y - y0) * S}" stroke="#fff" stroke-opacity="${y % 100 ? 0.12 : 0.4}"/>` + (y % 100 ? '' : `<text x="2" y="${(y - y0) * S - 2}" font-size="13" fill="#fff">${y}</text>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * S}" height="${h * S}" viewBox="${x0} ${y0} ${w} ${h}"><g transform="translate(${-x0 * 0},0)"></g>` +
    JSON.parse(lanes).map((d, i) => `<path d="${d}" fill="none" stroke="${C[i]}" stroke-width="${2 / S * 1.5}"/>`).join('') + `</svg>`;
  const gsvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * S}" height="${h * S}">${g}</svg>`;
  await sharp(base).extract({ left: Math.round(x0 * k), top: Math.round(y0 * k), width: Math.round(w * k), height: Math.round(h * k) }).resize(w * S, h * S)
    .composite([{ input: Buffer.from(gsvg) }, { input: Buffer.from(svg) }]).png().toFile(out);
})();
