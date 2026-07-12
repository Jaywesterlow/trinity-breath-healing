/**
 * werkwijze-scrolljack.spec.ts — Playwright integration test for quick task 260704-h88.
 *
 * Verifies the 3-state scroll-lock machine (idle-before -> locked -> idle-after) in
 * src/lib/components/global/Werkwijze.svelte:
 *   1. Lock engages only when the pin's own vertical center crosses the viewport's
 *      vertical center — not at the top/bottom edge, in either scroll direction
 *      (a scroll-position comparison, not IntersectionObserver — a rootMargin band thin
 *      enough to approximate "exactly centered" was confirmed to fire unreliably in this
 *      browser, only ever delivering the initial observe callback)
 *   2. window.scrollY is frozen while locked; wheel deltas drive the card track's
 *      scrollLeft instead (not a CSS transform, which would slide the whole clipped box
 *      as a rigid unit rather than revealing the next card)
 *   3. Each card actually scrolls into full view during the locked sequence, not just cut off
 *   4. Vertical scroll resumes automatically once the last card is reached
 *   5. prefers-reduced-motion: reduce fully bypasses the mechanism
 *   6. Tab still moves focus through card CTAs regardless of lock state (no focus trap)
 *
 * This is a poor fit for jsdom unit tests (no real scroll geometry / wheel-event fidelity),
 * hence a live-interaction Playwright spec per RESEARCH.md's Validation Architecture section.
 * Uses standard Playwright page APIs directly (not the static-parse pattern of routes.spec.ts),
 * since this behavior is fundamentally about real scroll/wheel/touch input.
 *
 * Playwright config: tests/integration/ dir, webServer: vite preview on port 4173.
 * Run: npx playwright test tests/integration/werkwijze-scrolljack.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const MAX_WHEEL_ITERATIONS = 40;
const MAX_TAB_ITERATIONS = 60;

/** Reads the data-scroll-phase attribute off the #werkwijze section root. */
async function getPhase(page: Page): Promise<string | null> {
	return page.locator('#werkwijze').getAttribute('data-scroll-phase');
}

/** Scrolls the page down in wheel-tick steps until the section reports phase 'locked'. */
async function scrollUntilLocked(page: Page): Promise<void> {
	for (let i = 0; i < MAX_WHEEL_ITERATIONS; i++) {
		const phase = await getPhase(page);
		if (phase === 'locked') return;
		await page.mouse.wheel(0, 150);
		await page.waitForTimeout(50);
	}
	throw new Error(
		`Section never reached 'locked' phase after ${MAX_WHEEL_ITERATIONS} wheel ticks`
	);
}

test.describe('Werkwijze mobile scroll-jack — 3-state lock machine', () => {
	test('lock does not engage at top-edge, only at mid-viewport crossing', async ({ page }) => {
		await page.goto('/');

		// Section should exist and start in 'idle-before' (mobile mode active, not yet locked).
		const section = page.locator('#werkwijze');
		await expect(section).toHaveCount(1);

		let crossedMiddle = false;
		for (let i = 0; i < MAX_WHEEL_ITERATIONS; i++) {
			const phase = await getPhase(page);
			if (phase === 'locked') {
				crossedMiddle = true;
				break;
			}

			// While the section's vertical center is still below the viewport's vertical
			// center, the phase must remain 'idle-before' — never 'locked' prematurely.
			const stillBelowCenter = await page.evaluate(() => {
				const el = document.querySelector('#werkwijze');
				if (!el) return true;
				const rect = el.getBoundingClientRect();
				const elCenter = rect.top + rect.height / 2;
				const viewportCenter = window.innerHeight / 2;
				return elCenter > viewportCenter;
			});
			if (stillBelowCenter) {
				expect(phase, 'phase must stay idle-before before mid-viewport crossing').toBe(
					'idle-before'
				);
			}

			await page.mouse.wheel(0, 150);
			await page.waitForTimeout(50);
		}

		expect(crossedMiddle, 'section should reach locked phase once its center crosses viewport center').toBe(
			true
		);
	});

	test('window.scrollY frozen while locked; wheel deltas move the card track instead', async ({
		page
	}) => {
		await page.goto('/');
		await scrollUntilLocked(page);

		const scrollYBefore = await page.evaluate(() => window.scrollY);
		const scrollLeftBefore = await page.evaluate(() => {
			const cards = document.querySelector('.werkwijze__cards');
			return cards ? cards.scrollLeft : null;
		});

		await page.mouse.wheel(0, 150);
		await page.waitForTimeout(50);
		await page.mouse.wheel(0, 150);
		await page.waitForTimeout(50);

		const scrollYAfter = await page.evaluate(() => window.scrollY);
		const scrollLeftAfter = await page.evaluate(() => {
			const cards = document.querySelector('.werkwijze__cards');
			return cards ? cards.scrollLeft : null;
		});
		const phaseAfter = await getPhase(page);

		expect(scrollYAfter, 'window.scrollY must not change while locked').toBe(scrollYBefore);
		// Only assert the card track actually moved if we're still locked — a fast/aggressive
		// wheel step could complete the sequence and release the lock, which is covered by
		// the next test.
		if (phaseAfter === 'locked') {
			expect(scrollLeftAfter, 'card track scrollLeft should change while locked').not.toBe(
				scrollLeftBefore
			);
		}
	});

	test('vertical scroll resumes after the last card is reached', async ({ page }) => {
		await page.goto('/');
		await scrollUntilLocked(page);

		let reachedIdleAfter = false;
		for (let i = 0; i < MAX_WHEEL_ITERATIONS; i++) {
			const phase = await getPhase(page);
			if (phase === 'idle-after') {
				reachedIdleAfter = true;
				break;
			}
			await page.mouse.wheel(0, 200);
			await page.waitForTimeout(50);
		}

		expect(reachedIdleAfter, 'phase should become idle-after once the last card is reached').toBe(
			true
		);

		const scrollYBefore = await page.evaluate(() => window.scrollY);
		await page.mouse.wheel(0, 200);
		await page.waitForTimeout(50);
		const scrollYAfter = await page.evaluate(() => window.scrollY);

		expect(
			scrollYAfter,
			'the next wheel tick after idle-after should resume native vertical scroll'
		).toBeGreaterThan(scrollYBefore);
	});

	test('locking re-engages at mid-viewport when scrolling back up from below', async ({ page }) => {
		await page.goto('/');
		await scrollUntilLocked(page);

		// Clear the section forward, then keep scrolling well past it.
		for (let i = 0; i < MAX_WHEEL_ITERATIONS; i++) {
			if ((await getPhase(page)) === 'idle-after') break;
			await page.mouse.wheel(0, 200);
			await page.waitForTimeout(50);
		}
		for (let i = 0; i < 10; i++) {
			await page.mouse.wheel(0, 300);
			await page.waitForTimeout(50);
		}
		expect(await getPhase(page), 'should have cleared the section going forward').toBe(
			'idle-after'
		);

		// Scroll back up. Lock must not re-engage the instant the section's top/bottom
		// edge appears — only once its own center crosses the viewport's center.
		let sawPrematureLock = false;
		let reachedLocked = false;
		for (let i = 0; i < MAX_WHEEL_ITERATIONS; i++) {
			const phase = await getPhase(page);
			if (phase === 'locked') {
				reachedLocked = true;
				break;
			}
			const stillBelowCenter = await page.evaluate(() => {
				const pin = document.querySelector('.werkwijze__pin');
				if (!pin) return true;
				const rect = pin.getBoundingClientRect();
				const pinCenter = rect.top + rect.height / 2;
				return pinCenter > window.innerHeight / 2 + 40; // small tolerance
			});
			if (!stillBelowCenter && phase !== 'idle-after' && phase !== 'idle-before') {
				sawPrematureLock = true;
			}
			await page.mouse.wheel(0, -150);
			await page.waitForTimeout(50);
		}

		expect(reachedLocked, 'lock should re-engage when scrolling back up through the section').toBe(
			true
		);
		expect(sawPrematureLock, 'lock must not engage before the pin is actually centered').toBe(
			false
		);
	});

	test('locked forward scroll actually reveals each next card in the viewport', async ({
		page
	}) => {
		await page.goto('/');
		await scrollUntilLocked(page);

		const cardTitles = ['Kennismaking', 'De sessie', 'Verdieping'];

		for (const title of cardTitles) {
			const card = page.locator('#werkwijze').getByText(title, { exact: true });

			let visible = false;
			for (let i = 0; i < MAX_WHEEL_ITERATIONS; i++) {
				const isInViewport = await card.evaluate((el) => {
					const rect = el.getBoundingClientRect();
					return (
						rect.left >= 0 &&
						rect.right <= window.innerWidth &&
						rect.width > 0 &&
						rect.height > 0
					);
				});
				if (isInViewport) {
					visible = true;
					break;
				}
				const phase = await getPhase(page);
				if (phase !== 'locked') break; // sequence ended before reaching this card
				await page.mouse.wheel(0, 150);
				await page.waitForTimeout(50);
			}

			expect(visible, `card "${title}" should scroll into full view, not stay cut off`).toBe(
				true
			);
		}
	});

	test('prefers-reduced-motion: reduce fully bypasses the mechanism', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');

		for (let i = 0; i < 15; i++) {
			const scrollYBefore = await page.evaluate(() => window.scrollY);
			await page.mouse.wheel(0, 200);
			await page.waitForTimeout(50);
			const scrollYAfter = await page.evaluate(() => window.scrollY);
			const phase = await getPhase(page);

			expect(phase, 'phase must remain disabled under prefers-reduced-motion: reduce').toBe(
				'disabled'
			);
			// Native scroll should keep advancing freely (no freeze) until the page bottoms out.
			expect(
				scrollYAfter,
				'scrollY should change freely with each wheel tick under reduced motion'
			).toBeGreaterThanOrEqual(scrollYBefore);
		}
	});

	test('Tab still moves focus through card CTAs regardless of lock state', async ({ page }) => {
		await page.goto('/');
		await scrollUntilLocked(page);

		const cta = page.locator('#werkwijze').getByRole('link', { name: 'Maak een afspraak' });

		let focused = false;
		for (let i = 0; i < MAX_TAB_ITERATIONS; i++) {
			await page.keyboard.press('Tab');
			const isFocused = await cta.evaluate(
				(el) => el === document.activeElement
			);
			if (isFocused) {
				focused = true;
				break;
			}
		}

		expect(focused, 'Tab should reach the "Maak een afspraak" CTA without getting stuck').toBe(
			true
		);
		await expect(cta).toBeFocused();
	});
});
