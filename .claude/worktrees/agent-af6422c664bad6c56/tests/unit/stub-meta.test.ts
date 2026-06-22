/**
 * stub-meta.test.ts — TDD gate for Task 1 (Plan 05)
 * Tests: STUB_META map — 14 entries, title/description length, crumb structure, uniqueness
 * Requirements: FND-08 (14 reserved stub routes), SEO-01 (title 50-60), SEO-01 (desc 150-160)
 * Pitfall #7: no two stubs may share title or description text
 */
import { describe, it, expect } from 'vitest';
import { STUB_META } from '$lib/seo/stub-meta';

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

describe('STUB_META — 14-entry per-route metadata map', () => {
	it('Test 1: STUB_META has exactly 14 keys covering all stub paths', () => {
		const keys = Object.keys(STUB_META);
		expect(keys).toHaveLength(14);
		for (const path of STUB_PATHS) {
			expect(keys).toContain(path);
		}
	});

	it('Test 2: every title is 50-60 chars inclusive', () => {
		for (const [path, meta] of Object.entries(STUB_META)) {
			const len = meta.title.length;
			expect(len, `title too short for ${path}: "${meta.title}" (${len} chars)`).toBeGreaterThanOrEqual(50);
			expect(len, `title too long for ${path}: "${meta.title}" (${len} chars)`).toBeLessThanOrEqual(60);
		}
	});

	it('Test 3: every description is 150-160 chars inclusive', () => {
		for (const [path, meta] of Object.entries(STUB_META)) {
			const len = meta.description.length;
			expect(len, `desc too short for ${path} (${len} chars): "${meta.description}"`).toBeGreaterThanOrEqual(150);
			expect(len, `desc too long for ${path} (${len} chars): "${meta.description}"`).toBeLessThanOrEqual(160);
		}
	});

	it('Test 4: every crumbs array starts with Home at / and ends at the route path', () => {
		for (const [path, meta] of Object.entries(STUB_META)) {
			expect(meta.crumbs.length, `crumbs empty for ${path}`).toBeGreaterThan(0);
			expect(meta.crumbs[0], `first crumb wrong for ${path}`).toEqual({ name: 'Home', path: '/' });
			const last = meta.crumbs[meta.crumbs.length - 1];
			expect(last.path, `last crumb path wrong for ${path}`).toBe(path);
		}
	});

	it('Test 5: nested /diensten/<modality> routes have intermediate Diensten crumb', () => {
		const nested = [
			'/diensten/mahatma-healing',
			'/diensten/goldhealing',
			'/diensten/raster-energie',
			'/diensten/spinal-touch'
		];
		for (const path of nested) {
			const meta = STUB_META[path];
			const intermediate = meta.crumbs.find((c) => c.path === '/diensten');
			expect(intermediate, `missing /diensten crumb in ${path}`).toBeDefined();
			expect(intermediate?.name).toBe('Diensten');
		}
	});

	it('Test 6: no two STUB_META entries share the same description (Pitfall #7)', () => {
		const descriptions = new Set<string>();
		for (const [path, meta] of Object.entries(STUB_META)) {
			expect(descriptions.has(meta.description), `duplicate description for ${path}`).toBe(false);
			descriptions.add(meta.description);
		}
	});

	it('Test 7: no two STUB_META entries share the same title', () => {
		const titles = new Set<string>();
		for (const [path, meta] of Object.entries(STUB_META)) {
			expect(titles.has(meta.title), `duplicate title for ${path}`).toBe(false);
			titles.add(meta.title);
		}
	});
});
