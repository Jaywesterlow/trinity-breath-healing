/**
 * layerize.mjs — split a masked draw-on trace into independent artwork layers.
 *
 * Why
 * ---
 * The reveal is an SVG <mask> of stroked paths over the artwork. A mask stroke reveals whatever
 * artwork sits under it, and these strokes are 5.8–24 units wide while the lines they uncover are
 * roughly 3–5. So a stroke is three to four times wider than its own line, and drawing the cup's
 * rim also uncovers the piece of steam that happens to cross it. That is not an ordering problem
 * and no draw order can fix it — it is one bitmap being revealed by overlapping brushes.
 *
 * Narrowing the brushes is not available either: measured on card-kennismaking, at 0.7x width
 * 0.8% of the artwork's ink is never revealed at all, because the traced centrelines drift from
 * the real lines. The width is what compensates for that drift.
 *
 * What this does
 * --------------
 * Cuts the artwork into one bitmap per layer, each carrying only the ink its own strokes are
 * meant to reveal, and emits an SVG where each layer has its own mask. A cup stroke then has
 * nothing but cup ink underneath it, so the bleed is structurally impossible rather than
 * something the draw order has to keep dodging.
 *
 * Pixel-exactness
 * ---------------
 * Each layer is `artwork x binary(layer strokes)`. Two properties make the composite exact:
 *
 *   - The masks are thresholded to 0 or 1, never partial. A pixel is either fully in a layer or
 *     absent from it, so the artwork's own antialiasing is carried through untouched. Feathered
 *     masks would blend two half-alpha copies of the same pixel into a darker one at every layer
 *     boundary.
 *   - Overlap is allowed. A pixel under two layers' strokes appears in both, at full opacity, in
 *     the same colour — so drawing one over the other reproduces it exactly.
 *
 * Every artwork pixel is covered by some stroke (that is what 0% missing at 1.0x width means), so
 * the union of the layers is the original image. The script asserts it.
 *
 * Usage:
 *   node layerize.mjs <trace.svg> <artwork.webp> <outdir> <name> \
 *     --layer "front:22,23,26-29,32-39" --layer "back:4,9-12" --layer "smoke:0-3"
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import sharp from 'sharp';

const [, , svgPath, artPath, outDir, name, ...rest] = process.argv;
if (!name) {
	console.error('usage: layerize.mjs <trace.svg> <artwork.webp> <outdir> <name> --layer "n:ids"');
	process.exit(1);
}

const layers = [];
for (let i = 0; i < rest.length; i++) {
	if (rest[i] !== '--layer') continue;
	const [ln, body] = rest[++i].split(':');
	const ids = [];
	for (const part of body.split(',')) {
		const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
		if (!m) throw new Error(`bad index spec ${part}`);
		for (let k = +m[1]; k <= +(m[2] ?? m[1]); k++) ids.push(k);
	}
	layers.push({ name: ln, ids });
}

const svg = readFileSync(svgPath, 'utf8');
// Running this twice is not idempotent and silently produces garbage: the rewrite concatenates
// the layers' strokes in layer order, so a second run's --layer indices address a different
// document. Refuse rather than let that happen quietly.
if ((svg.match(/<mask /g) || []).length > 1) {
	console.error(`${basename(svgPath)}: already layered. Re-run from the single-mask original.`);
	process.exit(1);
}
const [, vw, vh] = svg.match(/viewBox="0 0 (\d+) (\d+)"/).map(Number);
const groupOpen = svg.match(/<g class="lt-draw"[^>]*>/)[0];
const paths = [...svg.matchAll(/<path pathLength="1"[^>]*\/>/g)].map((m) => m[0]);
if (paths.length !== layers.reduce((a, l) => a + l.ids.length, 0)) {
	throw new Error(`layers cover ${layers.reduce((a, l) => a + l.ids.length, 0)} of ${paths.length} strokes`);
}

const artB64 = readFileSync(artPath).toString('base64');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });

const out = await page.evaluate(
	async ({ artB64, vw, vh, groupOpen, paths, layers }) => {
		const art = new Image();
		art.src = 'data:image/webp;base64,' + artB64;
		await art.decode();
		const W = art.naturalWidth,
			H = art.naturalHeight;

		const draw = (el) => {
			const c = document.createElement('canvas');
			c.width = W;
			c.height = H;
			return [c, c.getContext('2d', { willReadFrequently: true })];
		};

		// Rasterise one layer's strokes, fully drawn, as a white-on-transparent stencil.
		async function stencil(ids) {
			const inner = ids.map((i) => paths[i]).join('');
			const s =
				`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" width="${W}" height="${H}">` +
				groupOpen.replace(/stroke="#[0-9A-Fa-f]{3,8}"/, 'stroke="#fff"') +
				inner +
				'</g></svg>';
			const img = new Image();
			img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s)));
			await img.decode();
			const [c, x] = draw();
			x.drawImage(img, 0, 0, W, H);
			return x.getImageData(0, 0, W, H);
		}

		const [ac, ax] = draw();
		ax.drawImage(art, 0, 0, W, H);
		const artData = ax.getImageData(0, 0, W, H);

		const results = [];
		const coverage = new Uint8Array(W * H);
		for (const { name, ids } of layers) {
			const st = await stencil(ids);
			const [lc, lx] = draw();
			const outData = lx.createImageData(W, H);
			let kept = 0;
			for (let p = 0, i = 0; p < W * H; p++, i += 4) {
				// Binary, not feathered: a pixel is wholly in this layer or not in it at all.
				// The cut-off is deliberately low. An SVG mask multiplies by a continuous alpha,
				// so a stroke's antialiased fringe still reveals a little ink; thresholding at
				// half alpha dropped 9 pixels of the artwork on the floor. Anything a stroke
				// touches at all belongs to that layer. Layers may overlap — that is harmless,
				// the same pixel in the same colour at full opacity — but a pixel in NO layer is
				// ink permanently lost.
				const on = st.data[i + 3] > 8;
				if (!on) continue;
				coverage[p] = 1;
				outData.data[i] = artData.data[i];
				outData.data[i + 1] = artData.data[i + 1];
				outData.data[i + 2] = artData.data[i + 2];
				outData.data[i + 3] = artData.data[i + 3];
				if (artData.data[i + 3] > 8) kept++;
			}
			lx.putImageData(outData, 0, 0);
			// PNG out of the canvas, re-encoded to lossless WebP outside the browser. Chromium's
			// canvas WebP encoder is lossy at every quality — at 0.92 it altered 43,517 pixels of
			// this 700x759 drawing and at quality 1 still 14,630. Re-encoding that losslessly only
			// preserves the damage. PNG round-trips at zero difference.
			results.push({ name, dataUrl: lc.toDataURL('image/png'), inkPx: kept });
		}

		// Every artwork pixel must land in at least one layer, or the composite loses ink.
		let ink = 0,
			lost = 0;
		for (let p = 0, i = 0; p < W * H; p++, i += 4) {
			if (artData.data[i + 3] > 8) {
				ink++;
				if (!coverage[p]) lost++;
			}
		}
		return { W, H, results, ink, lost };
	},
	{ artB64, vw, vh, groupOpen, paths, layers }
);

await browser.close();

console.log(`artwork ${out.W}x${out.H}, ${out.ink} ink px`);
if (out.lost) {
	console.error(`  ${out.lost} ink px (${((100 * out.lost) / out.ink).toFixed(3)}%) fall in NO layer`);
	process.exit(1);
}
console.log('  every ink pixel is covered by at least one layer');

const files = [];
for (const r of out.results) {
	const file = `${name}-${r.name}.webp`;
	const png = Buffer.from(r.dataUrl.split(',')[1], 'base64');
	const buf = await sharp(png).webp({ lossless: true, effort: 6 }).toBuffer();
	writeFileSync(join(outDir, file), buf);
	files.push({ ...r, file });
	console.log(`  ${file}  ${r.inkPx} ink px, ${(buf.length / 1024).toFixed(0)} KB lossless`);
}

// Emit one <svg> PER LAYER, siblings in a single file, stacked by DrawOn.
//
// Not one <svg> holding three masks — that was measured and is much worse. A mask change
// invalidates the whole element it sits in, so three masks in one <svg> re-rasterise all three
// layers on every frame: 1222ms of raster over a 2.4s draw, against 506ms for the original
// single mask. As separate elements each layer is its own paint layer, only the one currently
// animating is dirty, and each carries fewer strokes: 327ms, cheaper than what it replaces.
const uid = Math.random().toString(36).slice(2, 7);
const head = svg.slice(0, svg.indexOf('<defs>')).trimEnd();
const body = files
	.map((f, k) => {
		const ids = layers[k].ids.map((i) => paths[i]).join('');
		return (
			`${head}\n` +
			`\t<defs><mask id="lm${uid}${k}" maskUnits="userSpaceOnUse" x="0" y="0" width="${vw}" height="${vh}">\n` +
			`\t\t${groupOpen}${ids}</g>\n\t</mask></defs>\n` +
			`\t<image href="/images/${f.file}" x="0" y="0" width="${vw}" height="${vh}"\n` +
			`\t       preserveAspectRatio="xMidYMid slice" mask="url(#lm${uid}${k})"/>\n</svg>`
		);
	})
	.join('\n');

writeFileSync(
	svgPath,
	`<!-- ${layers.length} stacked layers, drawn as siblings and overlaid by DrawOn.\n` +
		`     Each mask uncovers only its own layer's bitmap, so a stroke can never reveal a line\n` +
		`     belonging to something else. The single-mask version could not avoid that: its strokes\n` +
		`     are 5.8-24 units wide over lines of 3-5, so every stroke also uncovered whatever it\n` +
		`     crossed, and no draw order can undo that. The layers are the original artwork cut up,\n` +
		`     not redrawn — their union is ${basename(artPath)} exactly. Regenerate with layerize.mjs;\n` +
		`     it will refuse to run on this file, so start from the single-mask original. -->\n${body}\n`
);
console.log(`  -> ${basename(svgPath)} rewritten as ${layers.length} stacked <svg> layers`);
