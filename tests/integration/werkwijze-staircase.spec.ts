/**
 * werkwijze-staircase.spec.ts — the desktop staircase in
 * src/lib/components/global/Werkwijze.svelte (≥ 1100px, motion allowed).
 *
 * The three cards arrive as a staircase and leave as one row. With the section's top at
 * the bottom of the viewport all three stand below their rest position — card 1 200px
 * down, card 2 506, card 3 812 — and over the scroll it takes the row's rest top to reach
 * the middle of the screen (vh / 2 + the row's offset below the section's top: 450 + 214
 * = 664px here) they catch up, so they are aligned the moment the row's top crosses the
 * viewport's centre. Over the next 0.4 viewport all three rise past the page by the
 * header block, the gap under it and half a card (348px at this width) and fade to 0,
 * and once fully faded they are `visibility: hidden` so the link in card 3 is not a
 * keyboard trap. Every step reverses on the way back up, because the whole thing is a
 * function of the scroll position — damped, which is why each scroll here is followed
 * by a wait: the row takes ~0.25s to settle.
 *
 * The mobile pin has its own spec (werkwijze-scrolljack.spec.ts) and is untouched by this.
 *
 * Real scroll geometry, hence Playwright rather than jsdom.
 * Run: npx playwright test tests/integration/werkwijze-staircase.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

const VH = 900;
const BASE = 200;
const STEP = 306;
const FADE_SPAN = 0.4;
const SETTLE_MS = 800;

/** scrollY at which the section's top sits exactly on the viewport's bottom edge. */
async function entryY(page: Page): Promise<number> {
	return page.evaluate(() => {
		const section = document.querySelector('#werkwijze') as HTMLElement;
		return Math.round(section.getBoundingClientRect().top + window.scrollY - window.innerHeight);
	});
}

/** scrollY at which the row's rest top (the untransformed wrapper) sits on the viewport's
 *  vertical centre — the alignment moment. */
async function alignedY(page: Page): Promise<number> {
	return page.evaluate(() => {
		const row = document.querySelector('.werkwijze__row') as HTMLElement;
		return Math.round(row.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2);
	});
}

async function scrollAndSettle(page: Page, y: number) {
	await page.evaluate((y) => window.scrollTo(0, y), y);
	await page.waitForTimeout(SETTLE_MS);
}

/** Viewport-relative top of each card's <li>, in DOM order. */
async function cardTops(page: Page): Promise<number[]> {
	return page.evaluate(() =>
		[...document.querySelectorAll('.werkwijze__cards > li')].map(
			(li) => li.getBoundingClientRect().top
		)
	);
}

/** Viewport-relative top of the row's rest position: the wrapper never moves. */
async function rowTop(page: Page): Promise<number> {
	return page.evaluate(
		() => document.querySelector('.werkwijze__row')!.getBoundingClientRect().top
	);
}

async function cardOpacities(page: Page): Promise<number[]> {
	return page.evaluate(() =>
		[...document.querySelectorAll('.werkwijze__cards > li')].map((li) =>
			Number(getComputedStyle(li).opacity)
		)
	);
}

async function open(page: Page) {
	await page.goto('/');
	await expect(page.locator('#werkwijze')).toHaveClass(/werkwijze--stairs/);
	await expect(page.locator('.werkwijze__cards > li')).toHaveCount(3);
}

test.describe('Werkwijze desktop staircase', () => {
	test('at section entry, all three cards sit below rest: 200, 506 and 812px', async ({ page }) => {
		await open(page);
		await scrollAndSettle(page, await entryY(page));

		const rest = await rowTop(page);
		const tops = await cardTops(page);
		expect(Math.abs(tops[0]! - rest - BASE)).toBeLessThanOrEqual(2);
		expect(Math.abs(tops[1]! - rest - BASE - STEP)).toBeLessThanOrEqual(2);
		expect(Math.abs(tops[2]! - rest - BASE - 2 * STEP)).toBeLessThanOrEqual(2);
		expect(await cardOpacities(page)).toEqual([1, 1, 1]);
	});

	test('halfway to alignment every card has moved, and none has arrived', async ({ page }) => {
		await open(page);
		const entry = await entryY(page);
		const aligned = await alignedY(page);
		await scrollAndSettle(page, entry);
		await scrollAndSettle(page, Math.round((entry + aligned) / 2));

		const rest = await rowTop(page);
		const tops = await cardTops(page);
		/* Half the drop left, each: 100 / 253 / 406. Card 1 included — the point of the
		   +200 is that the reader sees it arrive too. */
		expect(Math.abs(tops[0]! - rest - BASE / 2)).toBeLessThanOrEqual(3);
		expect(Math.abs(tops[1]! - rest - (BASE + STEP) / 2)).toBeLessThanOrEqual(3);
		expect(Math.abs(tops[2]! - rest - (BASE + 2 * STEP) / 2)).toBeLessThanOrEqual(3);
	});

	test('the cards align on one line as the row reaches the middle of the viewport', async ({
		page
	}) => {
		await open(page);
		const entry = await entryY(page);
		const aligned = await alignedY(page);
		await scrollAndSettle(page, entry);
		await scrollAndSettle(page, aligned);

		/* The alignment moment is defined by the row's rest position, not by the section:
		   its top within 80px of the viewport's centre line. */
		const rest = await rowTop(page);
		expect(Math.abs(rest - VH / 2)).toBeLessThanOrEqual(80);

		const tops = await cardTops(page);
		expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(2);
		for (const top of tops) expect(Math.abs(top - rest)).toBeLessThanOrEqual(2);
		expect(await cardOpacities(page)).toEqual([1, 1, 1]);
	});

	test('aligned, the gap to the next section is one --section-pad', async ({ page }) => {
		await open(page);
		const entry = await entryY(page);
		await scrollAndSettle(page, entry);
		await scrollAndSettle(page, await alignedY(page));

		/* The cards leave their box early (lifted past the header, then gone), so the
		   section drops its own bottom padding in staircase mode and the next section's top
		   padding is the whole gap: one --section-pad from the aligned row to the first
		   thing Over mij draws, where every other pair of sections has two. The first thing
		   drawn is whichever content box in the next section starts highest, so the test
		   does not depend on that section's layout; --section-pad is resolved to px through
		   a probe element, since the token is a clamp() string on :root. */
		const { gap, pad } = await page.evaluate(() => {
			const cards = document.querySelector('.werkwijze__cards') as HTMLElement;
			const next = document.querySelector('#werkwijze + *') as HTMLElement;
			const firstTop = Math.min(
				...[...next.querySelectorAll('h1, h2, h3, p, img, svg')].map(
					(el) => el.getBoundingClientRect().top
				)
			);
			const probe = document.createElement('div');
			probe.style.paddingTop = 'var(--section-pad)';
			document.body.appendChild(probe);
			const pad = parseFloat(getComputedStyle(probe).paddingTop);
			probe.remove();
			return { gap: firstTop - cards.getBoundingClientRect().bottom, pad };
		});
		expect(pad).toBeGreaterThan(0);
		expect(Math.abs(gap - pad)).toBeLessThanOrEqual(2);
	});

	test('a further 0.4 viewport on, the cards have passed the header, faded out, hidden and unfocusable', async ({
		page
	}) => {
		await open(page);
		const entry = await entryY(page);
		const aligned = await alignedY(page);
		await scrollAndSettle(page, entry);
		await scrollAndSettle(page, aligned);
		await scrollAndSettle(page, aligned + VH * FADE_SPAN);

		for (const opacity of await cardOpacities(page)) expect(opacity).toBeLessThan(0.05);

		/* Past the heading: the final translateY carries every card's top at least to the
		   header block's top edge — i.e. no lower than -(cards' rest top - header top),
		   which is further than the brief's -(header bottom - rest top) by the header's own
		   height. The lift is that distance plus half a card, so there is 229px to spare. */
		const { translateY, restToHeaderTop } = await page.evaluate(() => {
			const header = document.querySelector('.werkwijze__header') as HTMLElement;
			const row = document.querySelector('.werkwijze__row') as HTMLElement;
			return {
				translateY: [...document.querySelectorAll('.werkwijze__cards > li')].map(
					(li) => new DOMMatrix(getComputedStyle(li).transform).m42
				),
				restToHeaderTop: row.getBoundingClientRect().top - header.getBoundingClientRect().top
			};
		});
		expect(restToHeaderTop).toBeGreaterThan(0);
		for (const ty of translateY) expect(ty).toBeLessThanOrEqual(-restToHeaderTop);

		const cards = page.locator('.werkwijze__cards > li');
		for (let i = 0; i < 3; i++) {
			await expect(cards.nth(i)).toBeHidden();
			await expect(cards.nth(i)).toHaveCSS('visibility', 'hidden');
		}

		/* Out of the accessibility tree: the role query that finds the link everywhere else
		   in this file finds nothing now. The plain CSS locator is for the element itself. */
		await expect(
			page.locator('#werkwijze').getByRole('link', { name: 'Maak een afspraak' })
		).toHaveCount(0);
		const cta = page.locator('#werkwijze .wcard__cta a');
		await expect(cta).toHaveCount(1);
		await expect(cta).toBeHidden();
		const focusable = await cta.evaluate((el) => {
			(el as HTMLElement).focus();
			return document.activeElement === el;
		});
		expect(focusable, 'a fully faded card must not take focus').toBe(false);
	});

	test('scrolling back to the entry restores the staircase', async ({ page }) => {
		await open(page);
		const entry = await entryY(page);
		const aligned = await alignedY(page);
		await scrollAndSettle(page, entry);
		await scrollAndSettle(page, aligned + VH * FADE_SPAN);
		await scrollAndSettle(page, aligned);

		const alignedTops = await cardTops(page);
		expect(Math.max(...alignedTops) - Math.min(...alignedTops)).toBeLessThanOrEqual(2);
		expect(await cardOpacities(page)).toEqual([1, 1, 1]);
		await expect(page.locator('.werkwijze__cards > li').nth(2)).toBeVisible();

		await scrollAndSettle(page, entry);
		const rest = await rowTop(page);
		const tops = await cardTops(page);
		expect(Math.abs(tops[0]! - rest - BASE)).toBeLessThanOrEqual(2);
		expect(Math.abs(tops[1]! - tops[0]! - STEP)).toBeLessThanOrEqual(2);
		expect(Math.abs(tops[2]! - tops[0]! - 2 * STEP)).toBeLessThanOrEqual(2);
	});

	test('prefers-reduced-motion: reduce → aligned at entry, opacity 1, no staircase', async ({
		page
	}) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');
		const section = page.locator('#werkwijze');
		await expect(section).not.toHaveClass(/werkwijze--stairs/);

		await scrollAndSettle(page, await entryY(page));
		const tops = await cardTops(page);
		expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(2);
		expect(await cardOpacities(page)).toEqual([1, 1, 1]);

		const transforms = await page.evaluate(() =>
			[...document.querySelectorAll('.werkwijze__cards > li')].map(
				(li) => getComputedStyle(li).transform
			)
		);
		expect(transforms).toEqual(['none', 'none', 'none']);
	});
});
