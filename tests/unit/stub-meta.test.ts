/**
 * stub-meta.test.ts — TDD gate for Plan 05 Task 1
 * Tests: STUB_META map — 16 entries, title/description length, crumb structure, uniqueness
 * Requirements: FND-08 (14 reserved stubs, 13 remaining), SEO-01 (50-60 char titles),
 * SEO-01 (150-160 char descriptions)
 * Pitfall #7: no duplicate meta content across stub routes
 *
 * `/faq` graduated to real content (src/routes/faq/) and dropped out of STUB_META —
 * see src/routes/faq/+page.ts for its own title/description/crumbs.
 *
 * 260810-mdl added 3 more service-stub entries (13 -> 16) for the owner's 7-real-services
 * decision: cranio-fascia-unwinding, brtt-body, trb-breathwork.
 */
import { describe, it, expect } from 'vitest';
import { STUB_META } from '$lib/seo/stub-meta';

const EXPECTED_PATHS = [
	'/werkwijze',
	'/over-mij',
	'/behandelingen',
	'/contact',
	'/diensten',
	'/diensten/mahatma-healing',
	'/diensten/goldhealing',
	'/diensten/raster-energie',
	'/diensten/cranio-fascia-unwinding',
	'/diensten/spinal-touch',
	'/diensten/brtt-body',
	'/diensten/trb-breathwork',
	'/blog',
	'/artikelen',
	'/privacyverklaring',
	'/algemene-voorwaarden',
	'/disclaimer',
	'/reviews'
];

describe('STUB_META — one entry per non-landing route', () => {
	it('Test 1: STUB_META has one key per non-landing route', () => {
		/* Derived, not hardcoded: reserving another route should not mean editing
		   a number here. STUB_META covers every route except the landing page and
		   /faq, which carries its own metadata. */
		expect(Object.keys(STUB_META).length).toBe(EXPECTED_PATHS.length);
	});

	it('Test 2: STUB_META keys match the expected paths exactly', () => {
		const keys = Object.keys(STUB_META).sort();
		const expected = [...EXPECTED_PATHS].sort();
		expect(keys).toEqual(expected);
	});

	it('Test 3: every title is between 50-60 chars inclusive', () => {
		for (const [path, meta] of Object.entries(STUB_META)) {
			const len = meta.title.length;
			expect(
				len,
				`title for ${path} is ${len} chars (must be 50-60): "${meta.title}"`
			).toBeGreaterThanOrEqual(50);
			expect(
				len,
				`title for ${path} is ${len} chars (must be 50-60): "${meta.title}"`
			).toBeLessThanOrEqual(60);
		}
	});

	it('Test 4: every description is between 150-160 chars inclusive', () => {
		for (const [path, meta] of Object.entries(STUB_META)) {
			const len = meta.description.length;
			expect(
				len,
				`description for ${path} is ${len} chars (must be 150-160): "${meta.description}"`
			).toBeGreaterThanOrEqual(150);
			expect(
				len,
				`description for ${path} is ${len} chars (must be 150-160): "${meta.description}"`
			).toBeLessThanOrEqual(160);
		}
	});

	it('Test 5: every crumbs array starts with {name:"Home",path:"/"} and ends with the page itself', () => {
		for (const [path, meta] of Object.entries(STUB_META)) {
			expect(meta.crumbs.length, `${path} crumbs must be non-empty`).toBeGreaterThan(0);
			expect(meta.crumbs[0], `${path} first crumb`).toEqual({ name: 'Home', path: '/' });
			const last = meta.crumbs[meta.crumbs.length - 1]!;
			expect(last.path, `${path} last crumb path`).toBe(path);
		}
	});

	it('Test 6: nested /diensten/<modality> routes have intermediate Diensten crumb', () => {
		const nestedPaths = [
			'/diensten/mahatma-healing',
			'/diensten/goldhealing',
			'/diensten/raster-energie',
			'/diensten/cranio-fascia-unwinding',
			'/diensten/spinal-touch',
			'/diensten/brtt-body',
			'/diensten/trb-breathwork'
		];
		for (const path of nestedPaths) {
			const meta = STUB_META[path]!;
			expect(meta.crumbs.length, `${path} crumbs length`).toBe(3);
			expect(meta.crumbs[1], `${path} intermediate crumb`).toEqual({
				name: 'Diensten',
				path: '/diensten'
			});
		}
	});

	it('Test 7: no two STUB_META entries share identical description text (Pitfall #7)', () => {
		const descriptions = Object.values(STUB_META).map((m) => m.description);
		const uniqueDescriptions = new Set(descriptions);
		expect(uniqueDescriptions.size).toBe(descriptions.length);
	});

	it('Test 8: no two STUB_META entries share identical title text', () => {
		const titles = Object.values(STUB_META).map((m) => m.title);
		const uniqueTitles = new Set(titles);
		expect(uniqueTitles.size).toBe(titles.length);
	});
});
