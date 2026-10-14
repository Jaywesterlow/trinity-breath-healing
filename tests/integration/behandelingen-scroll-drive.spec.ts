/**
 * behandelingen-scroll-drive.spec.ts — the Behandelingen fan steps with the
 * page's scroll (2026-10-14; it used to drift on its own after an idle delay).
 *
 * Covers: (i) nothing moves on its own — no idle drift any more; (ii) less than
 * a step's worth of scroll turns nothing; (iii) a step's worth while the fan is
 * on screen turns it one card in next()'s direction, animated and landing on a
 * whole card, and the same scroll back turns it back; (iv) the spacing
 * invariant holds throughout; (v) reduced motion turns the drive off.
 *
 * STEP_PX mirrors SCROLL_DRIVE_PX_PER_STEP in Behandelingen.svelte.
 */
import { test, expect, type Page } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
test.use({ viewport: DESKTOP });

const STEP_PX = 280; // SCROLL_DRIVE_PX_PER_STEP
const SETTLE_MS = 1800; // the Prev/Next spring lands in ~1.2s (BUTTON_SPRING_OMEGA)

/** The pivot nearest the centre: its --pos and which card it is (DOM index). A
 *  whole card of scroll folds into the integer positions, so --pos alone cannot
 *  tell a turn from no turn; the index can. */
async function centre(page: Page): Promise<{ pos: number; index: number }> {
	return page.evaluate(() => {
		const els = document.querySelectorAll('.treatments__pivot');
		let best = 0;
		let index = -1;
		let bestDist = Infinity;
		els.forEach((el, i) => {
			const p = Number(getComputedStyle(el).getPropertyValue('--pos'));
			if (Math.abs(p) < bestDist) {
				bestDist = Math.abs(p);
				best = p;
				index = i;
			}
		});
		return { pos: best, index };
	});
}

/** DOM index of the card at --pos +1 (the one next() brings to the centre: --pos
 *  decreases, so the card at +1 lands on 0). */
async function centreIndexes(page: Page): Promise<{ next: number }> {
	return page.evaluate(() => {
		const els = document.querySelectorAll('.treatments__pivot');
		let next = -1;
		els.forEach((el, i) => {
			if (Math.abs(Number(getComputedStyle(el).getPropertyValue('--pos')) - 1) < 1e-3) next = i;
		});
		return { next };
	});
}

async function spacingInvariantHolds(page: Page): Promise<boolean> {
	return page.evaluate(() => {
		const els = document.querySelectorAll('.treatments__pivot');
		const pos = Array.from(els).map((el) => Number(getComputedStyle(el).getPropertyValue('--pos')));
		const sorted = [...pos].sort((a, b) => a - b);
		let maxErr = 0;
		for (let i = 1; i < sorted.length; i++) {
			maxErr = Math.max(maxErr, Math.abs(sorted[i]! - sorted[i - 1]! - 1));
		}
		return maxErr < 1e-4;
	});
}

/** Scrolls the fan to the middle of the screen and lets the drive settle. */
async function openOnFan(page: Page) {
	await page.goto('/');
	await page.evaluate(() => {
		const fan = document.querySelector('.treatments__fan')!.getBoundingClientRect();
		window.scrollTo(0, window.scrollY + fan.top + fan.height / 2 - window.innerHeight / 2);
	});
	await page.waitForTimeout(SETTLE_MS);
}

/** Scrolls by `dy` in wheel-sized steps, the way a person does. */
async function scrollBy(page: Page, dy: number) {
	const step = 40 * Math.sign(dy);
	for (let done = 0; Math.abs(done) < Math.abs(dy); done += step) {
		await page.evaluate((s) => window.scrollBy(0, s), step);
		await page.waitForTimeout(16);
	}
}

test('nothing moves on its own', async ({ page }) => {
	await openOnFan(page);
	const a = await centre(page);
	await page.waitForTimeout(3000);
	expect(await centre(page), 'no idle drift').toEqual(a);
});

test('less than a step of scroll turns nothing', async ({ page }) => {
	await openOnFan(page);
	const a = await centre(page);
	await scrollBy(page, STEP_PX / 2);
	await page.waitForTimeout(SETTLE_MS);
	expect(await centre(page)).toEqual(a);
});

test("a step of scroll turns the fan one card in next()'s direction, and the same back turns it back", async ({
	page
}) => {
	await openOnFan(page);
	const start = await centre(page);
	expect(start.pos).toBe(0);
	const startIndexes = await centreIndexes(page);

	await scrollBy(page, STEP_PX);
	await page.waitForTimeout(SETTLE_MS);
	const after = await centre(page);
	expect(after.index, 'the next card is at the centre').toBe(startIndexes.next);
	expect(Number.isInteger(after.pos), 'landed on a whole card').toBe(true);
	expect(await spacingInvariantHolds(page)).toBe(true);

	await scrollBy(page, -STEP_PX);
	await page.waitForTimeout(SETTLE_MS);
	const back = await centre(page);
	expect(back.index, 'scrolling back turns it back').toBe(start.index);
	expect(Number.isInteger(back.pos), 'landed again on the way back').toBe(true);
	expect(await spacingInvariantHolds(page)).toBe(true);
});

test('a card is animated, not teleported, into the centre', async ({ page }) => {
	await openOnFan(page);
	await scrollBy(page, STEP_PX);
	// Mid-spring: the centre pivot is between two whole positions.
	await page.waitForTimeout(150);
	const mid = await centre(page);
	expect(Number.isInteger(mid.pos), 'still travelling 150ms after the step').toBe(false);
});

test('prefers-reduced-motion: reduce → the scroll does not turn the fan', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await openOnFan(page);
	const a = await centre(page);
	await scrollBy(page, STEP_PX);
	await page.waitForTimeout(SETTLE_MS);
	expect(await centre(page)).toEqual(a);
});
