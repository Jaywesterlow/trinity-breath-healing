/**
 * Generate static/og-default.jpg — the link preview card.
 *
 * Re-run if the logo or the wordmark copy changes:
 *   node scripts/make-og-image.mjs
 *
 * Why this exists at all: without an og:image the site renders as a bare grey
 * box wherever the link is pasted — WhatsApp, Instagram DM, LinkedIn, Slack —
 * and for a practice whose existing audience arrives from Instagram, that is
 * the first impression. Head.svelte has always pointed at /og-default.jpg; the
 * file simply was not there, so every share 404'd.
 *
 * Composed here rather than exported from Figma so it stays in sync with the
 * real logo and the real design tokens, and so it can be regenerated from a
 * clean checkout without a design tool.
 */
import { readFileSync } from 'fs';
import sharp from 'sharp';

/* Design tokens, copied from src/app.css. Not imported: this runs in plain
   Node with no CSS pipeline, and three hex values are cheaper than one. */
const GOLD = '#C19E22';
const SAND = '#faf0e6';
const FOREST = '#3d4a35';
const MUTED = '#5f6d56';

/* Facebook, LinkedIn, WhatsApp and X all crop toward 1.91:1. 1200x630 is the
   size every one of them documents, so it is the one that never gets cropped. */
const W = 1200;
const H = 630;

/* Same measured bounding box as scripts/make-favicon.mjs — the logo file's own
   viewBox has a lot of empty margin, so centring on the raw viewBox would put
   the mark noticeably off-centre. */
const INK = { x: 269, y: 286.4, w: 3552.8, h: 2850.3 };

const logoPath = readFileSync('static/trinity-logo.svg', 'utf8').match(/\bd="([^"]+)"/)[1];

/* Fonts are embedded as base64 because librsvg (inside sharp) resolves
   @font-face against the filesystem, not the web, and silently falls back to a
   default sans if it cannot find the family. A silent fallback here would ship
   a preview card in the wrong typeface to every share. */
const embed = (file) => `data:font/woff2;base64,${readFileSync(file).toString('base64')}`;
const cinzel = embed('static/fonts/cinzel/cinzel-400.woff2');
const body = embed('static/fonts/dm-sans/dm-sans-regular.woff2');

const LOGO_H = 210;
const logoScale = LOGO_H / INK.h;
const logoW = INK.w * logoScale;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>
      @font-face { font-family: 'Cinzel'; src: url('${cinzel}') format('woff2'); }
      @font-face { font-family: 'DM Sans'; src: url('${body}') format('woff2'); }
      .wordmark { font-family: 'Cinzel', Georgia, serif; fill: ${FOREST}; letter-spacing: 6px; }
      .tag { font-family: 'DM Sans', Helvetica, sans-serif; fill: ${MUTED}; letter-spacing: 1.5px; }
    </style>
  </defs>

  <rect width="${W}" height="${H}" fill="${SAND}"/>

  <!-- Hairline frame, inset. Gives the card an edge on the white/dark chat
       bubbles it gets dropped into, where a plain sand rectangle bleeds out. -->
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none"
        stroke="${GOLD}" stroke-opacity="0.45" stroke-width="2"/>

  <g transform="translate(${(W - logoW) / 2} 128) scale(${logoScale}) translate(${-INK.x} ${-INK.y})">
    <path fill="${GOLD}" fill-rule="evenodd" d="${logoPath}"/>
  </g>

  <text class="wordmark" x="${W / 2}" y="428" text-anchor="middle" font-size="60">TRINITY</text>
  <text class="tag" x="${W / 2}" y="478" text-anchor="middle" font-size="24">BREATH &amp; HEALING</text>

  <line x1="${W / 2 - 60}" y1="514" x2="${W / 2 + 60}" y2="514" stroke="${GOLD}" stroke-width="1.5"/>

  <text class="tag" x="${W / 2}" y="558" text-anchor="middle" font-size="22" fill="${FOREST}">
    Ademwerk en energetische behandelingen
  </text>
</svg>`;

/* JPEG, not PNG: Head.svelte references .jpg, WhatsApp caps previews around
   300kB, and this is a flat-colour card that JPEG handles at a fraction of the
   size. mozjpeg at 88 keeps the gold edges clean. */
await sharp(Buffer.from(svg))
	.jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' })
	.toFile('static/og-default.jpg');

console.log('Wrote static/og-default.jpg');
