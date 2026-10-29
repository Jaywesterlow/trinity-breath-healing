// Autumn leaves for DriftingLeaves, drawn in code (2026-10-29).
// Usage: node autumn-leaves.cjs <out dir> <contact sheet png>
// Shapes after common Dutch street and wood trees: maple (five pointed lobes),
// sweet gum (star), oak (rounded lobes), beech (oval, wavy edge). Colours run from
// green still in the base through yellow, orange and rust to red, as they fall.
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const [out, sheet] = process.argv.slice(2);
const S = 240; // canvas; leaf points up, stem at the bottom centre
const C = { x: 120, y: 150 }; // where the veins meet

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

// Pinnate outline (oak, beech): width along the midrib from base (y=200) to tip (y=30).
function pinnate(widthAt, wave, waves) {
	const left = [];
	const right = [];
	for (let i = 0; i <= 120; i++) {
		const t = i / 120;
		const y = 200 - t * 170;
		const w = widthAt(t) * (1 + wave * Math.sin(t * Math.PI * waves));
		left.push([120 - w, y]);
		right.push([120 + w, y]);
	}
	const pts = [...right, ...left.reverse()];
	return 'M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join('L') + 'Z';
}

const maple = (s) =>
	polar(
		[
			[0, 100, 40, 1.3],
			[-58, 88, 36, 1.3],
			[58, 88, 36, 1.3],
			[-118, 54, 30, 1.2],
			[118, 54, 30, 1.2]
		],
		22,
		46,
		0.12,
		s
	);
const gum = (s) =>
	polar(
		[
			[0, 104, 26, 1.6],
			[-72, 96, 26, 1.6],
			[72, 96, 26, 1.6],
			[-140, 80, 24, 1.6],
			[140, 80, 24, 1.6]
		],
		20,
		60,
		0.06,
		s
	);
const oak = () =>
	pinnate((t) => (12 + 52 * Math.sin(Math.PI * Math.pow(t, 0.8))) * (t > 0.92 ? (1 - t) / 0.08 : 1), 0.42, 9);
const beech = () =>
	pinnate((t) => 50 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.75)), 0.9), 0.05, 14);

// Veins: palmate from C to the lobe tips, or a midrib with side veins.
const palmVeins = (angles, lens) =>
	angles
		.map((deg, i) => {
			const a = (deg * Math.PI) / 180;
			return `M${C.x} ${C.y}L${(C.x + lens[i] * 0.85 * Math.sin(a)).toFixed(1)} ${(C.y - lens[i] * 0.85 * Math.cos(a)).toFixed(1)}`;
		})
		.join('');
const pinVeins = (n, reach) => {
	let d = 'M120 200L120 34';
	for (let i = 1; i <= n; i++) {
		const y = 200 - (i / (n + 1)) * 160;
		const w = reach * Math.sin(Math.PI * (i / (n + 1)));
		d += `M120 ${y}L${120 - w} ${y - w * 0.55}M120 ${y}L${120 + w} ${y - w * 0.55}`;
	}
	return d;
};

// [outline, veins, base colour, edge colour, blotch colour, vein colour, seed, stem y]
const leaves = [
	[maple(0.1), palmVeins([0, -58, 58, -118, 118], [100, 88, 88, 54, 54]), '#d8382a', '#8e1d18', '#e86a2a', '#f2b48a', 3, C.y],
	[maple(0.6), palmVeins([0, -58, 58, -118, 118], [100, 88, 88, 54, 54]), '#ee8a24', '#b4461a', '#f6c445', '#fbe0a8', 7, C.y],
	[maple(0.3), palmVeins([0, -58, 58, -118, 118], [100, 88, 88, 54, 54]), '#e2bc3a', '#c27a20', '#9aa13e', '#f5e7a6', 11, C.y],
	[gum(0.2), palmVeins([0, -72, 72, -140, 140], [104, 96, 96, 80, 80]), '#b52a26', '#5e1418', '#d8562a', '#e7a088', 17, C.y],
	[oak(), pinVeins(6, 42), '#b85e22', '#6e3214', '#d48a34', '#e8b47e', 23, 200],
	[oak(), pinVeins(6, 42), '#e39a2a', '#a75a1c', '#8f9a3c', '#f6d49a', 29, 200],
	[beech(), pinVeins(8, 40), '#c47a2c', '#7c4318', '#e0a640', '#f0cb92', 31, 200],
	[beech(), pinVeins(8, 40), '#d6b23a', '#8a8a2c', '#7f9a3e', '#f2e6a6', 37, 200]
];

(async () => {
	for (const [i, [outline, veins, base, edge, blot, vein, seed, stemY]] of leaves.entries()) {
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
<filter id="grain" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="${seed + 2}"/>
<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 -0.15"/>
<feComposite in2="SourceGraphic" operator="in"/>
</filter>
</defs>
<path d="M120 ${stemY}L${120 + (seed % 2 ? 6 : -6)} 232" stroke="${edge}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
<g filter="url(#w)">
<g clip-path="url(#c)">
<rect width="${S}" height="${S}" fill="url(#g)"/>
<rect width="${S}" height="${S}" fill="${blot}" opacity="0.75" filter="url(#b)"/>
<path d="${veins}" stroke="${vein}" stroke-width="2" stroke-opacity="0.75" stroke-linecap="round" fill="none"/>
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
