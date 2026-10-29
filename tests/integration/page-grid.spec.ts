/**
 * page-grid.spec.ts — every page starts on the same vertical line.
 *
 * This is a regression test for a real bug, not a style preference. Subpages used
 * to pick one of two boxes: the container width (`/`, `/diensten`, `/contact`,
 * `/faq`) or a centred reading measure (everything else). At 1440px those two
 * disagree by 256px, so on half the site the breadcrumb and the <h1> started a
 * quarter of the screen to the right of the logo in the footer directly below
 * them, and clicking between two pages slid the heading sideways.
 *
 * The contract now: on every route, the breadcrumb, the <h1> and the footer share
 * one left edge. The reading measure still exists — it is applied to the children
 * of the page box rather than to the box itself, which is what lets the heading
 * stay on the grid while the paragraphs stay readable.
 *
 * Since 2026-10-29 a subpage's opening (PageHead) is centred on the owner's request,
 * so there the <h1> is held to the page box's centre line instead of its left edge.
 * The breadcrumb and the footer keep the shared left edge everywhere.
 *
 * Routes are derived from ALL_ROUTES, so a new page is covered the day it is added
 * rather than the day someone remembers to list it here.
 */
import { test, expect } from '@playwright/test';
import { ALL_ROUTES } from '../../src/lib/constants/routes';

/** The landing page has no breadcrumb — it is the crumb everything else points at. */
const left = (sel: string) =>
	`(() => { const e = document.querySelector(${JSON.stringify(sel)});
	          return e ? Math.round(e.getBoundingClientRect().left) : null; })()`;

for (const route of ALL_ROUTES) {
	test(`${route.path} — crumb and footer share a left edge, the h1 sits on the grid`, async ({
		page
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(route.path, { waitUntil: 'networkidle' });

		const crumb = await page.evaluate(left('nav[aria-label="Breadcrumb"] ol'));
		const h1 = await page.evaluate(left('h1'));
		const footer = await page.evaluate(left('footer a, footer p'));

		expect(h1, `${route.path} has no <h1>`).not.toBeNull();
		expect(footer, `${route.path} has no footer`).not.toBeNull();

		const centred = await page.evaluate(() => {
			const h = document.querySelector('.phead h1');
			const box = document.querySelector('.page');
			if (!h || !box) return null;
			const a = h.getBoundingClientRect();
			const b = box.getBoundingClientRect();
			return Math.abs(a.left + a.width / 2 - (b.left + b.width / 2));
		});
		if (centred !== null) {
			expect(centred, `centred <h1> is off the centre line on ${route.path}`).toBeLessThan(2);
		} else {
			expect(h1, `<h1> is off the grid on ${route.path}`).toBe(footer);
		}
		if (crumb !== null) {
			expect(crumb, `breadcrumb is off the grid on ${route.path}`).toBe(footer);
		}
	});
}
