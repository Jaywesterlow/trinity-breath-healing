/**
 * behandelingen-edges.spec.ts — no card on the Behandelingen fan
 * (src/lib/components/global/Behandelingen.svelte) is ever hard-cut, on any
 * width: not by the screen's edge and not by the fan box's own clip.
 *
 * The owner's rule, 2026-09-17: a card must never be seen appearing or
 * disappearing at the edges, and nothing may be hard-cut — every edge is a
 * fade. Two things enforce it in the component: the ring is fourteen slots
 * (two laps of the seven services, see RING_LAPS), so the recycle happens
 * far below the box and behind the fade on every geometry; and the edge
 * fade exists on every width, its inner edge `min(cap, 50vw - edge)` with
 * the cap, edge, ramp and lean retuned per breakpoint. Both were derived by
 * measuring, and both are the kind of thing a later retune of the fan's
 * radius, angle, card size or box height silently breaks — which is what
 * happened the first time, when the fade only existed from 1536px up and
 * every phone, tablet and laptop cut the outer cards off at the viewport.
 *
 * So this asserts the visible result, not the mechanism: drive the fan by
 * drag through two full recycles at one width per geometry branch (390 and
 * 820 on the phone/tablet numbers, 1024 and 1440 on the 14deg desktop
 * numbers, 2560 on the 8deg ultra-wide ones), and at every other frame
 * decode a screenshot of the fan box and check that the viewport's two
 * outermost columns on each side and the box's top and bottom rows are the
 * section's sand and nothing else. A card pixel on any of those lines is a
 * card being cut by that edge at non-zero opacity — exactly what the fade's
 * solid part is there to prevent. The note and the controls sit inside the
 * box's empty bottom buffer, so they are hidden for the duration; the box is
 * transparent, and they are the only non-fan things it overlaps.
 *
 * The PNG is decoded here with node:zlib rather than a library: the repo
 * declares no image library as a dependency, and the decoder needed is
 * forty lines (8-bit RGB/RGBA, non-interlaced, the five standard filters —
 * everything Chromium's screenshot writer emits).
 */
import { test, expect } from '@playwright/test';
import { inflateSync } from 'node:zlib';

const WIDTHS: { width: number; height: number; why: string }[] = [
	{ width: 390, height: 844, why: 'phone: the screen cuts slot ±1' },
	{ width: 820, height: 1180, why: 'tablet: slot ±3 on screen, cut by the box before' },
	{ width: 1024, height: 1366, why: '14deg desktop geometry at its narrowest: slot ±1 cut' },
	{ width: 1440, height: 900, why: '14deg desktop geometry: slot ±2 cut by the screen' },
	{ width: 2560, height: 1440, why: '8deg geometry with slot ±3 on screen' }
];

const FAN = '.treatments__fan';
const PIVOT = '.treatments__pivot';
const DRAG_STEP_PX = 12; // per pointer move — small enough that a recycle frame is not skipped over
const MAX_MOVES = 200;
const RECYCLES_WANTED = 2;
// Sum of |dR| + |dG| + |dB| a sample may differ from the sand by. Antialiasing
// of a card edge at a few percent opacity is well above this; PNG is lossless.
const SAND_TOLERANCE = 6;

interface Rgb {
	width: number;
	height: number;
	channels: number;
	data: Uint8Array;
}

function decodePng(png: Buffer): Rgb {
	let pos = 8; // signature
	let width = 0;
	let height = 0;
	let colorType = 0;
	const idat: Buffer[] = [];
	while (pos < png.length) {
		const len = png.readUInt32BE(pos);
		const type = png.toString('ascii', pos + 4, pos + 8);
		const body = png.subarray(pos + 8, pos + 8 + len);
		if (type === 'IHDR') {
			width = body.readUInt32BE(0);
			height = body.readUInt32BE(4);
			const bitDepth = body[8];
			colorType = body[9]!;
			const interlace = body[12];
			if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6) || interlace !== 0) {
				throw new Error(
					`unsupported PNG: depth ${bitDepth} colour ${colorType} interlace ${interlace}`
				);
			}
		} else if (type === 'IDAT') {
			idat.push(body);
		} else if (type === 'IEND') {
			break;
		}
		pos += 12 + len;
	}
	const channels = colorType === 6 ? 4 : 3;
	const stride = width * channels;
	const raw = inflateSync(Buffer.concat(idat));
	const data = new Uint8Array(stride * height);
	for (let y = 0; y < height; y++) {
		const filter = raw[y * (stride + 1)]!;
		const inOff = y * (stride + 1) + 1;
		const outOff = y * stride;
		for (let i = 0; i < stride; i++) {
			const x = raw[inOff + i]!;
			const a = i >= channels ? data[outOff + i - channels]! : 0;
			const b = y > 0 ? data[outOff - stride + i]! : 0;
			const c = y > 0 && i >= channels ? data[outOff - stride + i - channels]! : 0;
			let v: number;
			switch (filter) {
				case 0:
					v = x;
					break;
				case 1:
					v = x + a;
					break;
				case 2:
					v = x + b;
					break;
				case 3:
					v = x + ((a + b) >> 1);
					break;
				case 4: {
					const p = a + b - c;
					const pa = Math.abs(p - a);
					const pb = Math.abs(p - b);
					const pc = Math.abs(p - c);
					v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
					break;
				}
				default:
					throw new Error(`unsupported PNG filter ${filter}`);
			}
			data[outOff + i] = v & 0xff;
		}
	}
	return { width, height, channels, data };
}

function pixel(img: Rgb, x: number, y: number): [number, number, number] {
	const k = (y * img.width + x) * img.channels;
	return [img.data[k]!, img.data[k + 1]!, img.data[k + 2]!];
}

for (const { width, height, why } of WIDTHS) {
	test.describe(`${width}x${height} (${why})`, () => {
		// Reduced motion keeps the idle drift and the release coast off so the
		// frames come only from the drag (the drag path itself is the same either
		// way: every gesture already runs with the CSS transition off, see
		// .treatments__pivot--motion in the component), and it keeps the site's
		// own cursor (CursorTooltip.svelte, which does not render under that
		// preference) off the sampled columns — at 1440 the pointer reaches x=0
		// exactly one move before the second recycle. contextOptions, not a bare
		// `reducedMotion` key: only the former is a test option, the latter is
		// silently ignored.
		test.use({ viewport: { width, height }, contextOptions: { reducedMotion: 'reduce' } });

		test('dragging through two recycles never puts a card pixel on the screen edge or the box edge', async ({
			page
		}) => {
			await page.goto('/');
			await page.locator(FAN).scrollIntoViewIfNeeded();
			await page.evaluate(() => document.fonts.ready);
			await page.waitForTimeout(300);

			await page.evaluate(() => {
				for (const sel of ['.note', '.treatments__controls']) {
					const el = document.querySelector<HTMLElement>(sel);
					if (el) el.style.visibility = 'hidden';
				}
			});

			const { fan, sand, ring } = await page.evaluate(() => {
				const fanEl = document.querySelector('.treatments__fan')!;
				const r = fanEl.getBoundingClientRect();
				const bg = getComputedStyle(document.querySelector('.treatments')!).backgroundColor;
				const sandRgb = bg.match(/\d+/g)!.slice(0, 3).map(Number);
				return {
					fan: { top: r.top, height: r.height, width: r.width },
					sand: sandRgb as [number, number, number],
					ring: document.querySelectorAll('.treatments__pivot').length
				};
			});
			// The clip below is the box's own edges only if the box is inside the viewport.
			expect(fan.top, 'fan box top inside the viewport').toBeGreaterThanOrEqual(0);
			expect(fan.top + fan.height, 'fan box bottom inside the viewport').toBeLessThanOrEqual(
				height
			);
			expect(Math.round(fan.width), 'fan box is full-bleed').toBe(width);

			const clip = { x: 0, y: Math.round(fan.top), width, height: Math.round(fan.height) };
			const isSand = (p: [number, number, number]) =>
				Math.abs(p[0] - sand[0]) + Math.abs(p[1] - sand[1]) + Math.abs(p[2] - sand[2]) <=
				SAND_TOLERANCE;

			const positions = () =>
				page.$$eval(PIVOT, (els) =>
					els.map((el) => Number(getComputedStyle(el).getPropertyValue('--pos')))
				);

			const x0 = width / 2;
			const y = fan.top + fan.height / 2; // inside the centre card's drag band on every geometry
			await page.mouse.move(x0, y);
			await page.mouse.down();

			const failures: string[] = [];
			let recycles = 0;
			let frames = 0;
			let prev = await positions();
			for (let i = 1; i <= MAX_MOVES && recycles < RECYCLES_WANTED; i++) {
				await page.mouse.move(x0 - i * DRAG_STEP_PX, y, { steps: 1 });
				await page.waitForTimeout(25);
				const cur = await positions();
				// A recycle moves one pivot by the ring size in a single frame; a real
				// per-frame move is a fraction of a slot (see unwrap() in the momentum spec).
				const recycled = cur.some((v, k) => Math.abs(v - prev[k]!) > ring / 2);
				if (recycled) recycles++;
				prev = cur;
				if (i % 2 && !recycled) continue;

				frames++;
				const img = decodePng(await page.screenshot({ clip }));
				const hits: string[] = [];
				for (let yy = 0; yy < img.height; yy++) {
					for (const x of [0, 1, width - 2, width - 1]) {
						if (!isSand(pixel(img, x, yy))) hits.push(`column x${x} y${yy}`);
					}
				}
				for (const yy of [0, img.height - 1]) {
					for (let x = 0; x < img.width; x++) {
						if (!isSand(pixel(img, x, yy))) hits.push(`${yy === 0 ? 'top' : 'bottom'} row x${x}`);
					}
				}
				if (hits.length) {
					failures.push(
						`move ${i} (${i * DRAG_STEP_PX}px${recycled ? ', recycle' : ''}): ${hits.length} non-sand samples, e.g. ${hits.slice(0, 4).join(', ')}`
					);
				}
			}
			await page.mouse.up();

			expect(recycles, 'the drag must run through two recycles').toBe(RECYCLES_WANTED);
			expect(frames, 'frames actually sampled').toBeGreaterThan(5);
			expect(failures, failures.join('\n')).toEqual([]);
		});
	});
}
