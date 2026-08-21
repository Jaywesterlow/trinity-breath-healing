import { describe, it, expect } from 'vitest';
import { ALL_ROUTES } from '$lib/constants/routes';

describe('ALL_ROUTES manifest', () => {
	it('contains exactly 18 entries (260810-mdl: +3 service stubs)', () => {
		expect(ALL_ROUTES.length).toBe(20);
	});

	it('paths match the reserved route list, in order', () => {
		const paths = ALL_ROUTES.map((r) => r.path);
		expect(paths).toEqual([
			'/',
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
			'/faq',
			'/privacyverklaring',
			'/algemene-voorwaarden',
			'/disclaimer',
			'/reviews'
		]);
	});

	it('first entry is landing page with kind="landing"', () => {
		expect(ALL_ROUTES[0].kind).toBe('landing');
		expect(ALL_ROUTES[0].path).toBe('/');
	});

	it('has exactly 7 service-stub entries covering all 7 modality slugs', () => {
		const serviceStubs = ALL_ROUTES.filter((r) => r.kind === 'service-stub');
		expect(serviceStubs.length).toBe(7);
		const paths = serviceStubs.map((r) => r.path);
		expect(paths).toContain('/diensten/mahatma-healing');
		expect(paths).toContain('/diensten/goldhealing');
		expect(paths).toContain('/diensten/raster-energie');
		expect(paths).toContain('/diensten/cranio-fascia-unwinding');
		expect(paths).toContain('/diensten/spinal-touch');
		expect(paths).toContain('/diensten/brtt-body');
		expect(paths).toContain('/diensten/trb-breathwork');
	});

	it('no non-root path contains a trailing slash', () => {
		for (const r of ALL_ROUTES) {
			if (r.path !== '/') {
				expect(r.path, `${r.path} has trailing slash`).not.toMatch(/\/$/);
			}
		}
	});

	it('every entry has path, title, and kind fields', () => {
		for (const r of ALL_ROUTES) {
			expect(typeof r.path).toBe('string');
			expect(typeof r.title).toBe('string');
			expect(typeof r.kind).toBe('string');
		}
	});
});
