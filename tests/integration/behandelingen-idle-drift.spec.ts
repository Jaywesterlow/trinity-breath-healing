/**
 * behandelingen-idle-drift.spec.ts — idle auto-drift on the Behandelingen
 * fan (src/lib/components/global/Behandelingen.svelte).
 *
 * Owner request: a slow, ambient, continuous advance through the cards when
 * nothing is touching the carousel — "moving slowly, scrolling towards the
 * right," clarified as "advance through the list in the direction of the
 * next button." Runs as a third regime (`drift`) of the same continuous
 * `motionTick` loop coast/latch already use (see beginDrift's own comment),
 * so it inherits every existing interruption point — a new pointerdown or
 * driveMotion call already cancels whatever's running — for free.
 *
 * This asserts the behavioural contract, not implementation details:
 * (i) nothing moves before the idle delay elapses, (ii) once it does, --pos
 * moves in next()'s own direction (decreasing) at roughly the configured
 * speed, (iii) the spacing invariant — every pair of cards exactly 1 apart —
 * holds throughout, same as every other continuous-motion regime already
 * guards, (iv) any real interaction (a button press here) cancels drift
 * outright and settles cleanly with no further movement afterward, and
 * (v) prefers-reduced-motion disables it entirely, never starting at all.
 */
import { test, expect, type Page } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
test.use({ viewport: DESKTOP });

// IDLE_DRIFT_DELAY_MS / DRIFT_SECONDS_PER_STEP in Behandelingen.svelte — kept
// here only as the rough real-time budget these tests need, not re-asserted
// against directly (see the "matches next()'s own direction" test, which
// checks the SIGN and a generous speed BAND, not an exact number, so a
// future retune of either constant doesn't make this flaky).
const IDLE_DRIFT_DELAY_MS = 4000;

async function centrePos(page: Page): Promise<number> {
	return page.evaluate(() => {
		const els = document.querySelectorAll('.treatments__pivot');
		let best = 0;
		let bestDist = Infinity;
		els.forEach((el) => {
			const p = Number(getComputedStyle(el).getPropertyValue('--pos'));
			if (Math.abs(p) < bestDist) {
				bestDist = Math.abs(p);
				best = p;
			}
		});
		return best;
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
		// Same 1e-4 tolerance behandelingen-button-retarget.spec.ts uses —
		// --pos is registered via @property for the mobile-swipe perf fix,
		// which routes it through float32 internally (see that file's own
		// comment for the full reasoning); this isn't specific to drift.
		return maxErr < 1e-4;
	});
}

test("stays put until the idle delay elapses, then drifts in next()'s own direction", async ({
	page
}) => {
	await page.goto('/');
	await page.locator('.treatments__fan').scrollIntoViewIfNeeded();

	const early = await centrePos(page);
	await page.waitForTimeout(IDLE_DRIFT_DELAY_MS - 800);
	const stillEarly = await centrePos(page);
	expect(stillEarly, 'no movement before the idle delay elapses').toBe(early);

	// Past the delay now — sample twice more, a couple of seconds apart, and
	// check both the direction (next()'s own driveBy(-1) — decreasing) and a
	// generous speed band (not an exact number) so this doesn't go flaky if
	// DRIFT_SECONDS_PER_STEP is retuned later.
	await page.waitForTimeout(1500);
	const mid = await centrePos(page);
	await page.waitForTimeout(2000);
	const late = await centrePos(page);

	expect(mid, 'has started moving by the time the idle delay has clearly passed').not.toBe(
		stillEarly
	);
	expect(mid, "drifts in next()'s own direction (decreasing --pos)").toBeLessThan(stillEarly);
	expect(late, 'keeps drifting the same direction, continuously').toBeLessThan(mid);

	// Speed band: over the 2000ms between `mid` and `late`, expect somewhere
	// between one step per 60s (far too slow to call "ambient drift" at all)
	// and one step per 4s (indistinguishable from a real auto-advance,
	// clearly faster than "slow"), i.e. a wide, deliberately generous window
	// around whatever DRIFT_SECONDS_PER_STEP is actually tuned to.
	const distance = mid - late;
	expect(distance, 'moved a measurable amount, not a rounding artifact').toBeGreaterThan(0.01);
	expect(distance, 'not implausibly fast for "slow, ambient" drift').toBeLessThan(2000 / 4000);
	expect(distance, 'not implausibly slow either').toBeGreaterThan(2000 / 60000);
});

test('spacing invariant holds throughout idle drift', async ({ page }) => {
	await page.goto('/');
	await page.locator('.treatments__fan').scrollIntoViewIfNeeded();

	const samples: boolean[] = [];
	for (let i = 0; i < 6; i++) {
		samples.push(await spacingInvariantHolds(page));
		await page.waitForTimeout(1200); // spans well past IDLE_DRIFT_DELAY_MS across the loop
	}

	expect(samples.every(Boolean), 'every pair of cards stayed exactly 1 apart throughout').toBe(
		true
	);
});

test('a button press cancels drift outright and settles with no further movement', async ({
	page
}) => {
	await page.goto('/');
	await page.locator('.treatments__fan').scrollIntoViewIfNeeded();
	await page.waitForTimeout(IDLE_DRIFT_DELAY_MS + 500); // drift should be active by now

	await page.getByRole('button', { name: 'Volgende' }).click();
	await page.waitForTimeout(2000); // let the button-driven latch fully settle

	const settled = await centrePos(page);
	expect(settled, 'lands exactly on the next card, not mid-drift').toBe(0);

	// Sample a few more times — if drift somehow survived the button press
	// (a stale, uncancelled rAF loop still running underneath), --pos would
	// keep moving away from the settled 0 here.
	for (let i = 0; i < 3; i++) {
		await page.waitForTimeout(700);
		expect(await centrePos(page), 'stays exactly on the settled card, not still drifting').toBe(0);
	}
});

test('prefers-reduced-motion disables idle drift entirely', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	await page.locator('.treatments__fan').scrollIntoViewIfNeeded();

	const start = await centrePos(page);
	await page.waitForTimeout(IDLE_DRIFT_DELAY_MS + 2000); // well past the idle delay

	expect(await centrePos(page), 'never starts drifting under prefers-reduced-motion').toBe(start);
});
