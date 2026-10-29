// Generates the Werkwijze card 1 test image in two background colours.
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const fs = require('fs');
const path = require('path');
const OUT = __dirname;
const MOCK = 'C:/Users/jaywe/Downloads/Wat kun je verwachten_.png';

const SCENE = process.argv[2];
const prompt = (hex) => `Create a single full-bleed background image for a website card. Portrait, 9:16.

STYLE: match the reference image exactly: soft watercolour wash with visible paper grain and gentle pigment blooms, fine hand-drawn gold line art (thin, elegant, slightly metallic), small glowing points of warm light, sage-green watercolour leaves. Calm, spiritual, healing, premium.

BACKGROUND COLOUR: the whole image is built on the solid colour ${hex}. The watercolour texture varies only subtly around ${hex} (no more than a few percent lighter or darker), so cream text placed on it stays readable. Do not shift the hue: no yellow, no grey-blue, no teal. The top of the image must be exactly this colour family.

COMPOSITION:
- Top 55% of the image: ONLY calm watercolour texture in ${hex}. No figures, no lines, no leaves, no light points. This area holds a heading and a paragraph of text added later in code.
- Bottom 45%: the illustration from the reference: ${SCENE}
- The illustration fades softly upward into the texture. No hard edge, no horizon line, no frame, no border, no vignette, no drop shadow, no rounded corners. The image runs to all four edges.

NEVER: no text, no letters, no words, no logos, no watermark.`;

async function run(hex, name, ref) {
	const body = {
		contents: [{ parts: [
			{ text: prompt(hex) },
			{ inline_data: { mime_type: 'image/png', data: ref } }
		] }],
		generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '9:16', imageSize: '2K' } }
	};
	const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent', {
		method: 'POST',
		headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
		body: JSON.stringify(body)
	});
	const json = await res.json();
	if (!res.ok) throw new Error(`${name}: ${res.status} ${JSON.stringify(json.error ?? json).slice(0, 400)}`);
	const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
	if (!part) throw new Error(`${name}: no image. ${JSON.stringify(json).slice(0, 400)}`);
	const buf = Buffer.from((part.inlineData ?? part.inline_data).data, 'base64');
	const file = path.join(OUT, `${name}.png`);
	fs.writeFileSync(file, buf);
	const m = await sharp(buf).metadata();
	console.log(name, `${m.width}x${m.height}`, file);
}

(async () => {
	const [card, left] = process.argv.slice(3);
	const ref = (await sharp(MOCK).extract({ left: +left, top: 470, width: 500, height: 345 }).png().toBuffer()).toString('base64');
	const results = await Promise.allSettled([
		run('#627454', card + '-site-green-627454', ref),
		run('#686954', card + '-sage-A-686954', ref)
	]);
	for (const r of results) if (r.status === 'rejected') console.error(r.reason.message);
})();
