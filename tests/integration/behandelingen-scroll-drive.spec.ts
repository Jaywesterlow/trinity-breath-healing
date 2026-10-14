/**
 * behandelingen-scroll-drive.spec.ts — the Behandelingen fan turns with the
 * page's scroll (2026-10-14; it used to drift on its own after an idle delay).
 *
 * Covers: (i) nothing moves on its own — no idle drift any more; (ii) scrolling
 * the page while the fan is on screen turns it in next()'s direction
 * (decreasing --pos), and scrolling back turns it back; (iii) once the scroll
 * stops the fan latches onto a whole card; (iv) the spacing invariant holds
 * throughout; (v) reduced motion turns the drive off.
 *
 * The constants mirror SCROLL_DRIVE_* in Behandelingen.svelte only as rough
 * budgets; the direction and a generous band are asserted, not exact numbers.
 */
import { test, expect, type Page } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
test.use({ viewport: DESKTOP });

const SETTLE_MS = 900; // SCROLL_DRIVE_SETTLE_MS plus the latch spring's landing

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

test("scrolling down turns the fan in next()'s direction, scrolling up turns it back, and it latches", async ({
	page
}) => {
	await openOnFan(page);
	const start = await centre(page);
	expect(start.pos).toBe(0);

	await scrollBy(page, 320);
	await page.waitForTimeout(SETTLE_MS);
	const after = await centre(page);
	expect(after.index, 'a different card is at the centre after a card of scroll').not.toBe(
		start.index
	);
	expect(Number.isInteger(after.pos), 'latched onto a whole card').toBe(true);
	expect(await spacingInvariantHolds(page)).toBe(true);

	await scrollBy(page, -320);
	await page.waitForTimeout(SETTLE_MS);
	const back = await centre(page);
	expect(back.index, 'scrolling back turns it back').toBe(start.index);
	expect(Number.isInteger(back.pos), 'latched again on the way back').toBe(true);
	expect(await spacingInvariantHolds(page)).toBe(true);
});

test('prefers-reduced-motion: reduce → the scroll does not turn the fan', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await openOnFan(page);
	const a = await centre(page);
	await scrollBy(page, 320);
	await page.waitForTimeout(SETTLE_MS);
	expect(await centre(page)).toEqual(a);
});
