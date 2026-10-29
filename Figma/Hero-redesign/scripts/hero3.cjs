// Hero, round 3: two images that overflow on the narrower screen of their range.
// Portrait 3:4: phones crop the sides, tablets show it full width.
// Landscape 21:9: 16:9 screens crop the sides, ultrawide shows it full width.
const sharp = require('P:/AI/trinity-breath-healing/node_modules/sharp');
const fs = require('fs');
const path = require('path');
const D = __dirname;

const style = `STYLE: match the reference image exactly: the same graceful tree with a twisting trunk, wind-swept branches and a soft cloud-like watercolour canopy outlined in fine gold, the same winding river drawn in fine gold and cream lines with a soft warm glow, soft layered green hills, stones and grasses at the roots. Soft watercolour wash with visible paper grain on the deep sage green #627454: sky, hills and land are washes in that green family, only slightly lighter or darker. The watercolour texture is even across the whole image: the calm areas have the same paper grain and soft wash variation as everywhere else, not flat colour.

GOLD: the line art must be exactly as vibrant as in the reference: bright, luminous, warm gold lines that catch the light, with a soft golden glow around the trunk, the canopy outline and the river. The river shines with warm golden light. Do not make the lines dull, brown, copper or muted.

The only thing to leave out from the reference: the small round glowing points of light on the trunk. No glowing dots, orbs, sparkles or fireflies anywhere. Everything else keeps its glow.

NEVER: no text, no letters, no logos, no watermark, no people, no animals, no buildings, no frame, no border, no vignette, no hard horizon line, no straight lines, no rectangular areas.`;

const jobs = {
	'hero3-portrait': ['3:4', 'hero-a-final.png', `Portrait website hero background, 3:4, full bleed. On phones only the centre 70% of the width is visible; on tablets the full width.

COMPOSITION (strict):
- The whole tree, canopy included, fits inside the CENTRE 64% of the width (from 18% to 82%). The trunk at 50% of the width.
- The canopy spans from about 9% to 30% of the height; the base of the tree at about 42% of the height. Top 8%: calm sky.
- Left of 18% and right of 82% of the width: calm watercolour sky and soft low hills only, continuing the landscape naturally, no branches.
- The river starts at the base of the tree, winds a short way towards the viewer and fades away completely by 56% of the height: its gold lines thin out and dissolve into the watercolour.
- From 56% of the height to the bottom: only calm green watercolour wash with paper grain, across the full width. A heading, a paragraph and a button go there.

${style}`],
	'hero3-landscape': ['21:9', 'hero-a-final.png', `Landscape website hero background, 21:9, full bleed. On ultrawide screens the full width is visible; on regular 16:9 screens only the centre 76% of the width (from 12% to 88%).

COMPOSITION (strict):
- The tree: trunk at 66% of the width, the canopy spanning from 54% to 79% of the width and from 12% to 42% of the height; the base of the tree at about 70% of the height. The tree is moderate in size, not dominant.
- Everything left of 47% of the width, from the top down to 66% of the height: ONLY calm watercolour sky and faint low hills, no lines, no branches, no river. A heading and paragraph go there.
- Right of 81% of the width: calm sky and soft low hills only, no branches.
- The river starts at the base of the tree, winds towards the left and leaves the image through the BOTTOM edge at about 40% of the width, as one clear gold-lined stream.

${style}`]
};

async function run(name, ratio, refFile, prompt) {
	const ref = (await sharp(path.join(D, refFile)).resize(1400, 1400, { fit: 'inside' }).png().toBuffer()).toString('base64');
	const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent', {
		method: 'POST',
		headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
		body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/png', data: ref } }] }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: ratio, imageSize: '4K' } } })
	});
	const json = await res.json();
	if (!res.ok) throw new Error(`${name}: ${res.status} ${JSON.stringify(json.error ?? json).slice(0, 300)}`);
	const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
	if (!part) throw new Error(`${name}: no image`);
	const buf = Buffer.from((part.inlineData ?? part.inline_data).data, 'base64');
	fs.writeFileSync(path.join(D, name + '.png'), buf);
	const m = await sharp(buf).metadata();
	console.log(name, `${m.width}x${m.height}`);
}

(async () => {
	const r = await Promise.allSettled(Object.entries(jobs).map(([n, [ratio, ref, p]]) => run(n, ratio, ref, p)));
	r.forEach((x) => x.status === 'rejected' && console.error(x.reason.message));
	const a = await sharp(path.join(D, 'hero3-landscape.png')).resize(1100).png().toBuffer();
	const b = await sharp(path.join(D, 'hero3-portrait.png')).resize(null, 640).png().toBuffer();
	const am = await sharp(a).metadata(), bm = await sharp(b).metadata();
	await sharp({ create: { width: 1120 + bm.width, height: Math.max(am.height, 640), channels: 3, background: '#faf0e6' } })
		.composite([{ input: a, left: 0, top: 0 }, { input: b, left: 1120, top: 0 }]).png().toFile(path.join(D, 'hero3-compare.png'));
})();
