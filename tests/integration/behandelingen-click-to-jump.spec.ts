/**
 * behandelingen-click-to-jump.spec.ts — click-to-jump on the Behandelingen
 * fan (src/lib/components/global/Behandelingen.svelte), desktop AND mobile.
 *
 * Things here are invisible to a type check, a lint, or a snapshot, and each
 * is the specific way this feature breaks:
 *
 *   1. The overlay must not cover the centre card. If it does, that card's own
 *      `tcard__button` link stops being clickable and the section quietly loses
 *      its only route into /diensten/*.
 *   2. A mouse drag ends in a `click` on whatever sat under the pointer. Without
 *      the `dragMoved` guard, every desktop drag-follow also fires a jump on
 *      release — the fan lands somewhere the user did not aim for.
 *   3. Only the CENTRE card ever opens anything (the service modal — see
 *      behandelingen-service-modal.spec.ts). Every other card, tapped on ANY
 *      viewport, must centre itself instead of navigating straight to its
 *      real page. This used to be desktop-only (mobile navigated the fan by
 *      swiping, so a tap there had always meant "open it") — that gate was
 *      removed once the modal made "open" a centre-card-only action; a
 *      non-centre tap navigating away on mobile is the exact regression this
 *      file's mobile describe block guards against.
 *
 * Positions are read straight off `--pos`, the persistent per-item value the
 * whole mechanism is built on — asserting on it is asserting on the real state,
 * not on a rendered pixel that empirical geometry tuning could legitimately move.
 */
import { test, expect, type Page } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const PIVOT = '.treatments__pivot';
// The card root IS the click target now. There is no overlay element any
// more: .treatments__jump was deleted because, as an inset:0 later sibling,
// it hit-tested above the card and stopped :hover ever reaching it, killing
// the whole hover reveal on every side card. What a click means is decided in
// onCardClick instead, from the card's live position at click time — so these
// tests assert the BEHAVIOUR (centres / navigates) rather than the presence
// of a particular element, which is what let the old gate rot twice.
const CARD = 'a.tcard';

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

		await page.locator(PIVOT).nth(target).locator(CARD).click();
		// jumpTo routes through goTo/driveMotion, the same JS spring latch
		// button navigation uses (BUTTON_SPRING_OMEGA — see its own comment),
		// not the CSS transition. Single-step settle measures ~1.22s at the
		// current BUTTON_SPRING_OMEGA = SPRING_OMEGA / 4 in isolation; 2s
		// keeps real headroom under parallel-worker CPU contention (other
		// suites in this same run measurably slow rAF timing down).
		await page.waitForTimeout(2000);

		expect((await positions(page))[target]).toBe(0);
	});

	test('clicking the left-hand side card centres it', async ({ page }) => {
		const target = await indexAt(page, -1);

		await page.locator(PIVOT).nth(target).locator(CARD).click();
		await page.waitForTimeout(2000);

		expect((await positions(page))[target]).toBe(0);
	});

	test('clicking an outer visible card centres it instead of navigating', async ({ page }) => {
		// The regression this exists for: ±2 used to fall through to the card's
		// own <a> and NAVIGATE, behaving like the centre card rather than like
		// its ±1 neighbours, because the overlay was gated to exactly ±1 back
		// when only three cards were visible. Asserted on both axes — the card
		// centres AND the page did not navigate away.
		const target = await indexAt(page, 2);

		await page.locator(PIVOT).nth(target).locator(CARD).click();
		await page.waitForTimeout(2500);

		expect(new URL(page.url()).pathname).toBe('/');
		expect((await positions(page))[target]).toBe(0);
	});

	// 260810-mdl: the centre card now opens the service modal instead of navigating —
	// see behandelingen-service-modal.spec.ts for the modal's own coverage. This test keeps
	// the still-true half of the old contract (a real href survives in the markup, for
	// crawlers and JS-off visitors) and asserts the new half (clicking does NOT navigate).
	test('clicking the centre card has a real href but does not navigate (opens the modal instead)', async ({
		page
	}) => {
		const centre = await indexAt(page, 0);
		const href = await page.locator(PIVOT).nth(centre).locator(CARD).getAttribute('href');
		expect(href).toBeTruthy();

		await page.locator(PIVOT).nth(centre).locator(CARD).click();
		await page.waitForTimeout(200);

		expect(new URL(page.url()).pathname).toBe('/');
		await expect(page.locator('dialog.service-modal')).toBeVisible();
	});

	test('a drag does not also fire a jump on release', async ({ page }) => {
		const target = await indexAt(page, 1);
		const before = await positions(page);

		// Deliberately started on the side card itself, not on empty fan
		// background: the bug is the browser synthesising a click there after a
		// drag, so a drag that never touches a card cannot catch it.
		const box = await page.locator(PIVOT).nth(target).locator(CARD).boundingBox();
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

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('.treatments__fan').scrollIntoViewIfNeeded();
	});

	test('tapping a side card centres it instead of navigating', async ({ page }) => {
		// The regression this guards against, reported directly: tapping a
		// non-centre card on mobile navigated straight to its real page
		// instead of centring it — a leftover from when mobile always
		// navigated on tap, before the modal made "open" a centre-card-only
		// action (onCardClick used to gate jumpTo behind a desktop-only
		// (min-width: 1024px) media query; that gate is gone, this is the
		// only behaviour left).
		const target = await indexAt(page, 1);
		const href = await page.locator(PIVOT).nth(target).locator(CARD).getAttribute('href');
		expect(href).toBeTruthy();

		await page.locator(PIVOT).nth(target).locator(CARD).click();
		await page.waitForTimeout(2000);

		expect(new URL(page.url()).pathname).toBe('/');
		expect((await positions(page))[target]).toBe(0);
	});

	test('tapping the centre card opens the modal instead of navigating', async ({ page }) => {
		const centre = await indexAt(page, 0);
		const href = await page.locator(PIVOT).nth(centre).locator(CARD).getAttribute('href');
		expect(href).toBeTruthy();

		await page.locator(PIVOT).nth(centre).locator(CARD).click();
		await page.waitForTimeout(200);

		expect(new URL(page.url()).pathname).toBe('/');
		await expect(page.locator('dialog.service-modal')).toBeVisible();
	});

	test('tapping an already-centred card opens the modal', async ({ page }) => {
		// The owner's own contract: tap once to centre, tap again (now that
		// it's the centre card) to open — this is just the previous test's
		// same click, proven to work when the card started off-centre first.
		const target = await indexAt(page, 1);
		await page.locator(PIVOT).nth(target).locator(CARD).click();
		await page.waitForTimeout(2000);
		expect((await positions(page))[target]).toBe(0);

		await page.locator(PIVOT).nth(target).locator(CARD).click();
		await page.waitForTimeout(200);

		expect(new URL(page.url()).pathname).toBe('/');
		await expect(page.locator('dialog.service-modal')).toBeVisible();
	});
});
