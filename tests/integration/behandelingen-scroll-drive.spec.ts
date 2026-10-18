/**
 * behandelingen-scroll-drive.spec.ts — the Behandelingen fan turns with the
 * page's scroll (2026-10-18). It used to drift on its own after an idle delay;
 * PR #29's stepped version (one card per 280px through the button spring) was
 * rejected in favour of a continuous drive that brakes smoothly to rest.
 *
 * Covers: (i) nothing moves on its own; (ii) a SCROLL_PX_PER_STEP of scroll
 * down turns the fan one card in next()'s direction, and back up turns it back;
 * (iii) no snap: half of that leaves it half a card on, and it stays there;
 * (iv) it eases to rest after the scroll stops rather than stopping dead; (v)
 * the spacing invariant holds; (vi) reduced motion turns the drive off.
 *
 * Measured on one pivot (the card centred at the start), by DOM index: its
 * --pos goes 0 → -1 as one card of Volgende passes. STEP_PX mirrors
 * SCROLL_PX_PER_STEP in Behandelingen.svelte.
 */
import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

const STEP_PX = 400; // SCROLL_PX_PER_STEP
const SETTLE_MS = 900; // SCROLL_TAU_MS 100 plus Lenis's glide, with room

async function centreIndex(page: Page): Promise<number> {
	return page.evaluate(() => {
		let index = -1;
		let best = Infinity;
		document.querySelectorAll('.treatments__pivot').forEach((el, i) => {
			const p = Math.abs(Number(getComputedStyle(el).getPropertyValue('--pos')));
			if (p < best) {
				best = p;
				index = i;
			}
		});
		return index;
	});
}

async function posOf(page: Page, index: number): Promise<number> {
	return page.evaluate(
		(i) =>
			Number(
				getComputedStyle(document.querySelectorAll('.treatments__pivot')[i]!).getPropertyValue(
					'--pos'
				)
			),
		index
	);
}

async function spacingInvariantHolds(page: Page): Promise<boolean> {
	return page.evaluate(() => {
		const pos = Array.from(document.querySelectorAll('.treatments__pivot')).map((el) =>
			Number(getComputedStyle(el).getPropertyValue('--pos'))
		);
		const sorted = [...pos].sort((a, b) => a - b);
		let maxErr = 0;
		for (let i = 1; i < sorted.length; i++) {
			maxErr = Math.max(maxErr, Math.abs(sorted[i]! - sorted[i - 1]! - 1));
		}
		return maxErr < 1e-4;
	});
}

/** Puts the fan in the middle of the screen in one jump (which the drive
 *  ignores) and lets everything settle. */
async function openOnFan(page: Page) {
	await page.goto('/');
	await page.evaluate(() => {
		const fan = document.querySelector('.treatments__fan')!.getBoundingClientRect();
		window.scrollTo(0, window.scrollY + fan.top + fan.height / 2 - window.innerHeight / 2);
	});
	await page.waitForTimeout(SETTLE_MS);
}

/** Scrolls by `dy` in small steps, the way a hand on a trackpad does. */
async function scrollBy(page: Page, dy: number) {
	const step = 20 * Math.sign(dy);
	for (let done = 0; Math.abs(done) < Math.abs(dy); done += step) {
		await page.evaluate((s) => window.scrollBy(0, s), step);
		await page.waitForTimeout(16);
	}
}

test('nothing moves on its own', async ({ page }) => {
	await openOnFan(page);
	const i = await centreIndex(page);
	const a = await posOf(page, i);
	await page.waitForTimeout(3000);
	expect(await posOf(page, i), 'no idle drift').toBe(a);
});

test("a step of scroll turns the fan one card in next()'s direction, and back turns it back", async ({
	page
}) => {
	await openOnFan(page);
	const i = await centreIndex(page);
	expect(await posOf(page, i)).toBe(0);

	await scrollBy(page, STEP_PX);
	await page.waitForTimeout(SETTLE_MS);
	expect(await posOf(page, i)).toBeCloseTo(-1, 1);
	expect(await spacingInvariantHolds(page)).toBe(true);

	await scrollBy(page, -STEP_PX);
	await page.waitForTimeout(SETTLE_MS);
	expect(await posOf(page, i)).toBeCloseTo(0, 1);
	expect(await spacingInvariantHolds(page)).toBe(true);
});

test('no snap: half a step of scroll leaves the fan half a card on', async ({ page }) => {
	await openOnFan(page);
	const i = await centreIndex(page);
	await scrollBy(page, STEP_PX / 2);
	await page.waitForTimeout(SETTLE_MS);
	const rest = await posOf(page, i);
	expect(rest).toBeCloseTo(-0.5, 1);
	await page.waitForTimeout(1500);
	expect(await posOf(page, i), 'it stays where it came to rest').toBe(rest);
});

test('it brakes to rest after the scroll stops, not dead', async ({ page }) => {
	await openOnFan(page);
	const i = await centreIndex(page);
	await scrollBy(page, STEP_PX / 2);
	// Sample the first frames after the last scroll: still moving, and slowing.
	const samples = await page.evaluate(async (idx) => {
		const el = document.querySelectorAll('.treatments__pivot')[idx]!;
		const out: number[] = [];
		for (let f = 0; f < 12; f++) {
			await new Promise((r) => requestAnimationFrame(r));
			out.push(Number(getComputedStyle(el).getPropertyValue('--pos')));
		}
		return out;
	}, i);
	const steps = samples.slice(1).map((p, k) => Math.abs(p - samples[k]!));
	expect(steps[0], 'still moving the frame after the scroll ended').toBeGreaterThan(0);
	const early = steps.slice(0, 3).reduce((a, b) => a + b, 0);
	const late = steps.slice(-3).reduce((a, b) => a + b, 0);
	expect(late, 'slower at the end than at the start').toBeLessThan(early);
});

test('prefers-reduced-motion: reduce → the scroll does not turn the fan', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await openOnFan(page);
	const i = await centreIndex(page);
	await scrollBy(page, STEP_PX);
	await page.waitForTimeout(SETTLE_MS);
	expect(await posOf(page, i)).toBe(0);
});
