/**
 * behandelingen-scroll-drive.spec.ts — the Behandelingen fan drifts on its own
 * while it is on screen, and the page's scroll changes its speed (2026-10-28):
 * down speeds it up, up slows it down, never backwards.
 *
 * Covers: (i) it drifts in next()'s direction with nothing touched; (ii) a scroll
 * down adds about a card per SCROLL_PX_PER_STEP on top of the drift; (iii) a
 * scroll up slows it and never turns it back; (iv) it holds under the pointer and
 * on the pause button, and the button restarts it; (v) the spacing invariant
 * holds; (vi) reduced motion keeps it still, scroll included.
 *
 * Travel is summed frame by frame on one pivot's --pos (unwrapped across the
 * ring's recycling), so it reads in cards: -1 is one card of Volgende.
 * STEP_PX mirrors SCROLL_PX_PER_STEP, DRIFT_S DRIFT_SECONDS_PER_STEP.
 */
import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

const STEP_PX = 400; // SCROLL_PX_PER_STEP
const SETTLE_MS = 900; // SCROLL_TAU_MS 100 plus Lenis's glide, with room
const DRIFT_S = 6.4; // DRIFT_SECONDS_PER_STEP

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

/** Cards travelled (negative is Volgende) over `ms`, while `act` runs. Summed
 *  per frame so a pivot recycling to the far end of the ring does not count. */
async function travel(
	page: Page,
	ms: number,
	act?: () => Promise<void>
): Promise<{ sum: number; back: number }> {
	const sampling = page.evaluate(async (dur) => {
		const el = document.querySelectorAll('.treatments__pivot')[0]!;
		const read = () => Number(getComputedStyle(el).getPropertyValue('--pos'));
		let prev = read();
		let sum = 0;
		let back = 0;
		const end = performance.now() + dur;
		while (performance.now() < end) {
			await new Promise((r) => requestAnimationFrame(r));
			const v = read();
			const d = Math.abs(v - prev) > 3 ? 0 : v - prev;
			sum += d;
			if (d > 1e-6) back += d;
			prev = v;
		}
		return { sum, back };
	}, ms);
	if (act) await act();
	return sampling;
}

test("it drifts in next()'s direction with nothing touched", async ({ page }) => {
	await openOnFan(page);
	const { sum, back } = await travel(page, 2000);
	// about -0.31; loose, because a loaded runner drops frames (dt is clamped at 50ms)
	expect(sum).toBeLessThan(-0.15);
	expect(sum).toBeGreaterThan(-0.45);
	expect(back).toBe(0);
	expect(await spacingInvariantHolds(page)).toBe(true);
});

test('a scroll down speeds it up by about a card per step', async ({ page }) => {
	await openOnFan(page);
	const { sum } = await travel(page, 2000, () => scrollBy(page, STEP_PX));
	// drift alone over 2s is about -0.31; the scroll adds about -1
	expect(sum).toBeLessThan(-1);
	expect(await spacingInvariantHolds(page)).toBe(true);
});

test('a scroll up slows it down and never turns it back', async ({ page }) => {
	await openOnFan(page);
	const { sum, back } = await travel(page, 2000, () => scrollBy(page, -STEP_PX));
	expect(sum).toBeGreaterThan(-2 / DRIFT_S / 2);
	expect(sum).toBeLessThanOrEqual(0);
	expect(back).toBe(0);
});

test('it holds under the pointer, and the pause button stops and restarts it', async ({ page }) => {
	await openOnFan(page);
	const card = page.locator('.treatments__pivot').nth(await centreIndex(page));
	const box = (await card.boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.waitForTimeout(300);
	expect((await travel(page, 1000)).sum, 'held under the pointer').toBe(0);

	await page.mouse.move(2, 2);
	await page.locator('.treatments__pause').click();
	await page.mouse.move(2, 2);
	await expect(page.locator('.treatments__pause')).toHaveAttribute('aria-pressed', 'true');
	await page.waitForTimeout(2500); // longer than the idle restart, which must not fire
	expect((await travel(page, 1000)).sum, 'paused').toBe(0);

	await page.locator('.treatments__pause').click();
	await page.mouse.move(2, 2);
	expect((await travel(page, 1000)).sum, 'running again').toBeLessThan(0);
});

test('prefers-reduced-motion: reduce → nothing moves, scroll included', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await openOnFan(page);
	const { sum } = await travel(page, 1500, () => scrollBy(page, STEP_PX));
	expect(sum).toBe(0);
});
