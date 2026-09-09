/**
 * stub-meta.test.ts — TDD gate for Plan 05 Task 1
 * Tests: STUB_META map — 16 entries, title/description length, crumb structure, uniqueness
 * Requirements: FND-08 (14 reserved stubs, 13 remaining), SEO-01 (50-60 char titles),
 * SEO-01 (150-160 char descriptions)
 * Pitfall #7: no duplicate meta content across stub routes
 *
 * `/faq` graduated to real content (src/routes/faq/) and dropped out of STUB_META —
 * see src/routes/faq/+page.ts for its own title/description/crumbs. The three legal
 * pages (/privacyverklaring, /algemene-voorwaarden, /disclaimer) graduated the same
 * way and for the same reason.
 *
 * 260810-mdl added 3 more service-stub entries (13 -> 16) for the owner's 7-real-services
 * decision: cranio-fascia-unwinding, brtt-body, trb-breathwork.
 *
 * 2026-09-09: eleven graduated at once — the seven modalities, /diensten,
 * /behandelingen, /werkwijze and /contact — leaving four. The invariant this file
 * checks is now derived from ALL_ROUTES rather than listed by hand: STUB_META must
 * hold exactly the routes still marked `kind: 'stub'`, no more and no fewer. That
 * catches the failure that actually matters, a route graduating in one file and not
 * the other, without needing an edit here every time one does.
 */
import { describe, it, expect } from 'vitest';
import { STUB_META } from '$lib/seo/stub-meta';
import { ALL_ROUTES } from '$lib/constants/routes';

const EXPECTED_PATHS = ALL_ROUTES.filter((r) => r.kind === 'stub' || r.kind === 'service-stub').map(
	(r) => r.path
);

describe('STUB_META — one entry per non-landing route', () => {
	it('Test 1: STUB_META has one key per non-landing route', () => {
		/* Derived, not hardcoded: STUB_META covers exactly the routes still marked
		   as stubs in ALL_ROUTES. A route that graduates in one file and not the
		   other is the bug this catches. */
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

	it('Test 6: any nested route still in STUB_META keeps its intermediate crumb', () => {
		/* Vacuous today — the seven /diensten/<modality> routes graduated on
		   2026-09-09 and nothing nested is a stub any more. Kept rather than deleted
		   because the rule it encodes applies to the next nested stub too, and a
		   filter that finds nothing is the honest way to say "none currently". */
		const nested = Object.entries(STUB_META).filter(([path]) => path.split('/').length > 2);
		for (const [path, meta] of nested) {
			const names = meta.crumbs.map((c) => c.name);
			expect(names.length, `${path} should have more than two crumbs`).toBeGreaterThan(2);
			expect(names[0]).toBe('Home');
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
