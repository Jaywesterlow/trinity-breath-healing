/**
 * behandelingen-drag-band.spec.ts — the drag surface on the Behandelingen fan
 * (src/lib/components/global/Behandelingen.svelte) must only respond to a
 * gesture that starts on or near the card row, not anywhere in the tall,
 * mostly-empty .treatments__fan box the cards' rotation clipping requires.
 *
 * Regression test for a real bug, reported by the owner: "drag to scroll
 * needs to be on and between the cards only, maybe a slight safe area under
 * and above the cards. Right now I can drag waaayy below the cards and the
 * cards still respond... Even way under the navigation buttons of the
 * carousel." onPointerDown is bound to .treatments__fan, which is
 * deliberately full-bleed and very tall as clipping headroom for the rotated
 * cards (see that CSS rule's own comment) — before this fix, that whole box
 * was a live drag surface, including the empty region behind and below
 * Prev/Next/the dots.
 *
 * The fix rejects the gesture in onPointerDown, before any drag state is
 * touched, whenever the pointer lands vertically outside a band derived from
 * the actual rendered card row's own bounding boxes (position -1/0/1 — the
 * three pivots guaranteed inside the fan's clip window at every breakpoint)
 * plus a modest safe margin. This asserts the real behavioural contract, not
 * the exact margin: a drag starting well below the card row (and below the
 * nav) must not move the fan at all, while a drag starting on a card must
 * work exactly as before.
 */
import { test, expect, type Page } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

async function positions(page: Page): Promise<number[]> {
	return page.$$eval('.treatments__pivot', (els) =>
		els.map((el) => Number(getComputedStyle(el).getPropertyValue('--pos')))
	);
}

test.describe('desktop', () => {
	test.use({ viewport: DESKTOP });

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('.treatments__fan').scrollIntoViewIfNeeded();
	});

	test('a drag starting well below the card row (under the nav) does not move the fan', async ({
		page
	}) => {
		const fanBox = await page.locator('.treatments__fan').boundingBox();
		const controlsBox = await page.locator('.treatments__controls').boundingBox();
		expect(fanBox).not.toBeNull();
		expect(controlsBox).not.toBeNull();

		// Comfortably below the Prev/Next/dots row, and still well inside the
		// (deliberately tall) fan box — exactly the region the owner reported
		// as wrongly draggable.
		const x = fanBox!.x + fanBox!.width / 2;
		const y = controlsBox!.y + controlsBox!.height + 40;
		expect(y, 'sanity: the probe point must still land inside the fan box').toBeLessThan(
			fanBox!.y + fanBox!.height
		);

		const before = await positions(page);

		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x - 200, y, { steps: 10 });
		await page.mouse.up();
		await page.waitForTimeout(200);

		expect(
			await positions(page),
			'a gesture starting below the card band must be rejected outright, no motion at all'
		).toEqual(before);
	});

	test('a drag starting on a card works exactly as before', async ({ page }) => {
		// Start on the centre card itself (position 0), well inside the band.
		const centre = await page.locator('.treatments__pivot').evaluateAll((els) => {
			const idx = els.findIndex(
				(el) => Number(getComputedStyle(el).getPropertyValue('--pos')) === 0
			);
			const rect = els[idx]!.getBoundingClientRect();
			return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
		});

		const before = await positions(page);

		await page.mouse.move(centre.x, centre.y);
		await page.mouse.down();
		await page.mouse.move(centre.x - 250, centre.y, { steps: 10 });
		await page.mouse.up();
		await page.waitForTimeout(900);

		const after = await positions(page);
		expect(after, 'a drag starting on the card row must still move the fan').not.toEqual(before);
	});
});

test.describe('mobile', () => {
	test.use({ viewport: MOBILE });

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('.treatments__fan').scrollIntoViewIfNeeded();
	});

	test('a drag starting well below the card row does not move the fan', async ({ page }) => {
		const fanBox = await page.locator('.treatments__fan').boundingBox();
		const pivotBoxes = await page.locator('.treatments__pivot').evaluateAll((els) =>
			els.map((el) => {
				const r = el.getBoundingClientRect();
				return { pos: Number(getComputedStyle(el).getPropertyValue('--pos')), bottom: r.bottom };
			})
		);
		const visibleBottom = Math.max(
			...pivotBoxes.filter((b) => Math.abs(b.pos) <= 1).map((b) => b.bottom)
		);

		const x = fanBox!.x + fanBox!.width / 2;
		// Mobile's fan buffer below the card is much shallower than
		// desktop's (see .treatments__fan's own comment on --pivot-baseline
		// per breakpoint), so this pushes only partway into it — still well
		// past CARD_BAND_SAFE_MARGIN_PX (24px), and re-checked below to stay
		// inside the fan box.
		const y = visibleBottom + Math.min(60, (fanBox!.y + fanBox!.height - visibleBottom) * 0.6);
		expect(y, 'sanity: probe point must still land inside the fan box').toBeLessThan(
			fanBox!.y + fanBox!.height
		);

		const before = await positions(page);

		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x - 150, y, { steps: 10 });
		await page.mouse.up();
		await page.waitForTimeout(200);

		expect(
			await positions(page),
			'a gesture starting below the card band must be rejected outright on mobile too'
		).toEqual(before);
	});

	test('a swipe starting on a card still works on mobile', async ({ page }) => {
		const centre = await page.locator('.treatments__pivot').evaluateAll((els) => {
			const idx = els.findIndex(
				(el) => Number(getComputedStyle(el).getPropertyValue('--pos')) === 0
			);
			const rect = els[idx]!.getBoundingClientRect();
			return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
		});

		const before = await positions(page);

		await page.mouse.move(centre.x, centre.y);
		await page.mouse.down();
		await page.mouse.move(centre.x - 150, centre.y, { steps: 10 });
		await page.mouse.up();
		await page.waitForTimeout(900);

		const after = await positions(page);
		expect(after, 'mobile swipe on the cards must keep working').not.toEqual(before);
	});
});
