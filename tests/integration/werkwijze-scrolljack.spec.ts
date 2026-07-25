/**
 * werkwijze-scrolljack.spec.ts — Playwright integration test for the sticky-pin +
 * tall-spacer horizontal scroll in src/lib/components/global/Werkwijze.svelte.
 *
 * Design doc: .planning/notes/RESEARCH-werkwijze-scroll.md
 *
 * This replaces the old scroll-lock (preventDefault + body.overflow: hidden +
 * hand-driven scrollLeft) machine, which could not survive an iOS touch fling — a
 * fling's momentum phase belongs to the OS compositor after touchend, with no event
 * left to cancel. The new model never blocks scroll at all:
 *
 *   1. `.werkwijze__pin` is made taller than the viewport by `--travel` (the horizontal
 *      distance the card track needs to move).
 *   2. `.werkwijze__sticky` is `position: sticky; top: 0`, so it visually holds still
 *      while the page scrolls through the tall pin.
 *   3. A scroll listener reads how far the pin has scrolled past the sticky point and
 *      writes that as `--progress` (0..1) on the `#werkwijze` section root; CSS maps
 *      `--progress * --travel` onto the card track's `translateX`.
 *
 * Native scroll is never intercepted — `window.scrollY` keeps advancing throughout,
 * which is the exact INVERSE of this file's old "scrollY frozen while locked"
 * assertion (see the "window.scrollY genuinely advances" test below, called out
 * explicitly because it is easy to misread as a regression of the old behaviour).
 *
 * `#werkwijze` carries `data-scroll-mode`, one of:
 *   - "native": default / desktop / reduced-motion / pre-hydration — plain
 *     `overflow-x: auto` snap slider, every card present in the initial HTML.
 *   - "pinned": mobile + !prefers-reduced-motion, after mount — tall pin + sticky +
 *     transform, driven by `--travel` / `--progress`.
 *
 * This is a poor fit for jsdom unit tests (no real scroll geometry / layout), hence a
 * live-interaction Playwright spec, consistent with the previous version of this file.
 * Uses standard Playwright page APIs directly (not the static-parse pattern of
 * routes.spec.ts), since this behavior is fundamentally about real scroll geometry.
 *
 * Playwright config: tests/integration/ dir, webServer: vite preview on port 4173.
 * Run: npx playwright test tests/integration/werkwijze-scrolljack.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const MAX_SCROLL_ITERATIONS = 60;

/** Reads --progress as a number, and the computed translateX (px) of .werkwijze__cards. */
async function readProgressAndTranslateX(page: Page): Promise<{ progress: number; x: number }> {
	return page.evaluate(() => {
		const section = document.querySelector('#werkwijze') as HTMLElement | null;
		const cards = document.querySelector('.werkwijze__cards') as HTMLElement | null;
		const progress = section
			? parseFloat(getComputedStyle(section).getPropertyValue('--progress'))
			: NaN;
		let x = 0;
		if (cards) {
			const transform = getComputedStyle(cards).transform;
			if (transform && transform !== 'none') {
				// matrix(a, b, c, d, tx, ty) — tx is the 5th value.
				const match = transform.match(/matrix\(([^)]+)\)/);
				if (match) {
					const parts = match[1]!.split(',').map((n) => parseFloat(n.trim()));
					x = parts[4] ?? 0;
				}
			}
		}
		return { progress, x };
	});
}

/** Reads --travel (px, parsed to a number) off the #werkwijze section root. */
async function getTravel(page: Page): Promise<number> {
	return page.evaluate(() => {
		const section = document.querySelector('#werkwijze') as HTMLElement | null;
		if (!section) return NaN;
		const raw = getComputedStyle(section).getPropertyValue('--travel');
		return parseFloat(raw);
	});
}

test.describe('Werkwijze mobile horizontal scroll — sticky pin + tall spacer', () => {
	test('mobile viewport: #werkwijze reports data-scroll-mode="pinned" after load', async ({
		page
	}) => {
		await page.goto('/');
		const section = page.locator('#werkwijze');
		await expect(section).toHaveCount(1);
		await expect(section).toHaveAttribute('data-scroll-mode', 'pinned');
		await expect(section).toHaveClass(/werkwijze--pinned/);
	});

	test('pin is taller than the sticky viewport slice: --travel > 0 and the section spans more than one viewport', async ({
		page
	}) => {
		await page.goto('/');
		await expect(page.locator('#werkwijze')).toHaveAttribute('data-scroll-mode', 'pinned');

		const travel = await getTravel(page);
		expect(travel, '--travel should be a positive px length once pinned').toBeGreaterThan(0);

		const { pinHeight, viewportHeight } = await page.evaluate(() => ({
			pinHeight: document.querySelector('.werkwijze__pin')?.getBoundingClientRect().height ?? 0,
			viewportHeight: window.innerHeight
		}));
		expect(
			pinHeight,
			'.werkwijze__pin should be taller than one viewport (100svh + --travel)'
		).toBeGreaterThan(viewportHeight);
	});

	test('scrolling through the section increases --progress monotonically toward 1, and translateX becomes increasingly negative', async ({
		page
	}) => {
		await page.goto('/');
		await expect(page.locator('#werkwijze')).toHaveAttribute('data-scroll-mode', 'pinned');

		// Scroll to just above the section so the pin is about to enter its sticky range.
		const pinTop = await page.evaluate(() => {
			const pin = document.querySelector('.werkwijze__pin');
			return pin ? window.scrollY + pin.getBoundingClientRect().top : 0;
		});
		await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 50)), pinTop);
		await page.waitForTimeout(50);

		let lastProgress = -Infinity;
		let lastX = Infinity;
		let sawIncrease = false;
		let reachedOne = false;

		for (let i = 0; i < MAX_SCROLL_ITERATIONS; i++) {
			await page.mouse.wheel(0, 120);
			await page.waitForTimeout(40);

			const { progress, x } = await readProgressAndTranslateX(page);

			// Monotonic (non-decreasing) progress toward 1.
			expect(
				progress,
				'progress must never decrease while scrolling forward'
			).toBeGreaterThanOrEqual(lastProgress === -Infinity ? -1 : lastProgress);
			if (progress > lastProgress + 1e-6) sawIncrease = true;

			// translateX should become increasingly negative (or stay equal) as progress rises.
			expect(
				x,
				'translateX must never move forward (less negative) while scrolling forward'
			).toBeLessThanOrEqual(lastX === Infinity ? 1 : lastX);

			lastProgress = progress;
			lastX = x;

			if (progress >= 1) {
				reachedOne = true;
				break;
			}
		}

		expect(sawIncrease, 'progress should have increased at least once while scrolling').toBe(true);
		expect(reachedOne, 'progress should reach 1 by the end of the pinned section').toBe(true);
	});

	test('window.scrollY genuinely advances while scrolling through the section — the inverse of the old scrollY-frozen lock', async ({
		page
	}) => {
		await page.goto('/');
		await expect(page.locator('#werkwijze')).toHaveAttribute('data-scroll-mode', 'pinned');

		const pinTop = await page.evaluate(() => {
			const pin = document.querySelector('.werkwijze__pin');
			return pin ? window.scrollY + pin.getBoundingClientRect().top : 0;
		});
		await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 50)), pinTop);
		await page.waitForTimeout(50);

		const scrollYBefore = await page.evaluate(() => window.scrollY);

		// The old spec asserted scrollY stayed FROZEN here. The new architecture never
		// blocks scroll, so scrollY must instead keep climbing through the whole section.
		for (let i = 0; i < 10; i++) {
			await page.mouse.wheel(0, 150);
			await page.waitForTimeout(40);
		}

		const scrollYAfter = await page.evaluate(() => window.scrollY);
		expect(
			scrollYAfter,
			'window.scrollY must advance while scrolling through the pinned section (native scroll is never blocked)'
		).toBeGreaterThan(scrollYBefore);
	});

	test('at progress === 1 the third card ("Verdieping") is visible in the viewport', async ({
		page
	}) => {
		await page.goto('/');
		await expect(page.locator('#werkwijze')).toHaveAttribute('data-scroll-mode', 'pinned');

		const pinTop = await page.evaluate(() => {
			const pin = document.querySelector('.werkwijze__pin');
			return pin ? window.scrollY + pin.getBoundingClientRect().top : 0;
		});
		await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 50)), pinTop);
		await page.waitForTimeout(50);

		let reachedOne = false;
		for (let i = 0; i < MAX_SCROLL_ITERATIONS; i++) {
			const { progress } = await readProgressAndTranslateX(page);
			if (progress >= 1) {
				reachedOne = true;
				break;
			}
			await page.mouse.wheel(0, 150);
			await page.waitForTimeout(40);
		}
		expect(reachedOne, 'should be able to reach progress === 1 by scrolling forward').toBe(true);

		const verdieping = page.locator('#werkwijze').getByText('Verdieping', { exact: true });
		const isInViewport = await verdieping.evaluate((el) => {
			const rect = el.getBoundingClientRect();
			return rect.left >= 0 && rect.right <= window.innerWidth && rect.width > 0 && rect.height > 0;
		});
		expect(
			isInViewport,
			'"Verdieping" card should be fully in the viewport at progress === 1'
		).toBe(true);
	});

	// Regression guard for a real bug: the track was first shipped with `overflow-x: hidden`
	// AND the transform on the same element. An element's overflow clip belongs to that
	// element, so translating it drags the clip along — card 1 slid out and cards 2 and 3 were
	// clipped out of sight for the whole pan, while still passing every geometry assertion
	// above (getBoundingClientRect knows nothing about ancestor clipping, so the cards
	// measured as "in the viewport" the entire time they were invisible on screen).
	//
	// Hence a structural assertion rather than a positional one: the element being transformed
	// must not clip, and the clipping must live on an ancestor that never moves.
	test('the transformed track does not clip; clipping lives on the static section', async ({
		page
	}) => {
		await page.goto('/');
		await expect(page.locator('#werkwijze')).toHaveAttribute('data-scroll-mode', 'pinned');

		const overflows = await page.evaluate(() => {
			const track = document.querySelector('.werkwijze__cards');
			const section = document.querySelector('#werkwijze');
			return {
				track: track ? getComputedStyle(track).overflowX : null,
				section: section ? getComputedStyle(section).overflowX : null
			};
		});

		expect(
			overflows.track,
			'the transformed track must not be a clipping/scrolling box — its clip would move with it'
		).toBe('visible');
		expect(
			overflows.section,
			'clipping belongs on the static section ancestor (clip, not hidden — hidden would break position: sticky)'
		).toBe('clip');
	});

	test('prefers-reduced-motion: reduce → data-scroll-mode stays "native", no transform on the track', async ({
		page
	}) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');

		const section = page.locator('#werkwijze');
		await expect(section).toHaveAttribute('data-scroll-mode', 'native');
		await expect(section).not.toHaveClass(/werkwijze--pinned/);

		for (let i = 0; i < 10; i++) {
			await page.mouse.wheel(0, 200);
			await page.waitForTimeout(40);
			await expect(section, 'mode must stay native under reduced motion').toHaveAttribute(
				'data-scroll-mode',
				'native'
			);
		}

		const transform = await page.evaluate(() => {
			const cards = document.querySelector('.werkwijze__cards');
			return cards ? getComputedStyle(cards).transform : null;
		});
		expect(transform, 'card track should have no transform under reduced motion').toBe('none');
	});

	test('desktop viewport → data-scroll-mode stays "native"', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto('/');

		const section = page.locator('#werkwijze');
		await expect(section).toHaveAttribute('data-scroll-mode', 'native');
		await expect(section).not.toHaveClass(/werkwijze--pinned/);

		for (let i = 0; i < 6; i++) {
			await page.mouse.wheel(0, 300);
			await page.waitForTimeout(40);
			await expect(section, 'mode must stay native on desktop').toHaveAttribute(
				'data-scroll-mode',
				'native'
			);
		}
	});

	test('Tab still moves focus through card CTAs in pinned mode', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('#werkwijze')).toHaveAttribute('data-scroll-mode', 'pinned');

		const cta = page.locator('#werkwijze').getByRole('link', { name: 'Maak een afspraak' });

		let focused = false;
		for (let i = 0; i < 60; i++) {
			await page.keyboard.press('Tab');
			const isFocused = await cta.evaluate((el) => el === document.activeElement);
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
