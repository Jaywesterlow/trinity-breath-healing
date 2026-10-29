// Site-wide watercolour paper texture: generate, make greyscale, lift to near-white, make it tile seamlessly.
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const fs = require('fs');
const path = require('path');
const D = __dirname;

const prompt = `A flat, top-down scan of a sheet of cold-press watercolour paper, square, filling the entire frame edge to edge.

The paper is white. On it, very faint, soft, pale grey watercolour washes: large irregular blooms with soft feathered edges, gentle cauliflower edges where water dried, subtle granulation, and the fine natural tooth of cold-press paper visible everywhere. Washes are spread evenly over the whole sheet, with no focal point, no centre, nothing in the corners that differs from the middle.

Completely neutral grey: no colour, no tint, no warm or cool cast. Very low contrast: the darkest wash is only slightly darker than the paper.

NEVER: no objects, no illustration, no text, no edges of the paper, no shadows, no vignette, no frame, no lighting gradient.`;

(async () => {
	let buf;
	const raw = path.join(D, 'paper-raw.png');
	if (fs.existsSync(raw)) buf = fs.readFileSync(raw);
	else {
		const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent', {
			method: 'POST',
			headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1', imageSize: '2K' } }
			})
		});
		const json = await res.json();
		if (!res.ok) throw new Error(res.status + ' ' + JSON.stringify(json.error ?? json).slice(0, 400));
		const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
		buf = Buffer.from((part.inlineData ?? part.inline_data).data, 'base64');
		fs.writeFileSync(raw, buf);
	}

	// Greyscale, then stretch so the lightest paper is pure white and the darkest wash sits at DEPTH.
	const DEPTH = +(process.argv[2] ?? 225); // 225/255 = at most ~12% darker before opacity
	const { data, info } = await sharp(buf).greyscale().resize(2048, 2048).raw().toBuffer({ resolveWithObject: true });
	const sorted = Uint8Array.from(data).sort();
	const lo = sorted[Math.floor(sorted.length * 0.005)], hi = sorted[Math.floor(sorted.length * 0.995)];
	const N = info.width;
	const A = new Float32Array(N * N);
	for (let i = 0; i < A.length; i++) A[i] = Math.max(0, Math.min(1, (data[i] - lo) / (hi - lo)));

	// Seamless: blend with a half-offset copy (whose own edges already wrap), using it near the borders.
	const out = Buffer.alloc(N * N);
	for (let y = 0; y < N; y++)
		for (let x = 0; x < N; x++) {
			const b = A[((y + N / 2) % N) * N + ((x + N / 2) % N)];
			const ex = Math.min(x, N - 1 - x) / (N / 2), ey = Math.min(y, N - 1 - y) / (N / 2);
			const ss = (t) => { t = Math.min(1, t / 0.6); return t * t * (3 - 2 * t); }; const w = ss(ex) * ss(ey);
			const v = A[y * N + x] * w + b * (1 - w);
			out[y * N + x] = Math.round(DEPTH + v * (255 - DEPTH));
		}
	const tile = sharp(out, { raw: { width: N, height: N, channels: 1 } });
	await tile.clone().png().toFile(path.join(D, 'paper-tile.png'));
	await tile.clone().webp({ quality: 80 }).toFile(path.join(D, 'paper-tile.webp'));
	// 2x2 preview of the tile multiplied onto the site cream, to check seams and the look.
	const cream = { r: 0xfa, g: 0xf0, b: 0xe6 };
	const t = await tile.clone().toColourspace('srgb').png().toBuffer();
	const big = await sharp({ create: { width: 4096, height: 4096, channels: 3, background: cream } })
		.composite([0, 1, 2, 3].map((i) => ({ input: t, left: (i % 2) * 2048, top: Math.floor(i / 2) * 2048, blend: 'multiply' })))
		.png().toBuffer();
	await sharp(big).resize(1000).png().toFile(path.join(D, 'paper-preview.png'));
	console.log('lo', lo, 'hi', hi, 'webp', fs.statSync(path.join(D, 'paper-tile.webp')).size, 'bytes');
})();
