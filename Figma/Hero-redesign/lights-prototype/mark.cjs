// Crop of the tree with numbered markers: node mark.cjs <base> <imgW(coord space)> <x0> <y0> <w> <h> <out> <pts json>
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
(async () => {
  const [base, cw, x0, y0, w, h, out, pts] = process.argv.slice(2);
  const meta = await sharp(base).metadata(); const k = meta.width / +cw;
  const P = JSON.parse(pts); const S = 3; // output scale relative to coord space
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w*S}" height="${h*S}">` + P.map(([x,y,l],i)=>`<circle cx="${(x-x0)*S}" cy="${(y-y0)*S}" r="10" fill="none" stroke="#f0f" stroke-width="3"/><text x="${(x-x0)*S+12}" y="${(y-y0)*S-10}" font-size="28" font-family="Arial" fill="#f0f" stroke="#000" stroke-width="1">${l??i+1}</text>`).join('') + `</svg>`;
  await sharp(base).extract({ left: Math.round(x0*k), top: Math.round(y0*k), width: Math.round(w*k), height: Math.round(h*k) }).resize(w*S, h*S).composite([{ input: Buffer.from(svg) }]).png().toFile(out);
})();
