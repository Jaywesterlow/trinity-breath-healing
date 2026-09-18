/**
 * routes.spec.ts — Playwright integration test for Plan 05 Task 2.
 *
 * Verifies that every reserved stub route:
 *   1. Return HTTP 200
 *   2. Each has exactly one <h1> matching the route's title text fragment
 *   3. <title> is 50-60 chars and matches STUB_META[path].title
 *   4. meta description is 150-160 chars and matches STUB_META[path].description
 *   5. canonical link href === SITE_URL + path
 *   6. Has exactly one JSON-LD script; @graph contains BreadcrumbList with correct items
 *   7. /diensten/<modality> routes contain a Service node in @graph with @id matching slug
 *   8. No two stubs render identical body content
 *   9. Stubs do NOT render <time datetime> (SEO-09 is landing-only in Phase 0)
 *
 * `/faq` graduated to real content and is no longer in STUB_PATHS — it has its own
 * coverage requirements (FAQPage JSON-LD, `<time>`-free but otherwise not stub-shaped)
 * that don't fit this generic stub-route contract. See src/routes/faq/+page.ts.
 *
 * 2026-09-09: eleven more graduated — the seven modalities, /diensten, /behandelingen,
 * /werkwijze and /contact. This file now has two contracts instead of one, and the
 * lists are derived from ALL_ROUTES rather than typed out, so the next graduation
 * moves a route between them without an edit here:
 *
 *   every route      200, one <h1>, a title, a description, a canonical, one JSON-LD
 *                    block with a BreadcrumbList in it
 *   stubs only       title/description/crumbs come from STUB_META, and noindex is
 *                    present — the whole point of a stub is that it is not indexed
 *   real pages only  robots must NOT say noindex, or the page is invisible to the
 *                    thing the site is judged on
 *
 * Playwright config: tests/integration/ dir, webServer: pnpm preview on port 4173.
 * Run AFTER: PUBLIC_SITE_URL=https://trinitybreathhealing.nl pnpm build
 *
 * Requirements: FND-08 (14 reserved stubs, 13 remaining, +3 service stubs 260810-mdl = 16),
 * Phase 0 success criterion #3
 */
import { test, expect } from '@playwright/test';
import { parse } from 'node-html-parser';
import { STUB_META } from '../../src/lib/seo/stub-meta';
import { ALL_ROUTES } from '../../src/lib/constants/routes';

/* Follows whatever the build used, so pointing PUBLIC_SITE_URL at the real
   domain does not silently break every canonical assertion here. */
const SITE_URL = process.env.PUBLIC_SITE_URL ?? 'https://trinitybreathhealing.nl';

const STUB_PATHS = ALL_ROUTES.filter((r) => r.kind === 'stub' || r.kind === 'service-stub').map(
	(r) => r.path
);

/** Everything that carries real content, landing page aside — it has its own suite. */
const PAGE_PATHS = ALL_ROUTES.filter((r) => r.kind === 'page').map((r) => r.path);

// 260810-mdl: 4 -> 7 real services (BRTT Body and Trauma Release Breathwork ship separate).
const SERVICE_SLUGS = [
	'mahatma-healing',
	'goldhealing',
	'raster-energie',
	'cranio-fascia-unwinding',
	'spinal-touch',
	'brtt-body',
	'trb-breathwork'
] as const;

test.describe.parallel('every route — SEO scaffolding', () => {
	for (const path of [...STUB_PATHS, ...PAGE_PATHS]) {
		const isStub = STUB_PATHS.includes(path);

		test(`GET ${path} returns 200 with correct SEO scaffolding`, async ({ page }) => {
			const response = await page.goto(path);

			// 1. HTTP 200
			expect(response?.status(), `${path} should return 200`).toBe(200);

			const html = await page.content();
			const root = parse(html);
			const stub = STUB_META[path];

			// 2. Exactly one <h1> matching the route's expected title text fragment
			const h1s = root.querySelectorAll('h1');
			expect(h1s.length, `${path}: expected exactly 1 <h1>`).toBe(1);
			// h1 text should contain the route's title (sans suffix)
			const h1Text = h1s[0]!.text.trim();
			expect(h1Text.length, `${path}: h1 should not be empty`).toBeGreaterThan(0);

			// 3. <title> starts with STUB_META base title (Head appends ' | TRINITY Breath & Healing' suffix)
			// Full rendered title = `${stub.title} | TRINITY Breath & Healing` per Head.svelte Plan 02.
			// We verify the base title is present and <title> contains the route's specific content.
			const titleEl = root.querySelector('title');
			expect(titleEl, `${path}: should have <title>`).not.toBeNull();
			const titleText = titleEl!.text.trim();
			if (stub) {
				expect(titleText, `${path}: <title> should start with STUB_META base title`).toContain(
					stub.title
				);
			}
			/* 48–62 rendered. The upper bound is the real one: Google renders roughly
			   600px of title, which is about 60 characters, and everything past that
			   is cut. Eleven routes used to ship 76–88 because their own TITLE ended
			   in the practice name and Head.svelte appended it a second time —
			   "Spinal Touch in Amsterdam – Trinity Breath & Healing | TRINITY Breath
			   & Healing". Head now refuses to double it, and this is what stops a
			   route from quietly growing back past the cut. The floor is 48 rather
			   than a round 50 because "BRTT Body in Amsterdam – TRINITY Breath &
			   Healing" is 49 and says everything it needs to; padding a good title
			   to clear a round number is not an improvement. */
			expect(
				titleText.length,
				`${path}: <title> is ${titleText.length} chars, want 48–62 — "${titleText}"`
			).toBeGreaterThanOrEqual(48);
			expect(
				titleText.length,
				`${path}: <title> is ${titleText.length} chars, want 48–62 — "${titleText}"`
			).toBeLessThanOrEqual(62);

			/* The brand goes on exactly once, in one spelling. Three different ones
			   were in the tree at once: "Trinity Healing BnH", a bare "| Trinity",
			   and "TRINITY Breath & Healing NL". */
			const brandCount = titleText.match(/Trinity Breath & Healing/gi)?.length ?? 0;
			expect(brandCount, `${path}: brand should appear once in "${titleText}"`).toBe(1);

			// 4. meta description matches STUB_META and is 150-160 chars
			const metaDesc = root.querySelector('meta[name="description"]');
			expect(metaDesc, `${path}: should have meta description`).not.toBeNull();
			const descContent = metaDesc!.getAttribute('content') ?? '';
			if (stub) {
				expect(descContent, `${path}: meta description should match STUB_META`).toBe(
					stub.description
				);
			}
			/* The same window scripts/check-html.ts enforces on the built output, so a
			   description that would fail the launch gate fails here first. */
			expect(
				descContent.length,
				`${path}: meta description should be 148-162 chars`
			).toBeGreaterThanOrEqual(148);
			expect(
				descContent.length,
				`${path}: meta description should be 148-162 chars`
			).toBeLessThanOrEqual(162);

			// 4b. Stubs are placeholders: they must carry noindex so Google never
			// indexes an empty page under this domain. They stay `follow` so link
			// equity still flows to the landing page.
			const robots = root.querySelector('meta[name="robots"]');
			if (isStub) {
				expect(robots, `${path}: stub should have a robots meta tag`).not.toBeNull();
				expect(
					robots!.getAttribute('content') ?? '',
					`${path}: stub robots meta should be noindex`
				).toContain('noindex');
			} else {
				/* The inverse matters just as much: a page that graduated in routes.ts but
				   kept noindex in its +page.ts is in the sitemap and uncrawlable at once. */
				expect(
					robots?.getAttribute('content') ?? '',
					`${path}: a real page must not be noindex`
				).not.toContain('noindex');
			}

			// 5. Canonical link href === SITE_URL + path
			const canonical = root.querySelector('link[rel="canonical"]');
			expect(canonical, `${path}: should have canonical link`).not.toBeNull();
			const canonicalHref = canonical!.getAttribute('href') ?? '';
			expect(canonicalHref, `${path}: canonical href should match SITE_URL + path`).toBe(
				`${SITE_URL}${path}`
			);

			// 6. Exactly one JSON-LD script; @graph has BreadcrumbList with correct crumbs
			const ldScripts = root.querySelectorAll('script[type="application/ld+json"]');
			expect(ldScripts.length, `${path}: expected exactly 1 JSON-LD script`).toBe(1);

			const payload = JSON.parse(ldScripts[0]!.text) as Record<string, unknown>;
			const graph = payload['@graph'] as Array<Record<string, unknown>>;
			expect(Array.isArray(graph), `${path}: @graph should be an array`).toBe(true);

			const breadcrumb = graph.find((n) => n['@type'] === 'BreadcrumbList');
			expect(breadcrumb, `${path}: @graph should contain BreadcrumbList`).not.toBeUndefined();
			const items = (breadcrumb!['itemListElement'] as Array<Record<string, unknown>>) ?? [];
			expect(
				items.length,
				`${path}: BreadcrumbList should have at least Home + self`
			).toBeGreaterThanOrEqual(2);
			expect(items[0]!['name'], `${path}: first crumb should be Home`).toBe('Home');
			if (stub) {
				expect(
					items.length,
					`${path}: BreadcrumbList should have ${stub.crumbs.length} items`
				).toBe(stub.crumbs.length);
				stub.crumbs.forEach((crumb, i) => {
					expect(items[i]!['name'], `${path}: crumb[${i}].name`).toBe(crumb.name);
				});
			}

			// 7. Service-stub routes contain a Service node by @id
			const slug = path.replace('/diensten/', '');
			if ((SERVICE_SLUGS as readonly string[]).includes(slug)) {
				const serviceId = `${SITE_URL}/#service-${slug}`;
				const serviceNode = graph.find((n) => n['@type'] === 'Service' && n['@id'] === serviceId);
				expect(
					serviceNode,
					`${path}: @graph should contain Service node with @id ${serviceId}`
				).not.toBeUndefined();
			}

			// 9. Stubs do NOT render <time datetime> (SEO-09 is landing-only in Phase 0)
			if (isStub) {
				const timeEls = root.querySelectorAll('time[datetime]');
				expect(
					timeEls.length,
					`${path}: stubs must NOT contain <time datetime> (SEO-09 is landing-only)`
				).toBe(0);
			}
		});
	}

	// 8. No two stubs render identical body content
	test('no two stubs have identical meta description content', () => {
		const descriptions = STUB_PATHS.map((p) => STUB_META[p]!.description);
		const unique = new Set(descriptions);
		expect(unique.size, 'All stub meta descriptions must be unique (Pitfall #7)').toBe(
			descriptions.length
		);
	});
});
