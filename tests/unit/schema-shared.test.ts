/**
 * schema-shared.test.ts — TDD gate for Task 1
 * Tests: organizationNode, professionalServiceNode, personNode, webSiteNode
 * Requirements: SCH-02, SCH-03, SCH-05
 * D-locked: ProfessionalService (NOT LocalBusiness) — practitioner is mobile + remote + part-time.
 *
 * Uses vi.doMock() (non-hoisted) for env override — same pattern as canonical.test.ts
 *
 * Note on schema-dts types: schema-dts Union types include `string` (for @id references),
 * so direct bracket notation fails strict TypeScript. Tests cast via `as Record<string, unknown>`
 * for runtime property access — type safety in production code is enforced by schema-dts
 * catching typos at compile time (confirmed by `pnpm check` on implementation files).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Convenience type for runtime test assertions on schema-dts nodes
type SchemaNode = Record<string, unknown>;

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
		const node = organizationNode as unknown as SchemaNode;
		expect(node['@type']).toBe('Organization');
		expect(node['@id']).toBe('https://trinity-breath-healing.vercel.app/#organization');
	});

	it('Test 2: professionalServiceNode has @type ProfessionalService (NOT LocalBusiness)', async () => {
		const { professionalServiceNode } = await loadShared();
		// D-locked: ProfessionalService over LocalBusiness (mobile + remote + part-time; no storefront)
		const node = professionalServiceNode as unknown as SchemaNode;
		expect(node['@type']).toBe('ProfessionalService');
		expect(node['@id']).toBe('https://trinity-breath-healing.vercel.app/#business');
	});

	it('Test 3: professionalServiceNode.areaServed matches BRAND.areaServed', async () => {
		const { professionalServiceNode } = await loadShared();
		const { BRAND } = await import('$lib/constants/brand');
		const node = professionalServiceNode as unknown as SchemaNode;
		const areaServed = node['areaServed'] as string[];
		expect(Array.isArray(areaServed)).toBe(true);
		for (const city of BRAND.areaServed) {
			expect(areaServed).toContain(city);
		}
	});

	it('Test 4: personNode has @type Person and worksFor links to organizationNode @id', async () => {
		const { personNode, organizationNode } = await loadShared();
		const person = personNode as unknown as SchemaNode;
		const org = organizationNode as unknown as SchemaNode;
		expect(person['@type']).toBe('Person');
		expect(person['@id']).toBe('https://trinity-breath-healing.vercel.app/#practitioner');
		// worksFor links to the organization via @id reference
		const worksFor = person['worksFor'] as SchemaNode;
		expect(worksFor).toBeDefined();
		expect(worksFor['@id']).toBe(org['@id']);
	});

	it('Test 5: webSiteNode has @type WebSite and inLanguage nl-NL', async () => {
		const { webSiteNode } = await loadShared();
		const node = webSiteNode as unknown as SchemaNode;
		expect(node['@type']).toBe('WebSite');
		expect(node['@id']).toBe('https://trinity-breath-healing.vercel.app/#website');
		expect(node['inLanguage']).toBe('nl-NL');
	});
});
