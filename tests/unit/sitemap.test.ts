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

	it('response body contains exactly 15 <url> elements', async () => {
		const { GET } = await import('../../src/routes/sitemap.xml/+server');
		const response = await GET({} as Parameters<typeof GET>[0]);
		const body = await response.text();
		const matches = body.match(/<url>/g);
		expect(matches?.length).toBe(15);
	});

	it('every <loc> is absolute and starts with SITE_URL', async () => {
		const { GET } = await import('../../src/routes/sitemap.xml/+server');
		const response = await GET({} as Parameters<typeof GET>[0]);
		const body = await response.text();
		const locs = [...body.matchAll(/<loc>(.+?)<\/loc>/g)].map((m) => m[1] ?? '');
		expect(locs.length).toBe(15);
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

	it('exactly 14 entries have priority 0.5', async () => {
		const { GET } = await import('../../src/routes/sitemap.xml/+server');
		const response = await GET({} as Parameters<typeof GET>[0]);
		const body = await response.text();
		const priorities = [...body.matchAll(/<priority>(.+?)<\/priority>/g)].map((m) => m[1]);
		expect(priorities.filter((p) => p === '0.5').length).toBe(14);
	});

	it('module exports prerender = true', async () => {
		const mod = await import('../../src/routes/sitemap.xml/+server');
		expect((mod as Record<string, unknown>).prerender).toBe(true);
	});
});
