/**
 * brand-services.test.ts — 260810-mdl unit gate.
 *
 * Cross-checks BRAND.services against ALL_ROUTES and STUB_META so the sitemap stays honest —
 * every service slug the carousel/modal link to must resolve to a real route. Also guards the
 * `description` -> `teaser` rename (no TODO_ placeholder copy should remain now that the
 * practitioner's real text has landed) and the shape ServiceModal/Behandelingen.svelte read.
 */
import { describe, it, expect } from 'vitest';
import { BRAND } from '$lib/constants/brand';
import { ALL_ROUTES } from '$lib/constants/routes';
import { STUB_META } from '$lib/seo/stub-meta';

describe('BRAND.services (260810-mdl)', () => {
	it('has exactly 7 entries', () => {
		expect(BRAND.services).toHaveLength(7);
	});

	it('no TODO_ placeholder remains in any service field', () => {
		for (const s of BRAND.services) {
			expect(s.teaser, `${s.slug} teaser`).not.toMatch(/TODO_/);
			expect(s.intro, `${s.slug} intro`).not.toMatch(/TODO_/);
			for (const h of s.helpsWith) {
				expect(h, `${s.slug} helpsWith entry`).not.toMatch(/TODO_/);
			}
		}
	});

	it('every service has a non-empty teaser, intro, and helpsWith list', () => {
		for (const s of BRAND.services) {
			expect(s.teaser.length, `${s.slug} teaser`).toBeGreaterThan(0);
			expect(s.intro.length, `${s.slug} intro`).toBeGreaterThan(0);
			expect(s.helpsWith.length, `${s.slug} helpsWith`).toBeGreaterThan(0);
		}
	});

	it('every service slug has a matching /diensten/<slug> entry in ALL_ROUTES', () => {
		const routePaths = new Set(ALL_ROUTES.map((r) => r.path));
		for (const s of BRAND.services) {
			expect(routePaths.has(`/diensten/${s.slug}`), `missing route for ${s.slug}`).toBe(true);
		}
	});

	it('every service slug has a matching STUB_META entry', () => {
		for (const s of BRAND.services) {
			expect(STUB_META[`/diensten/${s.slug}`], `missing STUB_META for ${s.slug}`).toBeDefined();
		}
	});

	it('BRTT Body and Trauma Release Breathwork are separate services (owner decision)', () => {
		const slugs = BRAND.services.map((s) => s.slug);
		expect(slugs).toContain('brtt-body');
		expect(slugs).toContain('trb-breathwork');
	});

	it('BRAND.disclaimer is a single non-empty constant', () => {
		expect(typeof BRAND.disclaimer).toBe('string');
		expect(BRAND.disclaimer.length).toBeGreaterThan(0);
	});
});
