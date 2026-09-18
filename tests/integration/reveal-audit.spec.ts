/**
 * reveal-audit.spec.ts — how many things fade on a page, and how tall they are.
 *
 * The 2026-09-15 audit of `use:reveal` (see `src/lib/actions/reveal.ts`) had two measurable
 * outcomes, and this file keeps both from drifting back:
 *
 *   1. A ceiling per route on the number of elements the action touches. On `/` at
 *      1440x900 it was 82 before the audit — every heading, paragraph, list row, icon and
 *      hairline on its own — and 37 after. The ceilings below sit a few above the measured
 *      figures, so adding a section costs a deliberate edit here rather than going unnoticed.
 *
 *   2. Nothing taller than a third of the viewport carries the action itself. The band rule
 *      is top-in, bottom-out, so a tall box stays lit while its top half is off screen, next
 *      to a heading that has already faded — the inconsistency the owner read as a bug.
 *      Measured at both design viewports, because the same box is a different height on each.
 *
 * Method, the same as the probe the audit was done with: walk the page so every reveal has
 * fired at least once (an `entrance: false` element only gets an inline opacity after its
 * first drift), scroll back to the top, let the last drift end, then read every element with
 * an inline opacity — which, on this site, is exactly the set the action has touched.
 */
import { test, expect } from '@playwright/test';

/* Measured after the audit, then rounded up: '/' 33 (mobile) / 37 (desktop), '/werkwijze' 16,
   '/behandelingen' 13, '/diensten' 13, '/diensten/spinal-touch' 25, '/contact' 8 / 9,
   '/faq' 14.

   2026-09-16, the Over mij ledger: '/' is 35 (mobile) / 37 (desktop). The section fades
   in five pieces on both widths now — header, body-and-button, and one per ledger row,
   since three rows of 64px numerals are 391px and over the third — where the phone used
   to have three (header, scrim, stats). The note under the carousel is still one. The
   ceiling holds. */
const CEILING: Record<string, number> = {
	'/': 42,
	'/werkwijze': 20,
	'/behandelingen': 18,
	'/diensten': 18,
	'/diensten/spinal-touch': 30,
	/* The FAQ moved onto /contact on 2026-09-18 (was /faq, ceiling 20): the page is
	   now head + planner + the accordion, so its ceiling is the sum of the two. */
	'/contact': 34
};

type Revealed = { sel: string; height: number; width: number };

async function revealedElements(page: import('@playwright/test').Page): Promise<Revealed[]> {
	await page.evaluate(async () => {
		const step = innerHeight * 0.6;
		for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
			scrollTo(0, y);
			await new Promise((r) => setTimeout(r, 120));
		}
		scrollTo(0, 0);
	});
	await page.waitForTimeout(1500);
	return page.evaluate(() =>
		[...document.querySelectorAll<HTMLElement>('[style*="opacity"]')].map((el) => {
			const r = el.getBoundingClientRect();
			const cls = (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)[0] ?? '';
			return {
				sel: `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`,
				height: Math.round(r.height),
				width: Math.round(r.width)
			};
		})
	);
}

for (const [width, height, label] of [
	[390, 844, 'mobile'],
	[1440, 900, 'desktop']
] as const) {
	test.describe(`reveal audit at ${label} (${width}x${height})`, () => {
		test.use({ viewport: { width, height } });

		for (const [route, ceiling] of Object.entries(CEILING)) {
			test(`${route}: at most ${ceiling} revealed elements, none over a third of the viewport`, async ({
				page
			}) => {
				await page.goto(route, { waitUntil: 'networkidle' });
				const all = await revealedElements(page);
				/* Hidden alternates (a mobile-only intro on desktop, the contact panel before a
				   route is chosen) carry the action but fade nothing; the rule is about what is
				   seen. */
				const visible = all.filter((e) => e.height > 0 && e.width > 0);

				expect(visible.length, visible.map((e) => e.sel).join(', ')).toBeLessThanOrEqual(ceiling);

				const limit = height / 3;
				const tooTall = visible.filter((e) => e.height > limit);
				expect(
					tooTall,
					tooTall.map((e) => `${e.sel} is ${e.height}px, limit ${Math.round(limit)}px`).join('\n')
				).toEqual([]);
			});
		}
	});
}
