const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const [src, out, preview] = process.argv.slice(2);
const W = 1122, H = 1402;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs><filter id="f" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="4" seed="23" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="170" xChannelSelector="R" yChannelSelector="G" result="d"/>
<feGaussianBlur in="d" stdDeviation="12" result="b"/>
<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" seed="4" result="g"/>
<feComposite in="b" in2="g" operator="arithmetic" k1="1.1" k2="0.35" k3="0" k4="0" result="c"/>
<feComponentTransfer in="c"><feFuncA type="linear" slope="1.9" intercept="-0.2"/></feComponentTransfer>
</filter></defs>
<rect x="110" y="90" width="${W-220}" height="${H-200}" rx="360" fill="#fff" filter="url(#f)"/>
</svg>`;
(async () => {
  const mask = await sharp(Buffer.from(svg)).ensureAlpha().extractChannel('alpha').raw().toBuffer();
  const graded = await sharp(src).removeAlpha().recomb([[1.02,0.01,0],[0,1.0,0],[0,0.01,0.95]]).modulate({ saturation: 0.94 }).raw().toBuffer({ resolveWithObject: true });
  const img = sharp(graded.data, { raw: graded.info }).joinChannel(mask, { raw: { width: W, height: H, channels: 1 } });
  await img.clone().webp({ quality: 88, alphaQuality: 90 }).toFile(out);
  await sharp({ create: { width: W, height: H, channels: 3, background: process.argv[5] } }).composite([{ input: await img.clone().png().toBuffer() }]).png().toBuffer().then(b => sharp(b).resize(450).jpeg().toFile(preview)); return; (0).jpeg().toFile(preview);
})();
