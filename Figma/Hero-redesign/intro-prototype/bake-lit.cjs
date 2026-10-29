// Bakes the lights' line boost (feComponentTransfer, slopes x strength 2, in linearRGB as SVG
// filters work) into the lit images, so HeroLights draws them without a filter every frame.
// Run from the repo root: node Figma/Hero-redesign/intro-prototype/bake-lit.cjs <in> <out>
const sharp = require('sharp');
const [inp, out] = process.argv.slice(2);
const SLOPE = [0.9 * 2, 0.75 * 2, 0.5 * 2];
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
(async () => {
	const { data, info } = await sharp(inp).removeAlpha().raw().toBuffer({ resolveWithObject: true });
	for (let i = 0; i < data.length; i++) {
		const c = Math.min(1, SLOPE[i % 3] * toLin(data[i] / 255));
		data[i] = Math.round(toSrgb(c) * 255);
	}
	// quality 70: the size of the unbaked originals, mean error 0.4/255
	await sharp(data, { raw: info }).webp({ quality: 70 }).toFile(out);
})();
