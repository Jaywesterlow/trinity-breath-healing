/**
 * Generate the favicon set from static/trinity-logo.svg.
 * Re-run if the logo changes: node mkicon.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import sharp from 'sharp';

const GOLD = '#C19E22';
const SAND = '#faf0e6'; // --color-bg-sand
// Measured with getBBox, not guessed from the path's control points.
const INK = { x: 269, y: 286.4, w: 3552.8, h: 2850.3 };
// Square box centred on the ink, with breathing room. A favicon is rendered at 16px, so the
// mark needs to fill most of the tile — but not touch the edges, or it looks cropped in the
// rounded tiles iOS and Android apply.
const PAD = 0.07;
const side = Math.max(INK.w, INK.h) * (1 + PAD * 2);
const cx = INK.x + INK.w / 2;
const cy = INK.y + INK.h / 2;
const vb = [cx - side / 2, cy - side / 2, side, side].map((n) => +n.toFixed(1));

const d = readFileSync('static/trinity-logo.svg', 'utf8').match(/\bd="([^"]+)"/)[1];
const square = (bg) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" width="512" height="512">` +
	(bg ? `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="${bg}"/>` : '') +
	`<path fill="${GOLD}" fill-rule="evenodd" d="${d}"/></svg>`;

// The SVG favicon is the primary icon: transparent, so it sits on whatever the browser's tab
// strip uses, and sharp at any size. Gold reads on both light and dark chrome.
writeFileSync(
	'static/favicon.svg',
	`<!-- Generated from trinity-logo.svg by scripts/make-favicon.mjs — do not hand-edit.\n` +
		`     Square viewBox centred on the mark's measured bounding box. -->\n` +
		square(null).replace(' width="512" height="512"', '')
);

const png = (size, bg) =>
	sharp(Buffer.from(square(bg))).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

// Raster fallbacks. apple-touch-icon gets the sand background on purpose: iOS composites a
// transparent icon onto black, which would leave the gold mark on a black tile.
writeFileSync('static/apple-touch-icon.png', await png(180, SAND));
writeFileSync('static/favicon-96x96.png', await png(96, null));

// favicon.ico, for the clients that request it blindly regardless of <link rel="icon">.
// ICO has allowed an embedded PNG since Vista, so this is a 22-byte header around one.
const ico32 = await png(32, null);
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // one image
header.writeUInt8(32, 6); // width
header.writeUInt8(32, 7); // height
header.writeUInt8(0, 8); // palette size (0 = truecolour)
header.writeUInt8(0, 9); // reserved
header.writeUInt16LE(1, 10); // colour planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(ico32.length, 14);
header.writeUInt32LE(22, 18); // offset of the image data
writeFileSync('static/favicon.ico', Buffer.concat([header, ico32]));

console.log('viewBox', vb.join(' '));
for (const f of ['favicon.svg', 'favicon.ico', 'favicon-96x96.png', 'apple-touch-icon.png'])
	console.log(`  static/${f}`, readFileSync(`static/${f}`).length, 'bytes');
