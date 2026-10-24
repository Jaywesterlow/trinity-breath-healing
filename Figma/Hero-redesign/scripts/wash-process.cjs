// Turn the white-paper wash into a transparent PNG with no edge.
// density = how much pigment (1 - luminance, levelled); then multiplied by a
// mask built from a heavily blurred copy of the density, so the wash has
// already faded to zero before the painted edge is reached.
// Output: dark green #2f3a28, alpha = density * MAX_A.
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const path = require('path');
const D = __dirname;
const SRC = process.argv[2] || 'wash-wide-raw.png';
const MAX_A = Number(process.env.MAX_A || 0.55);
const DARK = [0x2f, 0x3a, 0x28];

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

(async () => {
	const { data, info } = await sharp(path.join(D, SRC)).greyscale().blur(1.2).raw().toBuffer({ resolveWithObject: true });
	const { width: w, height: h } = info;
	// paper white and the densest pigment, from percentiles
	const sorted = Uint8Array.from(data).sort();
	const white = Number(process.env.WHITE || 230) + 6; // below the darkest paper (239)
	const dark = sorted[Math.floor(sorted.length * 0.01)];
	const dens = Buffer.alloc(w * h);
	for (let i = 0; i < w * h; i++) dens[i] = Math.round(255 * Math.min(1, Math.max(0, (white - 6 - data[i]) / (white - 6 - dark))));
	// blurred density: low near and outside the painted edge
	const blur = await sharp(dens, { raw: { width: w, height: h, channels: 1 } }).blur(90).extractChannel(0).raw().toBuffer();
	const bsorted = Uint8Array.from(blur).sort();
	const bmax = bsorted[Math.floor(bsorted.length * 0.995)];
	const out = Buffer.alloc(w * h * 4);
	for (let i = 0; i < w * h; i++) {
		const x = (i % w) / w - 0.5, y = Math.floor(i / w) / h - 0.5;
		const edge = 1 - smooth(0.36, 0.48, Math.max(Math.abs(x), Math.abs(y)));
		const m = smooth(0.3, 0.85, blur[i] / bmax) * edge;
		// soft-light the texture: keep variation, but lift the floor so the core is even
		const d = dens[i] / 255;
		const a = MAX_A * m * (0.55 + 0.45 * d);
		out[i * 4] = DARK[0]; out[i * 4 + 1] = DARK[1]; out[i * 4 + 2] = DARK[2];
		out[i * 4 + 3] = Math.round(255 * a);
	}
	const name = SRC.replace('-raw.png', '');
	await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toFile(path.join(D, name + '.png'));
	// edge check: largest alpha step between neighbours, and alpha on the border
	let step = 0, border = 0;
	for (let y = 1; y < h; y++) for (let x = 1; x < w; x++) {
		const i = y * w + x;
		step = Math.max(step, Math.abs(out[i * 4 + 3] - out[(i - 1) * 4 + 3]), Math.abs(out[i * 4 + 3] - out[(i - w) * 4 + 3]));
		if (x === 1 || y === 1 || x === w - 1 || y === h - 1) border = Math.max(border, out[i * 4 + 3]);
	}
	console.log(name, `${w}x${h}`, 'maxStep', step, 'borderAlpha', border);
})();
