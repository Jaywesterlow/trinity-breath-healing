/**
 * routes.spec.ts — Playwright integration test for Plan 05 Task 2.
 *
 * Verifies that all 14 stub routes:
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
 * Playwright config: tests/integration/ dir, webServer: pnpm preview on port 4173.
 * Run AFTER: PUBLIC_SITE_URL=https://trinity-breath-healing.vercel.app pnpm build
 *
 * Requirements: FND-08 (14 reserved stubs), Phase 0 success criterion #3
 */
import { test, expect } from '@playwright/test';
import { parse } from 'node-html-parser';
import { STUB_META } from '../../src/lib/seo/stub-meta';

const SITE_URL = 'https://trinity-breath-healing.vercel.app';

const STUB_PATHS = [
	'/werkwijze',
	'/over-mij',
	'/behandelingen',
	'/contact',
	'/diensten',
	'/diensten/mahatma-healing',
	'/diensten/goldhealing',
	'/diensten/raster-energie',
	'/diensten/spinal-touch',
	'/blog',
	'/artikelen',
	'/faq',
	'/privacyverklaring',
	'/algemene-voorwaarden'
] as const;

const SERVICE_SLUGS = ['mahatma-healing', 'goldhealing', 'raster-energie', 'spinal-touch'] as const;

test.describe.parallel('14 stub routes — SEO scaffolding', () => {
	for (const path of STUB_PATHS) {
		test(`GET ${path} returns 200 with correct SEO scaffolding`, async ({ page }) => {
			const response = await page.goto(path);

			// 1. HTTP 200
			expect(response?.status(), `${path} should return 200`).toBe(200);

			const html = await page.content();
			const root = parse(html);
			const stub = STUB_META[path]!;

			// 2. Exactly one <h1> matching the route's expected title text fragment
			const h1s = root.querySelectorAll('h1');
			expect(h1s.length, `${path}: expected exactly 1 <h1>`).toBe(1);
			// h1 text should contain the route's title (sans suffix)
			const h1Text = h1s[0]!.text.trim();
			expect(h1Text.length, `${path}: h1 should not be empty`).toBeGreaterThan(0);

			// 3. <title> matches STUB_META and is 50-60 chars
			const titleEl = root.querySelector('title');
			expect(titleEl, `${path}: should have <title>`).not.toBeNull();
			const titleText = titleEl!.text.trim();
			expect(titleText, `${path}: <title> should match STUB_META`).toBe(stub.title);
			expect(titleText.length, `${path}: <title> length should be 50-60`).toBeGreaterThanOrEqual(50);
			expect(titleText.length, `${path}: <title> length should be 50-60`).toBeLessThanOrEqual(60);

			// 4. meta description matches STUB_META and is 150-160 chars
			const metaDesc = root.querySelector('meta[name="description"]');
			expect(metaDesc, `${path}: should have meta description`).not.toBeNull();
			const descContent = metaDesc!.getAttribute('content') ?? '';
			expect(descContent, `${path}: meta description should match STUB_META`).toBe(stub.description);
			expect(descContent.length, `${path}: meta description should be 150-160 chars`).toBeGreaterThanOrEqual(150);
			expect(descContent.length, `${path}: meta description should be 150-160 chars`).toBeLessThanOrEqual(160);

			// 5. Canonical link href === SITE_URL + path
			const canonical = root.querySelector('link[rel="canonical"]');
			expect(canonical, `${path}: should have canonical link`).not.toBeNull();
			const canonicalHref = canonical!.getAttribute('href') ?? '';
			expect(canonicalHref, `${path}: canonical href should match SITE_URL + path`).toBe(`${SITE_URL}${path}`);

			// 6. Exactly one JSON-LD script; @graph has BreadcrumbList with correct crumbs
			const ldScripts = root.querySelectorAll('script[type="application/ld+json"]');
			expect(ldScripts.length, `${path}: expected exactly 1 JSON-LD script`).toBe(1);

			const payload = JSON.parse(ldScripts[0]!.text) as Record<string, unknown>;
			const graph = payload['@graph'] as Array<Record<string, unknown>>;
			expect(Array.isArray(graph), `${path}: @graph should be an array`).toBe(true);

			const breadcrumb = graph.find((n) => n['@type'] === 'BreadcrumbList');
			expect(breadcrumb, `${path}: @graph should contain BreadcrumbList`).not.toBeUndefined();
			const items = (breadcrumb!['itemListElement'] as Array<Record<string, unknown>>) ?? [];
			expect(items.length, `${path}: BreadcrumbList should have ${stub.crumbs.length} items`).toBe(stub.crumbs.length);
			// Verify crumb names match
			stub.crumbs.forEach((crumb, i) => {
				expect(items[i]!['name'], `${path}: crumb[${i}].name`).toBe(crumb.name);
			});

			// 7. Service-stub routes contain a Service node by @id
			const slug = path.replace('/diensten/', '');
			if ((SERVICE_SLUGS as readonly string[]).includes(slug)) {
				const serviceId = `${SITE_URL}/#service-${slug}`;
				const serviceNode = graph.find(
					(n) => n['@type'] === 'Service' && n['@id'] === serviceId
				);
				expect(serviceNode, `${path}: @graph should contain Service node with @id ${serviceId}`).not.toBeUndefined();
			}

			// 9. Stubs do NOT render <time datetime> (SEO-09 is landing-only in Phase 0)
			const timeEls = root.querySelectorAll('time[datetime]');
			expect(timeEls.length, `${path}: stubs must NOT contain <time datetime> (SEO-09 is landing-only)`).toBe(0);
		});
	}

	// 8. No two stubs render identical body content
	test('no two stubs have identical meta description content', () => {
		const descriptions = STUB_PATHS.map((p) => STUB_META[p]!.description);
		const unique = new Set(descriptions);
		expect(unique.size, 'All stub meta descriptions must be unique (Pitfall #7)').toBe(descriptions.length);
	});
});
