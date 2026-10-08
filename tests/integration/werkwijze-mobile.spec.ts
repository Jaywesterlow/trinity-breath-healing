/**
 * werkwijze-mobile.spec.ts — the homepage Werkwijze section under 1100px.
 *
 * Phones and tablets get the three cards stacked top-down, scrolling with the page. There
 * is no pin, no horizontal slider and no sideways scroll anywhere on the page (the owner's
 * call, 2026-09-25; the old sticky-pin pan lived in werkwijze-scrolljack.spec.ts). The
 * desktop staircase at 1100px and up is covered by werkwijze-staircase.spec.ts.
 *
 * Run: npx playwright test tests/integration/werkwijze-mobile.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';

const VIEWPORTS = [
	{ name: 'phone', width: 390, height: 844 },
	{ name: 'landscape phone', width: 844, height: 390 },
	{ name: 'tablet', width: 820, height: 1180 },
	{ name: 'tablet 1024', width: 1024, height: 1366 }
];

async function cardBoxes(page: Page) {
	return page.evaluate(() =>
		[...document.querySelectorAll('.werkwijze__cards > li')].map((li) => {
			const r = li.getBoundingClientRect();
			return { top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left, right: r.right };
		})
	);
}

for (const vp of VIEWPORTS) {
	test.describe(`Werkwijze ${vp.name} ${vp.width}x${vp.height}`, () => {
		test.use({ viewport: { width: vp.width, height: vp.height } });

		test('cards stack top-down, centred, fully on screen', async ({ page }) => {
			await page.goto('/');
			await page.locator('#werkwijze').scrollIntoViewIfNeeded();
			const boxes = await cardBoxes(page);
			expect(boxes).toHaveLength(3);
			for (let i = 1; i < boxes.length; i++) {
				// Each card starts below the previous one ends: one column, reading order kept.
				expect(boxes[i]!.top).toBeGreaterThanOrEqual(boxes[i - 1]!.bottom);
				expect(Math.abs(boxes[i]!.left - boxes[0]!.left)).toBeLessThanOrEqual(1);
			}
			for (const b of boxes) {
				expect(b.left).toBeGreaterThanOrEqual(0);
				expect(b.right).toBeLessThanOrEqual(vp.width);
				// Centred: equal space either side, within a pixel.
				expect(Math.abs(b.left - (vp.width - b.right))).toBeLessThanOrEqual(1);
			}
		});

		test('no pin, no slider, no sideways scroll', async ({ page }) => {
			await page.goto('/');
			const state = await page.evaluate(() => {
				const cards = document.querySelector('.werkwijze__cards') as HTMLElement;
				const cs = getComputedStyle(cards);
				const stuck = [...document.querySelectorAll('#werkwijze *')].some(
					(el) => getComputedStyle(el).position === 'sticky'
				);
				return {
					overflowX: cs.overflowX,
					snap: cs.scrollSnapType,
					transform: cs.transform,
					canScrollSideways: cards.scrollWidth > cards.clientWidth,
					pageWider: document.documentElement.scrollWidth > window.innerWidth,
					stuck,
					stairs: document.querySelector('#werkwijze')!.classList.contains('werkwijze--stairs')
				};
			});
			expect(state).toEqual({
				overflowX: 'visible',
				snap: 'none',
				transform: 'none',
				canScrollSideways: false,
				pageWider: false,
				stuck: false,
				stairs: false
			});
		});

		test('every card CTA is reachable by keyboard', async ({ page }) => {
			await page.goto('/');
			const cta = page.locator('#werkwijze a', { hasText: 'Maak een afspraak' });
			await expect(cta).toBeVisible();
			await cta.focus();
			await expect(cta).toBeFocused();
			await expect(cta).toBeInViewport();
		});
	});
}
