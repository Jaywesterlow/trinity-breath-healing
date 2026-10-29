// Brings the generated contact illustrations in line with the Werkwijze cards
// (owner, 2026-10-29: those have "a lot more glow ... and a lot more defined lines").
// Measured on the Werkwijze cards: the glow peaks ~123 luminance above the green;
// the line art is a dark, crisp brown-gold. Here:
//  - lines: where a pixel is darker than its surroundings (a thin line on the light
//    glow), it is pulled towards LINE_GOLD, a little widened by a 1px blur;
//  - glow: its rise above the green is scaled so the peak rise is GLOW_RISE.
// Usage: node werkwijze-match.cjs <in png> <out webp>
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const fs = require('fs');
const [src, out] = process.argv.slice(2);
const LINE_GOLD = [128, 96, 52];
const LINE_STRENGTH = 0.9;
const GLOW_RISE = 123;
(async () => {
	const img = sharp(src).removeAlpha();
	const { data, info } = await img.clone().raw().toBuffer({ resolveWithObject: true });
	const near = await img.clone().blur(0.8).raw().toBuffer();
	const wide = await img.clone().blur(6).raw().toBuffer();
	const glow = await img.clone().blur(45).raw().toBuffer();
	const W = info.width, H = info.height;
	const L = (b, i) => 0.2126 * b[i] + 0.7152 * b[i + 1] + 0.0722 * b[i + 2];
	let bg = 0, n = 0, peak = 0;
	for (let y = 0; y < H; y += 2)
		for (let x = 0; x < W; x += 2) {
			const i = (y * W + x) * 3;
			if (x < W * 0.3) { bg += L(glow, i); n++; }
			peak = Math.max(peak, L(glow, i));
		}
	bg /= n;
	const glowGain = GLOW_RISE / Math.max(1, peak - bg);
	const o = Buffer.alloc(data.length);
	for (let p = 0; p < W * H; p++) {
		const i = p * 3;
		// line mask: how much darker the (slightly widened) pixel is than its neighbourhood
		const gl = Math.max(0, L(glow, i) - bg);
		// only inside the glow: on the bare green this would pick out the paper grain
		const inGlow = Math.min(1, gl / 45);
		const m = Math.max(0, Math.min(1, (L(wide, i) - L(near, i)) / 28)) * LINE_STRENGTH * inGlow;
		for (let c = 0; c < 3; c++) {
			let v = data[i + c] + (glowGain - 1) * gl;
			v = v + (LINE_GOLD[c] - v) * m;
			o[i + c] = Math.max(0, Math.min(255, Math.round(v)));
		}
	}
	fs.writeFileSync(out, await sharp(o, { raw: info }).webp({ quality: 84 }).toBuffer());
	console.log(src.split(/[\/]/).pop(), 'glow gain', glowGain.toFixed(2));
})();
