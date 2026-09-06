/**
 * reveal.spec.ts — the below-the-fold scroll reveal in `src/lib/actions/reveal.ts`,
 * applied to `Faq.svelte` and `OverMij.svelte`.
 *
 * The contract that matters most for this site (see CLAUDE.md — SEO/AEO is the primary
 * success metric): the prerendered HTML must be complete with JavaScript disabled, because
 * that is what AI crawlers and Google actually see. Svelte actions never run during SSR, so
 * the hidden state can only ever be armed client-side — this file's first test is the proof
 * that holds.
 *
 * Follows the conventions of `faq-disclosure.spec.ts` (viewport, page.goto('/')) and
 * `html-audit.spec.ts` (reading prerendered output straight off disk, which requires
 * `npm run build` to have already run and needs no running preview server).
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

test.use({ viewport: { width: 390, height: 844 } });

const PRERENDERED_INDEX = path.resolve('.svelte-kit/output/prerendered/pages/index.html');

const FAQ_HEADING_TEXT = 'Veelgestelde vragen';
const ABOUT_BODY_TEXT = 'Ik ben 53 jaar en weet uit eigen ervaring hoe het voelt om vast te lopen.';

test.describe('reveal: prerendered HTML (no JS)', () => {
	test('FAQ heading and About body are present, with no opacity: 0 inline style', () => {
		const html = readFileSync(PRERENDERED_INDEX, 'utf8');

		expect(html).toContain(FAQ_HEADING_TEXT);
		expect(html).toContain(ABOUT_BODY_TEXT);

		// The reveal action is a Svelte action — it never runs on the server, so nothing in the
		// prerendered output should carry the hidden starting state. A stray `opacity: 0` here
		// would mean below-the-fold content is invisible to any crawler that doesn't run JS.
		expect(html).not.toMatch(/opacity:\s*0[^.]/);
	});
});

test.describe('reveal: armed then revealed (JS)', () => {
	test('faq__heading is armed below the fold, then reaches opacity 1 once scrolled into view', async ({
		page
	}) => {
		await page.goto('/');
		const heading = page.locator('.faq__heading');

		// Below the fold at load, on a 390x844 viewport — armed, not yet revealed.
		const armedOpacity = await heading.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
		expect(armedOpacity).toBeLessThan(1);

		await heading.scrollIntoViewIfNeeded();

		await expect(async () => {
			const opacity = await heading.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
			expect(opacity).toBe(1);
		}).toPass({ timeout: 5000 });
	});

	/* `transform` must go; `opacity` must stay. A leftover transform makes the element a
	   containing block for any fixed/sticky descendant, which silently breaks that
	   positioning elsewhere on the page — that is the bug this test was written for.
	   Opacity is different: the action keeps driving it after the entrance, because the
	   element now fades back out when it leaves the viewport. */
	test('the transform is stripped once the fade ends, and opacity is left at 1', async ({
		page
	}) => {
		await page.goto('/');
		const heading = page.locator('.faq__heading');
		await heading.scrollIntoViewIfNeeded();

		await expect(async () => {
			const style = await heading.getAttribute('style');
			expect(style ?? '').not.toContain('transform');
			expect(style ?? '').toContain('opacity: 1');
		}).toPass({ timeout: 5000 });
	});

	/* The exit half of the same action: an element that has been revealed fades out again as
	   it leaves through the top of the viewport, and fades back in on the way down. Both
	   directions, because a one-way fade would leave the top of the page blank after any
	   scroll back up. */
	test('fades out when scrolled past, and back in on the way down', async ({ page }) => {
		await page.goto('/');
		const heading = page.locator('.about__heading');
		await heading.evaluate((el) => el.scrollIntoView({ block: 'center' }));

		const opacity = () => heading.evaluate((el) => parseFloat(getComputedStyle(el).opacity));

		await expect(async () => expect(await opacity()).toBe(1)).toPass({ timeout: 5000 });

		// Past the top of the viewport.
		await page.evaluate(() => window.scrollBy(0, 900));
		await expect(async () => expect(await opacity()).toBeLessThan(0.1)).toPass({ timeout: 4000 });

		// And back.
		await heading.evaluate((el) => el.scrollIntoView({ block: 'center' }));
		await expect(async () => expect(await opacity()).toBe(1)).toPass({ timeout: 4000 });
	});
});

test.describe('reveal: prefers-reduced-motion', () => {
	test('faq__heading is opacity 1 immediately, with no inline style at all', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');
		const heading = page.locator('.faq__heading');

		const opacity = await heading.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
		expect(opacity).toBe(1);

		const style = await heading.getAttribute('style');
		expect(style).toBeFalsy();
	});
});
