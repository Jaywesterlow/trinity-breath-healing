import { describe, it, expect, beforeEach, vi } from 'vitest';

const MOCK_SITE_URL = 'https://trinity-breath-healing.vercel.app';

describe('sitemap.xml GET handler', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_SITE_URL: MOCK_SITE_URL }
		}));
	});

	it('returns Response with Content-Type application/xml', async () => {
		const { GET } = await import('../../src/routes/sitemap.xml/+server');
		const response = await GET({} as Parameters<typeof GET>[0]);
		expect(response.headers.get('Content-Type')).toBe('application/xml');
	});

	it('response body contains urlset root element with sitemaps xmlns', async () => {
		const { GET } = await import('../../src/routes/sitemap.xml/+server');
		const response = await GET({} as Parameters<typeof GET>[0]);
		const body = await response.text();
		expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
	});

	/* Only routes with real content are submitted — stubs stay reserved in
	   ALL_ROUTES but out of the sitemap, so the count tracks published pages
	   rather than the manifest's length. */
	it('lists only published routes, never stubs', async () => {
		const { GET } = await import('../../src/routes/sitemap.xml/+server');
		const response = await GET({} as Parameters<typeof GET>[0]);
		const body = await response.text();
		const matches = body.match(/<url>/g);
		const { ALL_ROUTES } = await import('../../src/lib/constants/routes');
		const published = ALL_ROUTES.filter(
			(r) => r.kind !== 'stub' && r.kind !== 'service-stub'
		).length;
		expect(matches?.length).toBe(published);

		/* Derived, not a hardcoded example path: graduating a route to real
		   content used to break this assertion because the one path it named had
		   become published. Assert the property instead — no stub, whichever
		   they happen to be today, reaches the sitemap. */
		for (const route of ALL_ROUTES) {
			if (route.kind === 'stub' || route.kind === 'service-stub') {
				expect(body, `${route.path} is a stub and must not be in the sitemap`).not.toContain(
					`<loc>${MOCK_SITE_URL}${route.path}</loc>`
				);
			}
		}
	});

	it('every <loc> is absolute and starts with SITE_URL', async () => {
		const { GET } = await import('../../src/routes/sitemap.xml/+server');
		const response = await GET({} as Parameters<typeof GET>[0]);
		const body = await response.text();
		const locs = [...body.matchAll(/<loc>(.+?)<\/loc>/g)].map((m) => m[1] ?? '');
		const { ALL_ROUTES } = await import('../../src/lib/constants/routes');
		expect(locs.length).toBe(
			ALL_ROUTES.filter((r) => r.kind !== 'stub' && r.kind !== 'service-stub').length
		);
		for (const loc of locs) {
			expect(loc.startsWith('https://')).toBe(true);
			expect(loc.startsWith(MOCK_SITE_URL)).toBe(true);
		}
	});

	it('landing entry (/) has priority 1.0', async () => {
		const { GET } = await import('../../src/routes/sitemap.xml/+server');
		const response = await GET({} as Parameters<typeof GET>[0]);
		const body = await response.text();
		expect(body).toContain('<priority>1.0</priority>');
	});

	it('every entry but the landing page has priority 0.5', async () => {
		const { GET } = await import('../../src/routes/sitemap.xml/+server');
		const response = await GET({} as Parameters<typeof GET>[0]);
		const body = await response.text();
		const priorities = [...body.matchAll(/<priority>(.+?)<\/priority>/g)].map((m) => m[1]);
		const { ALL_ROUTES } = await import('../../src/lib/constants/routes');
		const published = ALL_ROUTES.filter(
			(r) => r.kind !== 'stub' && r.kind !== 'service-stub'
		).length;
		expect(priorities.filter((p) => p === '0.5').length).toBe(published - 1);
	});

	it('module exports prerender = true', async () => {
		const mod = await import('../../src/routes/sitemap.xml/+server');
		expect((mod as Record<string, unknown>).prerender).toBe(true);
	});
});
