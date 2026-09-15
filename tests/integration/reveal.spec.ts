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
/* The kill switch, read from the action itself so this file cannot disagree with it. The
   module touches nothing browser-only at import time, so it loads fine under Node here. */
import { EXIT_FADE } from '../../src/lib/actions/reveal';

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
	   scroll back up. Guarded by the kill switch: with EXIT_FADE off there is no exit to
	   test, and the entrance tests above are the whole contract. */
	test('fades out when scrolled past, and back in on the way down', async ({ page }) => {
		test.skip(!EXIT_FADE, 'EXIT_FADE is off in reveal.ts: nothing fades out by design');
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

/* A fast scroll, then a dead stop — and nothing may move.
 *
 * This is the "blink" the owner saw: scroll quickly enough that a block enters the band
 * and leaves it again inside the entrance fade (1300ms at the time, 600ms now), stop, and a
 * moment later that block pops from invisible to two-thirds lit in a single frame while
 * sitting above the viewport. The cause was in `driftTo`: it read `from` off the inline
 * style, which the still-running entrance animation had not written yet, so it animated
 * 0 -> 0 on top of the entrance instead of ending it; when that no-op finished (450ms
 * then, 300ms now) the entrance was uncovered mid-flight. The fix ends the entrance the
 * moment the band is crossed and starts the drift from the rendered opacity, so every
 * change is a fade and never a jump.
 *
 * Sampled per animation frame with the scroll position asserted frozen: the only thing that
 * may change an opacity here is a running animation. The shortest fade is 300ms, and its
 * easing never moves more than about 1.9x linear, so between two frames 16ms apart it can
 * move at most a tenth of its range; it takes a frame of 80ms or more before a legitimate
 * fade can cross half. A loaded test runner does stall frames that long, so the allowance
 * scales with the measured frame time instead of being a flat half — a stalled frame is
 * not a blink. The viewport matches the reproduction; the bug is not specific to it, but
 * this is the size it was traced at. */
test.describe('reveal: a fast scroll then a stop never jumps', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('no revealed element changes opacity by more than 0.5 between two frames', async ({
		page
	}) => {
		await page.goto('/', { waitUntil: 'networkidle' });

		const jumps: string[] = await page.evaluate(async () => {
			const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
			const log: string[] = [];

			/* Everything the action has touched: an inline opacity or a running animation. */
			const watched = [...document.querySelectorAll<HTMLElement>('h1,h2,h3,p,li,a,div')].filter(
				(el) =>
					(el.getAttribute('style') ?? '').includes('opacity') || el.getAnimations().length > 0
			);

			/* Ten screens in ten frames, so blocks enter and leave the band well inside the
			   entrance's 600ms — then stop dead. */
			for (let i = 0; i < 10; i++) {
				window.scrollBy(0, 700);
				await frame();
			}
			const frozenY = window.scrollY;

			const last = new Map(watched.map((el) => [el, parseFloat(getComputedStyle(el).opacity)]));
			const t0 = performance.now();
			let prev = t0;

			while (performance.now() - t0 < 3000) {
				await frame();
				const t = performance.now();
				/* What the shortest (300ms) fade could legitimately move in a frame this long;
				   never below half, which is the jump the bug produced at 60fps. */
				const allowed = Math.max(0.5, (1.9 * (t - prev)) / 300);
				prev = t;
				if (window.scrollY !== frozenY) {
					log.push(`scroll drifted from ${frozenY} to ${window.scrollY}`);
					break;
				}
				for (const el of watched) {
					const now = parseFloat(getComputedStyle(el).opacity);
					const was = last.get(el)!;
					if (Math.abs(now - was) > allowed) {
						const r = el.getBoundingClientRect();
						log.push(
							`t=${Math.round(performance.now() - t0)}ms ${was.toFixed(2)} -> ${now.toFixed(2)} ` +
								`rect.top=${Math.round(r.top)} <${el.tagName.toLowerCase()}.${(el.className || '').split(' ')[0]}> ` +
								`"${(el.textContent ?? '').trim().slice(0, 32)}"`
						);
					}
					last.set(el, now);
				}
			}
			return log;
		});

		expect(jumps, jumps.join('\n')).toEqual([]);
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
