/**
 * schema-shared.test.ts — TDD RED gate for Task 1
 * Tests: organizationNode, professionalServiceNode, personNode, webSiteNode
 * Requirements: SCH-02, SCH-03, SCH-05
 * D-locked: ProfessionalService (NOT LocalBusiness) — practitioner is mobile + remote + part-time.
 *
 * Uses vi.doMock() (non-hoisted) for env override — same pattern as canonical.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('shared.ts — shared schema nodes', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.restoreAllMocks();
	});

	// Helper to load the module under test with a mocked env
	async function loadShared() {
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_SITE_URL: 'https://trinity-breath-healing.vercel.app' }
		}));
		return import('$lib/schema/shared');
	}

	it('Test 1: organizationNode has @type Organization and correct @id', async () => {
		const { organizationNode } = await loadShared();
		expect(organizationNode['@type']).toBe('Organization');
		expect(organizationNode['@id']).toBe(
			'https://trinity-breath-healing.vercel.app/#organization'
		);
	});

	it('Test 2: professionalServiceNode has @type ProfessionalService (NOT LocalBusiness)', async () => {
		const { professionalServiceNode } = await loadShared();
		// D-locked: ProfessionalService over LocalBusiness (mobile + remote + part-time; no storefront)
		expect(professionalServiceNode['@type']).toBe('ProfessionalService');
		expect(professionalServiceNode['@id']).toBe(
			'https://trinity-breath-healing.vercel.app/#business'
		);
	});

	it('Test 3: professionalServiceNode.areaServed matches BRAND.areaServed', async () => {
		const { professionalServiceNode } = await loadShared();
		const { BRAND } = await import('$lib/constants/brand');
		const areaServed = professionalServiceNode['areaServed'] as string[];
		expect(Array.isArray(areaServed)).toBe(true);
		for (const city of BRAND.areaServed) {
			expect(areaServed).toContain(city);
		}
	});

	it('Test 4: personNode has @type Person and worksFor links to organizationNode @id', async () => {
		const { personNode, organizationNode } = await loadShared();
		expect(personNode['@type']).toBe('Person');
		expect(personNode['@id']).toBe(
			'https://trinity-breath-healing.vercel.app/#practitioner'
		);
		// worksFor links to the organization via @id reference
		const worksFor = personNode['worksFor'] as { '@id': string };
		expect(worksFor).toBeDefined();
		expect(worksFor['@id']).toBe(organizationNode['@id']);
	});

	it('Test 5: webSiteNode has @type WebSite and inLanguage nl-NL', async () => {
		const { webSiteNode } = await loadShared();
		expect(webSiteNode['@type']).toBe('WebSite');
		expect(webSiteNode['@id']).toBe(
			'https://trinity-breath-healing.vercel.app/#website'
		);
		expect(webSiteNode['inLanguage']).toBe('nl-NL');
	});
});
