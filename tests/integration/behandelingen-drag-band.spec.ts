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

	test('a drag starting at the vertical position of the nav row does not move the fan', async ({
		page
	}) => {
		// Regression test for the fb19441 fix NOT actually working: that
		// attempt derived the band from the bounding boxes of all three
		// visible pivots (-1, 0, 1). The ±1 pivots are rotated, so their
		// axis-aligned bbox is far taller than the card itself — tall enough
		// that the "safe" band's bottom edge landed BELOW
		// .treatments__controls' top edge, putting the nav row's own vertical
		// position inside the draggable band.
		//
		// The probe point is deliberately off to the side of the nav row, not
		// directly on top of it: .treatments__controls itself sits at a
		// higher stacking position than .treatments__fan (see its own CSS
		// comment) and would swallow the pointerdown regardless of the band
		// logic, making a probe centred on the controls box pass for the
		// wrong reason. Off to the side, at the SAME height, still lands on
		// the (full-bleed, 100vw) fan element and therefore actually
		// exercises getCardBandY — confirmed this exact probe moves the fan
		// against the pre-fix implementation.
		const controlsBox = await page.locator('.treatments__controls').boundingBox();
		const fanBox = await page.locator('.treatments__fan').boundingBox();
		expect(controlsBox).not.toBeNull();
		expect(fanBox).not.toBeNull();

		const x = fanBox!.x + 20;
		const y = controlsBox!.y + controlsBox!.height / 2;

		const before = await positions(page);

		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x - 200, y, { steps: 10 });
		await page.mouse.up();
		await page.waitForTimeout(200);

		expect(
			await positions(page),
			'a gesture starting on the nav row itself must not move the fan'
		).toEqual(before);
	});

	test('the computed drag band sits strictly above the controls row', async ({ page }) => {
		// Directly checks the geometry invariant the fix depends on: a band
		// built from the unrotated centre card alone (position 0) must end
		// above .treatments__controls' top edge. Also computes what the OLD
		// (broken) three-pivot bounding-box union would have produced, to
		// document why that approach failed — it does not, and must not,
		// clear the controls row.
		const result = await page.evaluate(() => {
			const fan = document.querySelector('.treatments__fan') as HTMLElement;
			const controls = document.querySelector('.treatments__controls') as HTMLElement;
			const pivots = Array.from(fan.querySelectorAll<HTMLElement>('.treatments__pivot'));
			const MARGIN = 24;

			// OLD (broken) approach: union of all three visible pivots (-1/0/1).
			let oldTop = Infinity;
			let oldBottom = -Infinity;
			pivots.forEach((el) => {
				const pos = Math.round(Number(getComputedStyle(el).getPropertyValue('--pos')));
				if (pos < -1 || pos > 1) return;
				const r = el.getBoundingClientRect();
				oldTop = Math.min(oldTop, r.top);
				oldBottom = Math.max(oldBottom, r.bottom);
			});

			// NEW (fixed) approach: centre pivot only (nearest to slot 0).
			let centreEl: HTMLElement | null = null;
			let centreDist = Infinity;
			pivots.forEach((el) => {
				const pos = Number(getComputedStyle(el).getPropertyValue('--pos'));
				const dist = Math.abs(pos);
				if (dist < centreDist) {
					centreDist = dist;
					centreEl = el;
				}
			});
			const rect = (centreEl as unknown as HTMLElement).getBoundingClientRect();
			const newBottom = rect.bottom + MARGIN;

			const controlsTop = controls.getBoundingClientRect().top;

			return {
				oldBandBottom: oldBottom + MARGIN,
				newBandBottom: newBottom,
				controlsTop
			};
		});

		expect(
			result.oldBandBottom,
			'sanity: the old three-pivot union band DID reach into the controls row (that was the bug)'
		).toBeGreaterThan(result.controlsTop);

		expect(
			result.newBandBottom,
			'the centre-card-only band must sit strictly above the controls row'
		).toBeLessThan(result.controlsTop);
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
