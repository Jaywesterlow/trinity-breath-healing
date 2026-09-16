/**
 * werkwijze-staircase.spec.ts — the desktop staircase in
 * src/lib/components/global/Werkwijze.svelte (≥ 1024px, motion allowed).
 *
 * The three cards arrive as a staircase and leave as one row. With the section's top at
 * the bottom of the viewport, card 2 sits 306px below card 1 and card 3 612px below it;
 * over one viewport of scroll the lower cards catch up, so they are aligned the moment the
 * section has been scrolled through a full viewport height. Over the next 0.4 viewport all
 * three rise a further 240px past the page and fade to 0, and once fully faded they are
 * `visibility: hidden` so the link in card 3 is not a keyboard trap. Every step reverses on
 * the way back up, because the whole thing is a function of the scroll position — damped,
 * which is why each scroll here is followed by a wait: the row takes ~0.25s to settle.
 *
 * The mobile pin has its own spec (werkwijze-scrolljack.spec.ts) and is untouched by this.
 *
 * Real scroll geometry, hence Playwright rather than jsdom.
 * Run: npx playwright test tests/integration/werkwijze-staircase.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

const VH = 900;
const STEP = 306;
const SETTLE_MS = 800;

/** scrollY at which the section's top sits exactly on the viewport's bottom edge. */
async function entryY(page: Page): Promise<number> {
	return page.evaluate(() => {
		const section = document.querySelector('#werkwijze') as HTMLElement;
		return Math.round(section.getBoundingClientRect().top + window.scrollY - window.innerHeight);
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
	test('at section entry, card 2 sits ~306px and card 3 ~612px below card 1', async ({ page }) => {
		await open(page);
		await scrollAndSettle(page, await entryY(page));

		const tops = await cardTops(page);
		expect(Math.abs(tops[1]! - tops[0]! - STEP)).toBeLessThanOrEqual(2);
		expect(Math.abs(tops[2]! - tops[0]! - 2 * STEP)).toBeLessThanOrEqual(2);
		expect(await cardOpacities(page)).toEqual([1, 1, 1]);
	});

	test('one viewport of scroll later the three cards are on one line', async ({ page }) => {
		await open(page);
		const entry = await entryY(page);
		await scrollAndSettle(page, entry);
		await scrollAndSettle(page, entry + VH);

		const tops = await cardTops(page);
		expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(2);
		expect(await cardOpacities(page)).toEqual([1, 1, 1]);
	});

	test('aligned, the gap to the next section is one --section-pad', async ({ page }) => {
		await open(page);
		const entry = await entryY(page);
		await scrollAndSettle(page, entry);
		await scrollAndSettle(page, entry + VH);

		/* The cards leave their box early (240px of lift, then gone), so the section drops its
		   own bottom padding in staircase mode and the next section's top padding is the whole
		   gap: one --section-pad from the aligned row to the first thing Over mij draws, where
		   every other pair of sections has two. The first thing drawn is whichever content box
		   in the next section starts highest, so the test does not depend on that section's
		   layout; --section-pad is resolved to px through a probe element, since the token is
		   a clamp() string on :root. */
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

	test('a further 0.4 viewport on, the cards are faded out, hidden and unfocusable', async ({
		page
	}) => {
		await open(page);
		const entry = await entryY(page);
		await scrollAndSettle(page, entry);
		await scrollAndSettle(page, entry + VH);
		await scrollAndSettle(page, entry + VH * 1.4);

		for (const opacity of await cardOpacities(page)) expect(opacity).toBeLessThan(0.05);

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
		await scrollAndSettle(page, entry);
		await scrollAndSettle(page, entry + VH * 1.4);
		await scrollAndSettle(page, entry + VH);

		const aligned = await cardTops(page);
		expect(Math.max(...aligned) - Math.min(...aligned)).toBeLessThanOrEqual(2);
		expect(await cardOpacities(page)).toEqual([1, 1, 1]);
		await expect(page.locator('.werkwijze__cards > li').nth(2)).toBeVisible();

		await scrollAndSettle(page, entry);
		const tops = await cardTops(page);
		expect(Math.abs(tops[1]! - tops[0]! - STEP)).toBeLessThanOrEqual(2);
		expect(Math.abs(tops[2]! - tops[0]! - 2 * STEP)).toBeLessThanOrEqual(2);
	});

	test('prefers-reduced-motion: reduce → aligned at entry, opacity 1, no staircase', async ({
		page
	}) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');
		const section = page.locator('#werkwijze');
		await expect(section).toHaveAttribute('data-scroll-mode', 'native');
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
