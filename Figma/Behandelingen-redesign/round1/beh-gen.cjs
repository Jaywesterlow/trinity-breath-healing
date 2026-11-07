// Behandelingen ×7, round 1: full-card images in the Werkwijze style.
// Two references each: the style (approved Werkwijze card 1) and the subject (the current,
// owner-approved line drawing for that treatment). Card is 282:459; 9:16 is generated and
// cropped by object-fit. The drawing sits in the upper part, the bottom stays calm for the
// name and the teaser.
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const fs = require('fs');
const path = require('path');
const D = __dirname;
const REPO = 'P:/AI/trinity-breath-healing/';
const STYLE = REPO + 'Figma/Werkwijze-redesign/card1-627454.png';

const SERVICES = {
	'mahatma-healing': 'Mahatma Healing: powerful harmonising energy that dissolves blockages and cleanses the energy system.',
	goldhealing: 'Goldhealing: golden light energy that transforms negativity and protects, working mainly on the psychic level.',
	'raster-energie': 'Raster Energie: restoring the divine blueprint, energetic imprints and blockages are cleansed.',
	'cranio-fascia-unwinding': 'Cranio & Fascia Unwinding: gentle bodywork where the body sets its own pace and releases stored tension.',
	'spinal-touch': 'Spinal Touch: a gentle method along the spine that lets the central nervous system flow again.',
	'brtt-body': 'BRTT Body: a body-oriented process that frees stored trauma through the psoas, the muscle of the soul.',
	'trb-breathwork': 'Trauma Release Breathwork: seven breathing techniques that open the door to the subconscious and release old charge.'
};

const prompt = (what) => `Create a single full-bleed background image for a website card. Portrait, 9:16.

TWO REFERENCES:
1. The first image sets the STYLE exactly: soft watercolour wash with visible paper grain and gentle pigment blooms on the deep sage green #627454, fine hand-drawn gold line art (thin, elegant, warm, softly luminous), a soft warm cream glow behind the drawing, small sage-green watercolour leaves, a few tiny points of warm light. Calm, spiritual, healing, premium.
2. The second image sets the SUBJECT: keep its figure, pose and composition, redrawn in the style of the first image. It illustrates ${what}

COMPOSITION:
- The drawing sits in the UPPER part of the card: from about 8% to 58% of the height, centred, the whole subject inside the centre 80% of the width.
- From 62% of the height to the bottom: ONLY calm watercolour texture in #627454, no lines, no leaves, no light points. A title and a short text go there, added later in code.
- The glow and the drawing fade softly into the texture. No hard edge, no horizon line, no frame, no border, no vignette, no rounded corners. The image runs to all four edges.

BACKGROUND: the texture varies only subtly around #627454, a few percent lighter or darker at most. Do not shift the hue: no yellow, no grey-blue, no teal.

NEVER: no text, no letters, no words, no logos, no watermark.`;

async function run(slug) {
	const style = (await sharp(STYLE).resize(900).png().toBuffer()).toString('base64');
	const svg = fs.readFileSync(REPO + 'static/images/card-' + slug + '.svg');
	const subject = (await sharp(svg, { density: 200 }).resize(1000, 1000, { fit: 'inside' }).flatten({ background: '#faf0e6' }).png().toBuffer()).toString('base64');
	const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent', {
		method: 'POST',
		headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
		body: JSON.stringify({
			contents: [{ parts: [{ text: prompt(SERVICES[slug]) }, { inline_data: { mime_type: 'image/png', data: style } }, { inline_data: { mime_type: 'image/png', data: subject } }] }],
			generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '9:16', imageSize: '2K' } }
		})
	});
	const json = await res.json();
	if (!res.ok) throw new Error(`${slug}: ${res.status} ${JSON.stringify(json.error ?? json).slice(0, 300)}`);
	const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
	if (!part) throw new Error(`${slug}: no image`);
	const buf = Buffer.from((part.inlineData ?? part.inline_data).data, 'base64');
	fs.writeFileSync(path.join(D, 'beh-' + slug + '.png'), buf);
	console.log(slug, 'ok');
}

(async () => {
	const slugs = process.argv[2] ? process.argv[2].split(',') : Object.keys(SERVICES);
	const r = await Promise.allSettled(slugs.map(run));
	r.forEach((x) => x.status === 'rejected' && console.error(x.reason.message));
	// contact sheet, 282:459 crops as the card shows them
	const tiles = [];
	for (const s of slugs) {
		const f = path.join(D, 'beh-' + s + '.png');
		if (!fs.existsSync(f)) continue;
		tiles.push(await sharp(f).resize(282 * 1.2, 459 * 1.2, { fit: 'cover', position: 'centre' }).png().toBuffer());
	}
	const w = 338, h = 551, gap = 12;
	await sharp({ create: { width: tiles.length * (w + gap) + gap, height: h + 2 * gap, channels: 3, background: '#faf0e6' } })
		.composite(tiles.map((t, i) => ({ input: t, left: gap + i * (w + gap), top: gap })))
		.png().toFile(path.join(D, 'beh-sheet.png'));
})();
