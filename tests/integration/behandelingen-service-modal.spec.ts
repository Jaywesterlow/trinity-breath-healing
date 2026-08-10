/**
 * behandelingen-service-modal.spec.ts — the ServiceModal that opens out of the
 * Behandelingen carousel's centre card (260810-mdl).
 *
 * Covers the plan's own test list: centre-card open, Prev/Next with wrap, the
 * carousel underneath following (goTo) so it's centred correctly on close, all
 * three close paths (Esc, close button, backdrop click) with focus return, the
 * drag-suppression guard, real hrefs surviving on every card, and instant
 * open/close under prefers-reduced-motion.
 *
 * Same conventions as the other behandelingen-*.spec.ts files: positions read
 * straight off the live `--pos` custom property, not off a rendered pixel.
 */
import { test, expect, type Page } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const PIVOT = '.treatments__pivot';
const CARD = 'a.tcard';
const MODAL = 'dialog.service-modal';
const ACTIVE_TITLE = '.service-modal__panel:not([hidden]) .service-modal__title';

async function positions(page: Page): Promise<number[]> {
	return page.$$eval('.treatments__pivot', (els) =>
		els.map((el) => Number(getComputedStyle(el).getPropertyValue('--pos')))
	);
}

async function indexAt(page: Page, pos: number): Promise<number> {
	const all = await positions(page);
	const i = all.indexOf(pos);
	expect(i, `expected a card at position ${pos}, got ${JSON.stringify(all)}`).toBeGreaterThan(-1);
	return i;
}

/** Index of the pivot whose card links to /diensten/<slug> — used instead of a
 * fixed index so tests don't depend on BRAND.services' own ordering. */
async function indexForSlug(page: Page, slug: string): Promise<number> {
	return page.$$eval(
		PIVOT,
		(els, slug) =>
			els.findIndex((el) => el.querySelector('a')?.getAttribute('href') === `/diensten/${slug}`),
		slug
	);
}

async function activeTitle(page: Page): Promise<string> {
	return ((await page.locator(ACTIVE_TITLE).textContent()) ?? '').trim();
}

test.describe('desktop', () => {
	test.use({ viewport: DESKTOP });

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('.treatments__fan').scrollIntoViewIfNeeded();
	});

	test("clicking the centre card opens the modal with that service's title", async ({ page }) => {
		const centre = await indexAt(page, 0);
		const cardTitle = (
			(await page.locator(PIVOT).nth(centre).locator('.tcard__title').textContent()) ?? ''
		).trim();

		await page.locator(PIVOT).nth(centre).locator(CARD).click();
		await expect(page.locator(MODAL)).toBeVisible();
		// Open sequence is ~150ms card fade + ~400ms box grow + ~250ms content
		// fade, sequential (~800ms) — generous margin for parallel-worker CPU
		// contention, same reasoning other behandelingen specs use.
		await page.waitForTimeout(1500);

		expect(await activeTitle(page)).toBe(cardTitle);
	});

	test('Next moves to the adjacent service (Mahatma Healing -> Goldhealing) and wraps at the end', async ({
		page
	}) => {
		const mahatma = await indexForSlug(page, 'mahatma-healing');
		await page.locator(PIVOT).nth(mahatma).locator(CARD).click();
		await page.waitForTimeout(1500);
		expect(await activeTitle(page)).toBe('Mahatma Healing');

		await page.locator('.service-modal__nav--next').click();
		await page.waitForTimeout(700);
		expect(await activeTitle(page)).toBe('Goldhealing');

		// 6 more presses — 7 total, one full lap of 7 services — wraps back to Mahatma Healing.
		for (let i = 0; i < 6; i++) {
			await page.locator('.service-modal__nav--next').click();
			await page.waitForTimeout(700);
		}
		expect(await activeTitle(page)).toBe('Mahatma Healing');
	});

	test('Prev wraps backward past the first service', async ({ page }) => {
		const mahatma = await indexForSlug(page, 'mahatma-healing');
		await page.locator(PIVOT).nth(mahatma).locator(CARD).click();
		await page.waitForTimeout(1500);
		expect(await activeTitle(page)).toBe('Mahatma Healing');

		await page.locator('.service-modal__nav--prev').click();
		await page.waitForTimeout(700);
		// Mahatma Healing is index 0 in BRAND.services — Prev wraps to the last, index 6.
		const lastTitle = await activeTitle(page);
		expect(lastTitle).not.toBe('Mahatma Healing');

		await page.locator('.service-modal__nav--next').click();
		await page.waitForTimeout(700);
		expect(await activeTitle(page)).toBe('Mahatma Healing');
	});

	test('the carousel underneath ends up centred on the service the modal was showing when closed', async ({
		page
	}) => {
		const mahatma = await indexForSlug(page, 'mahatma-healing');
		await page.locator(PIVOT).nth(mahatma).locator(CARD).click();
		await page.waitForTimeout(1500);

		await page.locator('.service-modal__nav--next').click(); // -> Goldhealing
		await page.waitForTimeout(700);

		await page.locator('.service-modal__close').click();
		// Close animation (~800ms) plus goTo's own button-spring settle
		// (single-step measured ~1.2s elsewhere in this component) — generous
		// margin, same as behandelingen-click-to-jump.spec.ts's own waits.
		await page.waitForTimeout(3000);

		const goldhealing = await indexForSlug(page, 'goldhealing');
		expect((await positions(page))[goldhealing]).toBe(0);
	});

	test('Esc closes the modal and returns focus to the card', async ({ page }) => {
		const centre = await indexAt(page, 0);
		const card = page.locator(PIVOT).nth(centre).locator(CARD);
		await card.click();
		await expect(page.locator(MODAL)).toBeVisible();
		await page.waitForTimeout(1500);

		await page.keyboard.press('Escape');
		await page.waitForTimeout(1000);

		await expect(page.locator(MODAL)).toBeHidden();
		await expect(card).toBeFocused();
	});

	test('the close button closes the modal and returns focus to the card', async ({ page }) => {
		const centre = await indexAt(page, 0);
		const card = page.locator(PIVOT).nth(centre).locator(CARD);
		await card.click();
		await expect(page.locator(MODAL)).toBeVisible();
		await page.waitForTimeout(1500);

		await page.locator('.service-modal__close').click();
		await page.waitForTimeout(1000);

		await expect(page.locator(MODAL)).toBeHidden();
		await expect(card).toBeFocused();
	});

	test('a backdrop click closes the modal', async ({ page }) => {
		const centre = await indexAt(page, 0);
		await page.locator(PIVOT).nth(centre).locator(CARD).click();
		await expect(page.locator(MODAL)).toBeVisible();
		await page.waitForTimeout(1500);

		// The dialog is 92vw/92vh centred with a 4vh/4vw margin — the viewport
		// corner is well outside its box, on ::backdrop, whose click target is
		// the dialog element itself (the standard native-<dialog> backdrop
		// click convention this component's onModalBackdropClick relies on).
		await page.mouse.click(2, 2);
		await page.waitForTimeout(1000);

		await expect(page.locator(MODAL)).toBeHidden();
	});

	test('a drag that ends over the centre card does not open the modal', async ({ page }) => {
		const centre = await indexAt(page, 0);
		const box = await page.locator(PIVOT).nth(centre).locator(CARD).boundingBox();
		expect(box).not.toBeNull();

		const x = box!.x + box!.width / 2;
		const y = box!.y + box!.height / 2;
		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x - 10, y, { steps: 5 });
		await page.mouse.move(x - 20, y, { steps: 5 });
		await page.mouse.up();
		await page.waitForTimeout(900);

		await expect(page.locator(MODAL)).toBeHidden();
	});

	test('every card carries a real href into /diensten/', async ({ page }) => {
		const hrefs = await page
			.locator(CARD)
			.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
		expect(hrefs.length).toBeGreaterThan(0);
		for (const href of hrefs) {
			expect(href).toMatch(/^\/diensten\//);
		}
	});

	test.describe('prefers-reduced-motion', () => {
		test.use({ contextOptions: { reducedMotion: 'reduce' } });

		test('open and close are instant, no growth, no fade', async ({ page }) => {
			await page.goto('/');
			await page.locator('.treatments__fan').scrollIntoViewIfNeeded();
			const centre = await indexAt(page, 0);

			await page.locator(PIVOT).nth(centre).locator(CARD).click();
			// Well under the animated path's ~800ms open sequence — if this is
			// already fully open and legible, nothing was animating.
			await page.waitForTimeout(100);
			await expect(page.locator(MODAL)).toBeVisible();
			const contentOpacity = await page
				.locator('.service-modal__content')
				.evaluate((el) => getComputedStyle(el).opacity);
			expect(contentOpacity).toBe('1');

			await page.locator('.service-modal__close').click();
			await page.waitForTimeout(100);
			await expect(page.locator(MODAL)).toBeHidden();
		});
	});
});

test.describe('mobile', () => {
	test.use({ viewport: MOBILE });

	test('tapping the centre card opens the modal (replacing the old navigate-away)', async ({
		page
	}) => {
		await page.goto('/');
		await page.locator('.treatments__fan').scrollIntoViewIfNeeded();
		const centre = await indexAt(page, 0);

		await page.locator(PIVOT).nth(centre).locator(CARD).click();
		await page.waitForTimeout(1500);

		expect(new URL(page.url()).pathname).toBe('/');
		await expect(page.locator(MODAL)).toBeVisible();
	});
});
