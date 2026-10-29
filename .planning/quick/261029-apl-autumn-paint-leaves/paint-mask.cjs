// The brush-stroke mask the About portrait is painted in with (2026-10-29).
// Usage: node paint-mask.cjs <out webp>
// Three panels side by side, each the photo's shape: left fully painted, middle
// the wet edge (horizontal strokes of different lengths, ragged), right empty.
// CSS slides it from right to left (mask-size 300%), so the strokes sweep across.
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const W = 1500;
const H = 625;
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
let strokes = '';
for (let y = -40; y < H + 40; y += 30 + rnd() * 26) {
	const h = 22 + rnd() * 30;
	const end = 540 + rnd() * 420; // all strokes end inside the middle panel
	strokes += `<rect x="-150" y="${y.toFixed(0)}" width="${(end + 150).toFixed(0)}" height="${h.toFixed(0)}" rx="${(h / 2).toFixed(0)}"/>`;
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs><filter id="f" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="4" seed="11" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="44" xChannelSelector="R" yChannelSelector="G"/>
<feGaussianBlur stdDeviation="5"/>
<feComponentTransfer><feFuncA type="linear" slope="1.8" intercept="-0.25"/></feComponentTransfer>
</filter></defs>
<g fill="#fff" filter="url(#f)"><rect x="-150" y="-150" width="640" height="${H + 300}"/>${strokes}</g>
</svg>`;
sharp(Buffer.from(svg))
	.extractChannel(3)
	.toColourspace('b-w')
	.png({ compressionLevel: 9 })
	.toBuffer()
	.then((alpha) =>
		sharp({ create: { width: W, height: H, channels: 3, background: '#000' } })
			.joinChannel(alpha)
			.png({ compressionLevel: 9 })
			.toBuffer().then((b) => sharp(b).resize(900).webp({ quality: 70, alphaQuality: 60 }).toFile(process.argv[2]))
	);
