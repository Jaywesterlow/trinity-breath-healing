// Autumn leaves for DriftingLeaves, drawn in code (2026-10-29).
// Usage: node autumn-leaves.cjs <out dir> <contact sheet png>
// All one shape since 2026-10-29 (owner: the red maple of the reference photo, not
// star, oak or beech). Colours run from green still in it through yellow, orange
// and rust to red, as they fall.
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const [out, sheet] = process.argv.slice(2);
const S = 240; // canvas; leaf points up, stem at the bottom centre
const C = { x: 120, y: 142 }; // where the veins meet

// Outline as a polar function round C. lobes: [angle deg (0 = up), length, width deg, sharpness]
function polar(lobes, base, teeth, toothAmp, seed) {
	const pts = [];
	for (let i = 0; i < 360; i++) {
		const a = (i * Math.PI) / 180;
		let r = base;
		for (const [deg, len, w, sharp] of lobes) {
			let d = Math.abs(((i - deg + 540) % 360) - 180) / w;
			r = Math.max(r, len * Math.pow(Math.max(0, 1 - d), sharp));
		}
		const saw = ((i * teeth) / 360 + seed) % 1;
		r *= 1 + toothAmp * (saw < 0.7 ? saw / 0.7 : (1 - saw) / 0.3) - toothAmp / 2;
		pts.push([C.x + r * Math.sin(a), C.y - r * Math.cos(a)]);
	}
	return 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join('L') + 'Z';
}

// Red maple, after the owner's reference photo (2026-10-29): three broad lobes and
// two small ones at the base, shallow notches between them, each lobe with a
// pointed tip and a pair of side points, and a coarse saw-toothed edge.
// v varies the proportions a little from leaf to leaf.
const maple = (v, s) => {
	const lobes = [];
	const main = [
		[0 + v * 3, 100 - v * 4],
		[-62 - v * 4, 90 + v * 3],
		[62 + v * 2, 90 - v * 2],
		[-132, 40 + v * 3],
		[132, 40 - v * 2]
	];
	for (const [deg, len] of main) {
		lobes.push([deg, len, 46, 1.0]); // the broad body of the lobe
		lobes.push([deg - 15, len * 0.88, 11, 1.3]); // a side point either side of the tip
		lobes.push([deg + 15, len * 0.88, 11, 1.3]);
		lobes.push([deg, len * 1.04, 12, 1.6]); // the tip itself
	}
	return { outline: polar(lobes, 34, 72, 0.08, s), main };
};

const palmVeins = (main) =>
	main
		.map(([deg, len]) => {
			const a = (deg * Math.PI) / 180;
			const x = (C.x + len * 0.9 * Math.sin(a)).toFixed(1);
			const y = (C.y - len * 0.9 * Math.cos(a)).toFixed(1);
			// two side veins off each main vein, towards the side points
			let d = `M${C.x} ${C.y}L${x} ${y}`;
			for (const [t, off] of [
				[0.45, -30],
				[0.45, 30],
				[0.7, -24],
				[0.7, 24]
			]) {
				const bx = C.x + len * t * Math.sin(a);
				const by = C.y - len * t * Math.cos(a);
				const b2 = ((deg + off) * Math.PI) / 180;
				d += `M${bx.toFixed(1)} ${by.toFixed(1)}L${(bx + len * 0.28 * Math.sin(b2)).toFixed(1)} ${(by - len * 0.28 * Math.cos(b2)).toFixed(1)}`;
			}
			return d;
		})
		.join('');

// [variation, base colour, edge colour, blotch colour, colour along the veins, seed]
// From still green, through yellow and orange, to deep red.
const palettes = [
	[0.0, '#d8392a', '#9a1f18', '#f07a2a', '#d8c24a', 3],
	[0.6, '#e4572a', '#a3301a', '#f2a03a', '#cfc04a', 7],
	[-0.5, '#ee8a24', '#b4461a', '#f6c445', '#e8d070', 11],
	[0.9, '#c9601e', '#7e3214', '#e08a2e', '#c8a43a', 17],
	[-0.9, '#e6c03a', '#c48a22', '#f2d860', '#a8b048', 23],
	[0.3, '#c9c240', '#8e8a2c', '#8fa040', '#e8dc80', 29],
	[-0.3, '#c8362a', '#7a1a16', '#8a9a3e', '#b8b84a', 31],
	[0.7, '#a8301f', '#5e1612', '#c8582a', '#c89a3a', 37]
];
const leaves = palettes.map(([v, base, edge, blot, glow, seed]) => {
	const { outline, main } = maple(v, (seed % 10) / 10);
	return [outline, palmVeins(main), base, edge, blot, glow, seed, C.y];
});

(async () => {
	for (const [i, [outline, veins, base, edge, blot, glow, seed, stemY]] of leaves.entries()) {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<defs>
<radialGradient id="g" cx="50%" cy="58%" r="62%"><stop offset="0" stop-color="${base}"/><stop offset="0.7" stop-color="${base}"/><stop offset="1" stop-color="${edge}"/></radialGradient>
<clipPath id="c"><path d="${outline}"/></clipPath>
<filter id="w" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="${seed}" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="b" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="${seed + 1}" result="m"/>
<feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.55" result="ma"/>
<feComposite in="SourceGraphic" in2="ma" operator="in"/>
<feGaussianBlur stdDeviation="2"/>
</filter>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="grain" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="${seed + 2}"/>
<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 -0.15"/>
<feComposite in2="SourceGraphic" operator="in"/>
</filter>
</defs>
<path d="M120 ${stemY}L${120 + (seed % 2 ? 5 : -5)} 214" stroke="${edge}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
<g filter="url(#w)">
<g clip-path="url(#c)">
<rect width="${S}" height="${S}" fill="url(#g)"/>
<rect width="${S}" height="${S}" fill="${blot}" opacity="0.75" filter="url(#b)"/>
<path d="${veins}" stroke="${glow}" stroke-width="12" stroke-opacity="0.55" stroke-linecap="round" fill="none" filter="url(#soft)"/>
<path d="${veins}" stroke="${glow}" stroke-width="1.8" stroke-opacity="0.9" stroke-linecap="round" fill="none"/>
${[0, 1, 2, 3, 4].map((k) => `<circle cx="${70 + ((seed * (k + 3) * 37) % 100)}" cy="${70 + ((seed * (k + 5) * 23) % 90)}" r="${1.4 + (k % 3) * 0.6}" fill="#3a1408" opacity="0.6"/>`).join('')}
<path d="${outline}" fill="none" stroke="${edge}" stroke-width="7" stroke-opacity="0.45"/>
<rect width="${S}" height="${S}" fill="#2a1408" filter="url(#grain)" opacity="0.35"/>
</g>
</g>
</svg>`;
		await sharp(Buffer.from(svg))
			.resize(180)
			.webp({ quality: 86, alphaQuality: 90 })
			.toFile(`${out}/leaf-${i + 1}.webp`);
	}
	const files = leaves.map((_, n) => ({ input: `${out}/leaf-${n + 1}.webp`, left: n * 190 + 5, top: 10 }));
	await sharp({ create: { width: 1530, height: 200, channels: 3, background: '#f3e9da' } })
		.composite(files)
		.png()
		.toFile(sheet);
})();
