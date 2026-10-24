// For each card image: in the text area, calm the texture (halve its swing around the mean),
// pull the mean to the target hex, and cap brightness at the target so no patch is lighter than
// the fallback colour. Full strength to 45% of the height, easing out by 70%; illustration untouched.
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const path = require('path');
const D = __dirname;
const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const SAND = lum(0xfa, 0xf0, 0xe6);
const cr = (l) => (SAND + 0.05) / (l + 0.05);
const CALM = +process.argv[2]; const SUFFIX = process.argv[3];
const COLOURS = { 'site-green-627454': [0x62, 0x74, 0x54], 'sage-A-686954': [0x68, 0x69, 0x54] };

(async () => {
	const tiles = {};
	for (const card of ['card1', 'card2', 'card3'])
		for (const [key, target] of Object.entries(COLOURS)) {
			const name = `${card}-${key}`;
			const { data, info } = await sharp(path.join(D, name + '.png')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
			const { width: W, height: H } = info;
			const top = Math.round(H * 0.4);
			const mean = [0, 0, 0];
			for (let i = 0; i < W * top * 3; i += 3) for (let c = 0; c < 3; c++) mean[c] += data[i + c] / (W * top);
			const gain = mean.map((m, c) => target[c] / m);
			const tLum = lum(...target) * 0.97;
			let worst = 99;
			for (let y = 0; y < H; y++) {
				const t = y / H;
				const k = t <= 0.45 ? 1 : t >= 0.7 ? 0 : 1 - (t - 0.45) / 0.25;
				if (!k) continue;
				for (let x = 0; x < W; x++) {
					const i = (y * W + x) * 3;
					let p = [0, 1, 2].map((c) => (mean[c] + (data[i + c] - mean[c]) * CALM) * gain[c]);
					const l = lum(...p.map((v) => Math.min(255, v)));
					if (l > tLum) p = p.map((v) => v * (tLum / l) ** (1 / 2.2));
					for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, Math.round(data[i + c] * (1 - k) + p[c] * k)));
					if (t < 0.4) worst = Math.min(worst, cr(lum(data[i], data[i + 1], data[i + 2])));
				}
			}
			const out = sharp(data, { raw: { width: W, height: H, channels: 3 } });
			await out.clone().png().toFile(path.join(D, name + SUFFIX + '.png'));
			tiles[name] = await out.clone().resize(320, 573).png().toBuffer();
			console.log(name, 'lightest patch in text area', worst.toFixed(2) + ':1');
		}
	const comp = [];
	['site-green-627454', 'sage-A-686954'].forEach((key, row) =>
		['card1', 'card2', 'card3'].forEach((card, col) => comp.push({ input: tiles[`${card}-${key}`], left: col * 340, top: row * 593 })));
	await sharp({ create: { width: 1000, height: 1166, channels: 3, background: '#faf0e6' } }).composite(comp).png().toFile(path.join(D, 'compare-all' + SUFFIX + '.png'));
})();
