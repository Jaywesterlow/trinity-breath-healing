/**
 * schema-faq.test.ts — TDD gate for Task 1
 * Tests: buildFaqPage() builder + buildWebPage() helper + buildGraph() composer
 * Requirements: SCH-07, SCH-01, SEO-09
 *
 * WARNING-2: buildFaqPage([]) returns structurally-valid FAQPage with mainEntity=[].
 * Plan 08 validate-json-ld.ts MUST NOT assert mainEntity.length > 0 in Phase 0.
 * That gate flips on in Phase 1 LND-07 when real FAQ entries land.
 *
 * SEO-09: buildWebPage omits dateModified key when absent (never emits undefined).
 *
 * Uses vi.doMock() for env override.
 *
 * Note on schema-dts types: schema-dts types include `string` unions so direct bracket
 * notation fails strict TS. Tests cast via `as unknown as Record<string, unknown>` for
 * runtime assertions. Type safety in implementation confirmed by `pnpm check`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type SchemaNode = Record<string, unknown>;

describe('faq.ts — FAQPage builder', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.restoreAllMocks();
	});

	async function loadFaq() {
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_SITE_URL: 'https://trinity-breath-healing.vercel.app' }
		}));
		return import('$lib/schema/faq');
	}

	it('WARNING-2: buildFaqPage([]) returns valid FAQPage with mainEntity=[] (empty is valid in Phase 0)', async () => {
		const { buildFaqPage } = await loadFaq();
		const result = buildFaqPage([]) as unknown as SchemaNode;
		expect(result['@type']).toBe('FAQPage');
		expect(Array.isArray(result['mainEntity'])).toBe(true);
		expect((result['mainEntity'] as unknown[]).length).toBe(0);
	});

	it('Test 1: buildFaqPage with 2 entries returns mainEntity.length === 2', async () => {
		const { buildFaqPage } = await loadFaq();
		const result = buildFaqPage([
			{ question: 'Wat is ademwerk?', answer: 'Ademwerk is...' },
			{ question: 'Hoe lang duurt een sessie?', answer: 'Circa 90 minuten.' }
		]) as unknown as SchemaNode;
		const mainEntity = result['mainEntity'] as unknown[];
		expect(mainEntity).toHaveLength(2);
	});

	it('Test 2: each entry has @type Question, name, and acceptedAnswer', async () => {
		const { buildFaqPage } = await loadFaq();
		const result = buildFaqPage([
			{ question: 'q1', answer: 'a1' }
		]) as unknown as SchemaNode;
		const mainEntity = result['mainEntity'] as SchemaNode[];
		const entry = mainEntity[0]!;
		const acceptedAnswer = entry['acceptedAnswer'] as SchemaNode;
		expect(entry['@type']).toBe('Question');
		expect(entry['name']).toBe('q1');
		expect(acceptedAnswer['@type']).toBe('Answer');
		expect(acceptedAnswer['text']).toBe('a1');
	});
});

describe('webpage.ts — WebPage builder', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.restoreAllMocks();
	});

	async function loadWebPage() {
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_SITE_URL: 'https://trinity-breath-healing.vercel.app' }
		}));
		return import('$lib/schema/webpage');
	}

	it('Test 1: buildWebPage returns WebPage with correct @type, name, description, url', async () => {
		const { buildWebPage } = await loadWebPage();
		const result = buildWebPage({ title: 'Mijn titel', description: 'Beschrijving', path: '/' }) as unknown as SchemaNode;
		expect(result['@type']).toBe('WebPage');
		expect(result['name']).toBe('Mijn titel');
		expect(result['description']).toBe('Beschrijving');
		expect(result['url']).toBe('https://trinity-breath-healing.vercel.app/');
	});

	it('SEO-09: buildWebPage with dateModified includes the key', async () => {
		const { buildWebPage } = await loadWebPage();
		const result = buildWebPage({ title: 't', description: 'd', path: '/', dateModified: '2026-06-15' }) as unknown as SchemaNode;
		expect(result['dateModified']).toBe('2026-06-15');
	});

	it('SEO-09: buildWebPage without dateModified OMITS the key (never undefined)', async () => {
		const { buildWebPage } = await loadWebPage();
		const result = buildWebPage({ title: 't', description: 'd', path: '/' }) as unknown as SchemaNode;
		// Key must be absent entirely — not set to undefined
		expect(Object.hasOwn(result, 'dateModified')).toBe(false);
	});
});

describe('buildGraph.ts — @graph composer', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.restoreAllMocks();
	});

	async function loadBuildGraph() {
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_SITE_URL: 'https://trinity-breath-healing.vercel.app' }
		}));
		return import('$lib/schema/buildGraph');
	}

	it('Test 1: buildGraph with empty pageSpecific returns 8 shared nodes (Org + ProfService + Person + WebSite + 4 Service)', async () => {
		const { buildGraph } = await loadBuildGraph();
		const result = buildGraph({ pageSpecific: [], path: '/' });
		// Organization, ProfessionalService, Person, WebSite, 4 x Service = 8
		expect(result).toHaveLength(8);
	});

	it('Test 2: buildGraph called twice consecutively returns same count (dedup by @id)', async () => {
		const { buildGraph } = await loadBuildGraph();
		const r1 = buildGraph({ pageSpecific: [], path: '/' });
		const r2 = buildGraph({ pageSpecific: [], path: '/' });
		expect(r1).toHaveLength(8);
		expect(r2).toHaveLength(8);
	});

	it('Test 3: buildGraph with pageSpecific WebPage returns 9 nodes', async () => {
		const { buildGraph } = await loadBuildGraph();
		const webPage = { '@type': 'WebPage' as const, name: 'Home', url: 'https://trinity-breath-healing.vercel.app/' };
		const result = buildGraph({ pageSpecific: [webPage], path: '/' });
		expect(result).toHaveLength(9);
	});

	it('Test 4: pageSpecific node with @id matching a shared node deduplicates (stays at 8)', async () => {
		const { buildGraph } = await loadBuildGraph();
		// Organization @id matches a shared node — should deduplicate
		const duplicate = {
			'@type': 'Organization' as const,
			'@id': 'https://trinity-breath-healing.vercel.app/#organization',
			name: 'Duplicate'
		};
		const result = buildGraph({ pageSpecific: [duplicate], path: '/' });
		// The duplicate @id replaces the shared one — still 8 nodes
		expect(result).toHaveLength(8);
	});

	it('Test 5: shared nodes contain Organization, ProfessionalService, Person, WebSite types', async () => {
		const { buildGraph } = await loadBuildGraph();
		const result = buildGraph({ pageSpecific: [], path: '/' });
		const types = result.map((n) => (n as SchemaNode)['@type']);
		expect(types).toContain('Organization');
		expect(types).toContain('ProfessionalService');
		expect(types).toContain('Person');
		expect(types).toContain('WebSite');
	});
});
