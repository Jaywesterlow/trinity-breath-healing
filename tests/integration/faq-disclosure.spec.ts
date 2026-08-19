/**
 * faq-disclosure.spec.ts — the FAQ open/close transition in
 * src/lib/components/global/Faq.svelte.
 *
 * Three things here have each been shipped broken once, none of them visible to a
 * type check, a lint, or a snapshot:
 *
 *   1. The question text jumped. `grid-template-rows: auto 0fr` gives the summary an
 *      `auto` track, and an `auto` track absorbs free space — so mid-transition the
 *      summary row swallowed height the content row could not yet hold, and the
 *      question dropped ~65px and sprang back on every open.
 *   2. Closing did not animate. The close depends on the panel still being rendered
 *      while it collapses, which pure CSS can only achieve via
 *      `content-visibility ... allow-discrete` — honoured in Chromium, not everywhere.
 *      It is now driven from script: `data-closing` collapses the panel while `open`
 *      is still set, and `open` is dropped only once the row transition ends.
 *   3. Those `[data-closing]` rules were silently removed from the build. Svelte prunes
 *      CSS it cannot statically match, and the attribute is set imperatively, so the
 *      rules were dropped and the close reverted to instant. They are `:global()` now.
 *
 * All three pass a build. Only behaviour catches them, hence this file.
 */
import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const item = '.faq__item';

/** Samples the first item's height every frame for `ms`, returning the distinct values. */
async function sampleHeights(page: Page, ms: number): Promise<number[]> {
	return page.evaluate((ms) => {
		const el = document.querySelector('.faq__item') as HTMLElement;
		const out: number[] = [];
		let stop = false;
		(function tick() {
			out.push(Math.round(el.getBoundingClientRect().height));
			if (!stop) requestAnimationFrame(tick);
		})();
		return new Promise<number[]>((r) =>
			setTimeout(() => {
				stop = true;
				r(out);
			}, ms)
		);
	}, ms);
}

test.describe('FAQ disclosure transition', () => {
	test('opens gradually rather than snapping, and the question text never moves', async ({
		page
	}) => {
		await page.goto('/');
		const summary = page.locator(item).first().locator('summary');
		await summary.scrollIntoViewIfNeeded();

		const pending = sampleHeights(page, 900);
		// Sample the summary row across the same window — it must be constant. This is the
		// track-sizing regression: a single distinct value means the question held still.
		const rowsPending = page.evaluate(() => {
			const el = document.querySelector('.faq__item') as HTMLElement;
			const out: number[] = [];
			let stop = false;
			(function tick() {
				out.push(parseFloat(getComputedStyle(el).gridTemplateRows.split(' ')[0]!));
				if (!stop) requestAnimationFrame(tick);
			})();
			return new Promise<number[]>((r) =>
				setTimeout(() => {
					stop = true;
					r(out);
				}, 900)
			);
		});
		await summary.click();
		const heights = await pending;
		const summaryRows = new Set(await rowsPending);

		expect(
			new Set(heights).size,
			'opening must pass through many intermediate heights, not jump in one step'
		).toBeGreaterThan(8);
		expect(heights.at(-1)!).toBeGreaterThan(heights[0]!);
		expect(
			summaryRows.size,
			`the summary row must stay one fixed height while the panel opens, saw ${[...summaryRows].join('/')}`
		).toBe(1);
	});

	test('closing animates — the panel collapses while still rendered', async ({ page }) => {
		await page.goto('/');
		const el = page.locator(item).first();
		const summary = el.locator('summary');
		await summary.scrollIntoViewIfNeeded();

		await summary.click();
		await page.waitForTimeout(800);
		const openHeight = (await el.boundingBox())!.height;

		const pending = sampleHeights(page, 900);
		await summary.click();

		// Mid-collapse the element must still be open and marked closing — that is what keeps
		// the panel rendered, and therefore what makes the collapse visible at all.
		await page.waitForTimeout(150);
		await expect(el).toHaveAttribute('data-closing', '');
		const mid = (await el.boundingBox())!.height;
		expect(mid, 'panel should be partway shut, not already gone').toBeGreaterThan(80);
		expect(mid).toBeLessThan(openHeight);

		const heights = await pending;
		expect(
			new Set(heights).size,
			'closing must pass through many intermediate heights, not jump in one step'
		).toBeGreaterThan(8);

		// And it must actually finish, with the holding attribute cleaned up.
		await expect(el).not.toHaveAttribute('data-closing', '');
		expect(await el.evaluate((n: HTMLDetailsElement) => n.open)).toBe(false);
	});

	test('clicking again mid-close cancels it, and the panel stays usable', async ({ page }) => {
		await page.goto('/');
		const el = page.locator(item).first();
		const summary = el.locator('summary');
		await summary.scrollIntoViewIfNeeded();

		await summary.click();
		await page.waitForTimeout(800);
		await summary.click(); // begin closing
		await page.waitForTimeout(150);
		await summary.click(); // change of mind
		await page.waitForTimeout(900);

		expect(await el.evaluate((n: HTMLDetailsElement) => n.open)).toBe(true);
		await expect(el).not.toHaveAttribute('data-closing', '');

		// Still closable afterwards — a cancelled close must not leave it wedged open.
		await summary.click();
		await page.waitForTimeout(900);
		expect(await el.evaluate((n: HTMLDetailsElement) => n.open)).toBe(false);
	});

	test('prefers-reduced-motion: closes immediately and never wedges open', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');
		const el = page.locator(item).first();
		const summary = el.locator('summary');
		await summary.scrollIntoViewIfNeeded();

		await summary.click();
		await page.waitForTimeout(150);
		expect(await el.evaluate((n: HTMLDetailsElement) => n.open)).toBe(true);

		await summary.click();
		await page.waitForTimeout(150);
		expect(await el.evaluate((n: HTMLDetailsElement) => n.open)).toBe(false);
		await expect(el).not.toHaveAttribute('data-closing', '');
	});

	test('every answer is in the initial HTML, open or not', async ({ page }) => {
		// The reason this section is built on <details>: the script must never be what puts
		// the answers on the page, or crawlers see empty questions.
		const res = await page.goto('/');
		const html = (await res!.text()).replace(/\s+/g, ' ');
		const answers = await page.locator('.faq__answer').allTextContents();
		expect(answers.length).toBeGreaterThan(0);
		for (const answer of answers) {
			expect(html).toContain(answer.trim().replace(/\s+/g, ' ').slice(0, 60));
		}
	});
});
