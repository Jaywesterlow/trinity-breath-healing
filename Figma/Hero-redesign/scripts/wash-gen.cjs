// Watercolour wash to sit under the hero text (replaces the radial scrim).
// Generated on white paper; used with Multiply so the white vanishes.
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const fs = require('fs');
const path = require('path');
const D = __dirname;

const base = `A single soft watercolour wash on pure white paper, painted wet-on-wet with a large soft brush, in one neutral warm grey pigment.

SHAPE: one irregular, organic, horizontally loose cloud of wash, like a soft breath of mist. Fuller and denser in the middle, with gentle wet-in-wet blooms and soft granulation inside. Towards the outside it thins out gradually and dissolves into the white paper over a long distance, with feathered, irregular, fading edges.

EDGES (most important): absolutely NO hard edge, no dark rim, no outline, no cauliflower back-runs at the border, no pigment line where the wash stops. The wash must fade out so gradually that there is no point where you can see it end.

MARGIN: the wash stays inside the centre of the image; at least the outer 12% on every side is untouched pure white paper.

NEVER: no colour other than neutral grey, no text, no objects, no shapes, no frame, no border, no vignette, no straight lines, no paper texture on the white areas, no shadows.`;

const jobs = {
	'wash-wide': ['4:3', base + '\n\nThe wash is wider than tall, a soft horizontal oval cloud.'],
	'wash-tall': ['3:4', base + '\n\nThe wash is slightly taller than wide, a soft rounded cloud.']
};

async function run(name, ratio, prompt) {
	const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent', {
		method: 'POST',
		headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
		body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: ratio, imageSize: '2K' } } })
	});
	const json = await res.json();
	if (!res.ok) throw new Error(`${name}: ${res.status} ${JSON.stringify(json.error ?? json).slice(0, 300)}`);
	const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
	if (!part) throw new Error(`${name}: no image`);
	const buf = Buffer.from((part.inlineData ?? part.inline_data).data, 'base64');
	fs.writeFileSync(path.join(D, name + '-raw.png'), buf);
	const m = await sharp(buf).metadata();
	console.log(name, `${m.width}x${m.height}`);
}

(async () => {
	const r = await Promise.allSettled(Object.entries(jobs).map(([n, [ratio, p]]) => run(n, ratio, p)));
	r.forEach((x) => x.status === 'rejected' && console.error(x.reason.message));
})();
