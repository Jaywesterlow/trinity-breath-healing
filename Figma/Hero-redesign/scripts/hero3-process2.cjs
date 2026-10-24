// Hero round 3, processing v2. No darkening, no local masks:
// - ground: hue moved towards the site green at the SAME luminance (no rectangle, no dimming)
// - gold: line pixels lifted and pulled from copper to gold, plus a soft bloom (screen) so the
//   lines glow like the first hero. Text contrast is handled in CSS by a soft scrim instead.
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const path = require('path');
const D = __dirname;
const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const T = [0x62, 0x74, 0x54];
const LIFT = +(process.argv[2] ?? 0.1), BLOOM = +(process.argv[3] ?? 0.35);

(async () => {
	for (const [src, out] of [['hero3-landscape-dull', 'hero3-landscape-v2'], ['hero3-portrait', 'hero3-portrait-v2']]) {
		const base = sharp(path.join(D, src + '.png')).removeAlpha();
		const { data, info } = await base.clone().raw().toBuffer({ resolveWithObject: true });
		const W = info.width, H = info.height;
		const ground = await base.clone().resize(Math.round(W / 8)).blur(12).resize(W, H).raw().toBuffer();
		const line = new Float32Array(W * H);
		const sum = [0, 0, 0]; let n = 0;
		for (let p = 0, i = 0; p < W * H; p++, i += 3) {
			const l = lum(data[i], data[i + 1], data[i + 2]), g = lum(ground[i], ground[i + 1], ground[i + 2]);
			line[p] = ss(1.12, 1.45, l / (g + 1e-4)) * ss(4, 16, data[i] - data[i + 1]);
			if (line[p] < 0.02 && p % 7 === 0) { for (let c = 0; c < 3; c++) sum[c] += data[i + c]; n++; }
		}
		const mean = sum.map((s) => s / n);
		// Hue gain: towards the site green's channel ratios, renormalised to keep the mean's luminance.
		let gain = mean.map((m, c) => T[c] / m);
		const keep = (lum(...mean) / lum(...mean.map((m, c) => m * gain[c]))) ** (1 / 2.2);
		gain = gain.map((g) => g * keep);
		const HUE = +(process.env.HUE ?? 1); gain = gain.map((g) => 1 + (g - 1) * HUE);
		// Bloom source: the gold lines only, warm-tinted, blurred.
		const src8 = Buffer.alloc(W * H * 3);
		for (let p = 0, i = 0; p < W * H; p++, i += 3) { const m = line[p]; src8[i] = 255 * m; src8[i + 1] = 214 * m; src8[i + 2] = 150 * m; }
		const bloom = await sharp(src8, { raw: { width: W, height: H, channels: 3 } }).blur(Math.max(2, W / 700)).raw().toBuffer();
		for (let p = 0, i = 0; p < W * H; p++, i += 3) {
			const m = line[p];
			let px = [0, 1, 2].map((c) => data[i + c] * (gain[c] * (1 - m) + m));
			if (m > 0) {
				const v = Math.max(data[i], data[i + 1], data[i + 2]) / 255;
				const lift = 1 + LIFT * ss(0.45, 0.9, v);
				const r = data[i], g = data[i + 1] + (data[i] - data[i + 1]) * 0.15, b = data[i + 2];
				px = px.map((v2, c) => v2 * (1 - m) + [r, g, b][c] * lift * m);
			}
			for (let c = 0; c < 3; c++) { const s = Math.min(255, px[c]) / 255, bl = (bloom[i + c] / 255) * BLOOM; data[i + c] = Math.round(255 * (1 - (1 - s) * (1 - bl))); }
		}
		await sharp(data, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(D, out + '.png'));
		const g2 = mean.map((m, c) => Math.round(m * gain[c]));
		console.log(out, 'ground mean', '#' + g2.map((v) => v.toString(16).padStart(2, '0')).join(''));
	}
	const hsv = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return { v: mx / 255, s: mx ? (mx - mn) / mx : 0, warm: r - g }; };
	for (const f of ['hero-a', 'hero3-landscape-v2', 'hero3-portrait-v2']) {
		const { data } = await sharp(path.join(D, f + '.png')).resize(1200).removeAlpha().raw().toBuffer({ resolveWithObject: true });
		const px = []; for (let i = 0; i < data.length; i += 3) { const h = hsv(data[i], data[i + 1], data[i + 2]); if (h.warm > 18 && h.v > 0.55) px.push(h); }
		px.sort((a, b) => b.v - a.v); const top = px.slice(0, Math.max(1, Math.floor(px.length * 0.25)));
		const avg = (k) => top.reduce((a, p) => a + p[k], 0) / top.length;
		console.log(f.padEnd(20), 'gold V', avg('v').toFixed(3), 'warm', avg('warm').toFixed(1));
	}
	// Side by side: first hero crop (tree) vs the new landscape crop, same scale, plus the portrait.
	const a = await sharp(path.join(D, 'hero-a.png')).extract({ left: 2600, top: 300, width: 2600, height: 2300 }).resize(520).png().toBuffer();
	const b = await sharp(path.join(D, 'hero3-landscape-v2.png')).extract({ left: 3000, top: 150, width: 2600, height: 2300 }).resize(520).png().toBuffer();
	const c = await sharp(path.join(D, 'hero3-portrait-v2.png')).resize(null, 620).png().toBuffer();
	const cm = await sharp(c).metadata();
	await sharp({ create: { width: 1080 + cm.width, height: 620, channels: 3, background: '#faf0e6' } })
		.composite([{ input: a, left: 0, top: 80 }, { input: b, left: 540, top: 80 }, { input: c, left: 1080, top: 0 }]).png().toFile(path.join(D, 'hero3-v2-compare.png'));
})();
