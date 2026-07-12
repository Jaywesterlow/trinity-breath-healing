/**
 * canonical.test.ts — Task 1 TDD gate
 * Tests: PageMeta type, SITE_URL env contract, defaults, BRAND, buildCanonical helper
 * Requirements: SEO-01, SEO-04, SEO-05, FND-07, LGL-09
 *
 * Note: vi.mock() is hoisted, so we use vi.doMock() (non-hoisted) for per-test env overrides
 * combined with vi.resetModules() to ensure each dynamic import gets a fresh module instance.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PageMeta } from '$lib/seo/types';

// ---------------------------------------------------------------------------
// Test 1 + 2: SITE_URL reads from PUBLIC_SITE_URL and throws when unset
// ---------------------------------------------------------------------------
describe('SITE_URL (src/lib/seo/defaults.ts)', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.restoreAllMocks();
	});

	it('Test 1: returns env value without trailing slash when PUBLIC_SITE_URL is set', async () => {
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_SITE_URL: 'https://trinity-breath-healing.vercel.app/' }
		}));
		const { SITE_URL } = await import('$lib/seo/defaults');
		expect(SITE_URL).toBe('https://trinity-breath-healing.vercel.app');
	});

	it('Test 2: throws Error mentioning PUBLIC_SITE_URL when env var is unset', async () => {
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_SITE_URL: '' }
		}));
		await expect(import('$lib/seo/defaults')).rejects.toThrow('PUBLIC_SITE_URL');
	});
});

// ---------------------------------------------------------------------------
// Test 3: defaults.description length 150–160
// ---------------------------------------------------------------------------
describe('defaults (src/lib/seo/defaults.ts)', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.restoreAllMocks();
	});

	it('Test 3: defaults.description length is between 150 and 160 inclusive', async () => {
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_SITE_URL: 'https://example.com' }
		}));
		const { defaults } = await import('$lib/seo/defaults');
		const len = defaults.description.length;
		expect(len, `description length ${len} must be 150–160`).toBeGreaterThanOrEqual(150);
		expect(len, `description length ${len} must be 150–160`).toBeLessThanOrEqual(160);
	});
});

// ---------------------------------------------------------------------------
// Tests 4 + 5: BRAND constant (no env mock needed — brand.ts has no env imports)
// ---------------------------------------------------------------------------
describe('BRAND (src/lib/constants/brand.ts)', () => {
	it('Test 4: BRAND.services contains exactly 4 entries with correct slugs', async () => {
		const { BRAND } = await import('$lib/constants/brand');
		const slugs = BRAND.services.map((s: { slug: string; name: string }) => s.slug);
		expect(slugs).toHaveLength(4);
		expect(slugs).toContain('mahatma-healing');
		expect(slugs).toContain('goldhealing');
		expect(slugs).toContain('raster-energie');
		expect(slugs).toContain('spinal-touch');
	});

	it('Test 5: BRAND.areaServed contains Amsterdam and Almere', async () => {
		const { BRAND } = await import('$lib/constants/brand');
		expect(BRAND.areaServed).toContain('Amsterdam');
		expect(BRAND.areaServed).toContain('Almere');
	});
});

// ---------------------------------------------------------------------------
// Test 6: buildCanonical helper
// ---------------------------------------------------------------------------
describe('buildCanonical (src/lib/seo/defaults.ts)', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.restoreAllMocks();
	});

	it('Test 6: buildCanonical produces siteUrl+path with no double slash', async () => {
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_SITE_URL: 'https://example.com' }
		}));
		const { buildCanonical } = await import('$lib/seo/defaults');
		expect(buildCanonical('https://example.com', '/')).toBe('https://example.com/');
		expect(buildCanonical('https://example.com', '/over-mij')).toBe('https://example.com/over-mij');
		// Ensure no double-slash when path starts with /
		const result = buildCanonical('https://example.com', '/contact');
		expect(result).not.toContain('//contact');
	});
});

// ---------------------------------------------------------------------------
// Test 7: PageMeta type includes optional dateModified (compile-time guard)
// The TypeScript compiler rejects the file if dateModified is absent from PageMeta.
// ---------------------------------------------------------------------------
describe('PageMeta type (src/lib/seo/types.ts)', () => {
	it('Test 7: PageMeta accepts optional dateModified field', () => {
		// This fixture is the compile-time guard — pnpm check fails if dateModified is absent from PageMeta.
		const fixture: PageMeta = {
			title: 'Test pagina',
			description:
				'Een testbeschrijving die precies genoeg tekens heeft voor SEO validatie doeleinden hier.',
			path: '/test',
			dateModified: '2026-06-18'
		};
		expect(fixture.dateModified).toBe('2026-06-18');
		expect(fixture.path).toBe('/test');
	});
});
