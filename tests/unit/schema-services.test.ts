/**
 * schema-services.test.ts — TDD RED gate for Task 1
 * Tests: makeServiceNode factory + allServiceNodes (4 modalities)
 * Requirements: SCH-04
 * D-locked: service slugs mahatma-healing, goldhealing, raster-energie, spinal-touch
 *
 * Uses vi.doMock() for env override.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('services.ts — Service schema nodes', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.restoreAllMocks();
	});

	async function loadServices() {
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_SITE_URL: 'https://trinity-breath-healing.vercel.app' }
		}));
		return import('$lib/schema/services');
	}

	it('Test 1: makeServiceNode returns Service with correct @id and @type', async () => {
		const { makeServiceNode } = await loadServices();
		const node = makeServiceNode('mahatma-healing', 'Mahatma Healing');
		expect(node['@type']).toBe('Service');
		expect(node['@id']).toBe(
			'https://trinity-breath-healing.vercel.app/#service-mahatma-healing'
		);
	});

	it('Test 2: makeServiceNode has provider linking to organization @id', async () => {
		const { makeServiceNode } = await loadServices();
		const node = makeServiceNode('mahatma-healing', 'Mahatma Healing');
		const provider = node['provider'] as { '@id': string };
		expect(provider).toBeDefined();
		expect(provider['@id']).toBe(
			'https://trinity-breath-healing.vercel.app/#organization'
		);
	});

	it('Test 3: makeServiceNode has areaServed matching BRAND.areaServed', async () => {
		const { makeServiceNode } = await loadServices();
		const { BRAND } = await import('$lib/constants/brand');
		const node = makeServiceNode('mahatma-healing', 'Mahatma Healing');
		const areaServed = node['areaServed'] as string[];
		expect(Array.isArray(areaServed)).toBe(true);
		for (const city of BRAND.areaServed) {
			expect(areaServed).toContain(city);
		}
	});

	it('Test 4: makeServiceNode url points to /diensten/<slug>', async () => {
		const { makeServiceNode } = await loadServices();
		const node = makeServiceNode('mahatma-healing', 'Mahatma Healing');
		expect(node['url']).toBe(
			'https://trinity-breath-healing.vercel.app/diensten/mahatma-healing'
		);
	});

	it('Test 5: allServiceNodes has exactly 4 entries', async () => {
		const { allServiceNodes } = await loadServices();
		expect(allServiceNodes).toHaveLength(4);
	});

	it('Test 6: allServiceNodes covers the 4 locked slugs', async () => {
		const { allServiceNodes } = await loadServices();
		const slugs = allServiceNodes.map((n) => n['@id']?.toString() ?? '');
		expect(slugs).toContain('https://trinity-breath-healing.vercel.app/#service-mahatma-healing');
		expect(slugs).toContain('https://trinity-breath-healing.vercel.app/#service-goldhealing');
		expect(slugs).toContain('https://trinity-breath-healing.vercel.app/#service-raster-energie');
		expect(slugs).toContain('https://trinity-breath-healing.vercel.app/#service-spinal-touch');
	});
});
