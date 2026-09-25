/**
 * cursor-tooltip.spec.ts — the custom cursor (CursorTooltip.svelte) is visible
 * on the page, over the treatments modal, and on the page again after the
 * modal closes.
 *
 * Why this exists. The cursor hides the native pointer (html.has-cursor-tooltip
 * sets cursor: none), so if the custom one fails to draw there is no pointer at
 * all. It failed twice, in opposite directions:
 *   1. As a fixed div at z-index 200 it drew UNDER the modal: a modal <dialog>
 *      lives in the browser's top layer, above every z-index.
 *   2. Moved into the top layer as a manual popover, it drew only WHILE a modal
 *      was open: showPopover() ran in onMount before Svelte had rendered the
 *      {#if enabled} block, found no element, and returned silently; only the
 *      dialog observer ever showed it.
 * The first fix was checked over the modal and never on the plain page. This
 * spec checks all three states.
 *
 * "Visible" is measured, not inferred from classes: a screenshot of a small
 * box around the pointer, taken once with the cursor as it is and once with it
 * forced hidden, must differ. If the cursor is not painted (display: none, or
 * under the dialog) the two pictures are identical.
 *
 * Runs with reduced motion OFF and a fine pointer (Playwright's desktop
 * default), the only conditions under which the custom cursor switches on.
 */
import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

const BOX = 70; // px around the pointer; the arrow is 17px, the ring and card larger

async function cursorIsPainted(page: Page, x: number, y: number): Promise<boolean> {
	await page.mouse.move(x - 12, y - 12);
	await page.mouse.move(x, y, { steps: 4 });
	await page.waitForTimeout(350); // the cursor's own fade-in is 120ms
	const clip = { x: x - BOX / 2, y: y - BOX / 2, width: BOX, height: BOX };
	const withCursor = await page.screenshot({ clip });
	await page.evaluate(() => {
		const c = document.querySelector<HTMLElement>('.cursor');
		if (c) c.style.visibility = 'hidden';
	});
	const without = await page.screenshot({ clip });
	await page.evaluate(() => {
		const c = document.querySelector<HTMLElement>('.cursor');
		if (c) c.style.visibility = '';
	});
	return !withCursor.equals(without);
}

async function openModal(page: Page): Promise<void> {
	await page.locator('.treatments__fan').scrollIntoViewIfNeeded();
	await page.waitForTimeout(400);
	const centre = await page.evaluate(() => {
		const cards = [...document.querySelectorAll('.tcard')].map((c) => c.getBoundingClientRect());
		const mid = cards.sort(
			(a, b) =>
				Math.abs(a.left + a.width / 2 - innerWidth / 2) -
				Math.abs(b.left + b.width / 2 - innerWidth / 2)
		)[0]!;
		return { x: mid.left + mid.width / 2, y: mid.top + mid.height / 2 };
	});
	await page.mouse.click(centre.x, centre.y);
	await expect(page.locator('dialog.service-modal')).toHaveAttribute('open', '');
	await page.waitForTimeout(1500); // grow + content fade
}

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.evaluate(() => document.fonts.ready);
	await expect(page.locator('html')).toHaveClass(/has-cursor-tooltip/);
});

test('the cursor is painted on the page, with no modal ever opened', async ({ page }) => {
	expect(await cursorIsPainted(page, 700, 300), 'cursor not drawn on the hero').toBe(true);
	await page.mouse.wheel(0, 2200);
	await page.waitForTimeout(500);
	expect(await cursorIsPainted(page, 300, 450), 'cursor not drawn further down the page').toBe(
		true
	);
});

test('the cursor is painted over the open treatments modal', async ({ page }) => {
	await openModal(page);
	const box = (await page.locator('dialog.service-modal').boundingBox())!;
	// A point inside the dialog, clear of text and controls: the drawing half.
	const x = box.x + box.width * 0.12;
	const y = box.y + box.height * 0.85;
	expect(await cursorIsPainted(page, x, y), 'cursor hidden under the modal').toBe(true);
});

test('the cursor is still painted on the page after the modal closes', async ({ page }) => {
	await openModal(page);
	await page.keyboard.press('Escape');
	await expect(page.locator('dialog.service-modal')).not.toHaveAttribute('open', '');
	await page.waitForTimeout(900);
	expect(await cursorIsPainted(page, 200, 200), 'cursor gone after closing the modal').toBe(true);
});

test('the cursor survives client-side navigation and draws on the next page', async ({ page }) => {
	await page.locator('nav a[href="/diensten"]').first().click();
	await expect(page).toHaveURL(/\/diensten$/);
	await page.waitForTimeout(600);
	expect(await cursorIsPainted(page, 900, 500), 'cursor gone after navigating').toBe(true);
});
