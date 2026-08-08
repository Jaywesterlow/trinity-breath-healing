/**
 * behandelingen-click-to-jump.spec.ts — desktop click-to-jump on the
 * Behandelingen fan (src/lib/components/global/Behandelingen.svelte).
 *
 * Three things here are invisible to a type check, a lint, or a snapshot, and
 * each is the specific way this feature breaks:
 *
 *   1. The overlay must not cover the centre card. If it does, that card's own
 *      `tcard__button` link stops being clickable and the section quietly loses
 *      its only route into /diensten/*.
 *   2. A mouse drag ends in a `click` on whatever sat under the pointer. Without
 *      the `dragMoved` guard, every desktop drag-follow also fires a jump on
 *      release — the fan lands somewhere the user did not aim for.
 *   3. The overlay is desktop-only. Rendered live on mobile it would swallow the
 *      `pointerdown` that starts the swipe, which is that breakpoint's only way
 *      to navigate the section at all.
 *
 * Positions are read straight off `--pos`, the persistent per-item value the
 * whole mechanism is built on — asserting on it is asserting on the real state,
 * not on a rendered pixel that empirical geometry tuning could legitimately move.
 */
import { test, expect, type Page } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const PIVOT = '.treatments__pivot';
const JUMP = '.treatments__jump';

/** Every card's current `--pos`, in DOM order. */
async function positions(page: Page): Promise<number[]> {
	return page.$$eval('.treatments__pivot', (els) =>
		els.map((el) => Number(getComputedStyle(el).getPropertyValue('--pos')))
	);
}

/** Index of the card currently sitting at `pos`. */
async function indexAt(page: Page, pos: number): Promise<number> {
	const all = await positions(page);
	const i = all.indexOf(pos);
	expect(i, `expected a card at position ${pos}, got ${JSON.stringify(all)}`).toBeGreaterThan(-1);
	return i;
}

test.describe('desktop', () => {
	test.use({ viewport: DESKTOP });

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('.treatments__fan').scrollIntoViewIfNeeded();
	});

	test('clicking the right-hand side card centres it', async ({ page }) => {
		const target = await indexAt(page, 1);

		await page.locator(PIVOT).nth(target).locator(JUMP).click();
		// One step at the normal 600ms duration, plus headroom.
		await page.waitForTimeout(900);

		expect((await positions(page))[target]).toBe(0);
	});

	test('clicking the left-hand side card centres it', async ({ page }) => {
		const target = await indexAt(page, -1);

		await page.locator(PIVOT).nth(target).locator(JUMP).click();
		await page.waitForTimeout(900);

		expect((await positions(page))[target]).toBe(0);
	});

	test('the centre card carries no overlay, so its link stays clickable', async ({ page }) => {
		const centre = await indexAt(page, 0);

		await expect(page.locator(PIVOT).nth(centre).locator(JUMP)).toHaveCount(0);
		// The link is the thing the overlay would have covered.
		await expect(page.locator(PIVOT).nth(centre).locator('a[href^="/diensten/"]')).toBeVisible();
	});

	test('off-screen cards carry no overlay', async ({ page }) => {
		// Only ±1 is visible; ±2 is clipped by .treatments__fan's overflow.
		await expect(page.locator(JUMP)).toHaveCount(2);
	});

	test('a drag does not also fire a jump on release', async ({ page }) => {
		const target = await indexAt(page, 1);
		const before = await positions(page);

		// Deliberately started on the side card's own overlay, not on empty fan
		// background: the bug is the browser synthesising a click there after a
		// drag, so a drag that never touches the overlay cannot catch it.
		const box = await page.locator(PIVOT).nth(target).locator(JUMP).boundingBox();
		expect(box).not.toBeNull();

		// Short enough that the drag itself commits zero steps (well under
		// PX_PER_STEP, too slow to register as a fling) but past DRAG_SLOP_PX,
		// so any movement at all here came from a stray jump.
		const x = box!.x + box!.width / 2;
		const y = box!.y + box!.height / 2;
		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x - 10, y, { steps: 5 });
		await page.mouse.move(x - 20, y, { steps: 5 });
		await page.mouse.up();
		await page.waitForTimeout(900);

		expect(await positions(page)).toEqual(before);
	});
});

test.describe('mobile', () => {
	test.use({ viewport: MOBILE });

	test('the overlay is not rendered as a live target', async ({ page }) => {
		await page.goto('/');
		await page.locator('.treatments__fan').scrollIntoViewIfNeeded();

		// Present in the DOM (the {#if} is position-driven, not breakpoint-driven)
		// but display:none, so it cannot intercept the swipe's pointerdown.
		await expect(page.locator(JUMP).first()).toBeHidden();
	});
});
