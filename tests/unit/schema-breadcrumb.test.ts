/**
 * schema-breadcrumb.test.ts — TDD gate for Task 1
 * Tests: buildBreadcrumb() builder
 * Requirements: SCH-06
 *
 * Uses vi.doMock() for env override.
 *
 * Note on schema-dts types: schema-dts BreadcrumbList.itemListElement is typed as
 * SchemaValue<ListItem|...> which includes complex union. Tests cast via
 * `as unknown as Array<...>` for runtime assertions — type safety in implementation
 * is enforced by schema-dts at compile time (confirmed by `pnpm check`).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type BreadcrumbItem = {
	'@type': string;
	position: number;
	name: string;
	item: string;
};

describe('breadcrumb.ts — BreadcrumbList builder', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.restoreAllMocks();
	});

	async function loadBreadcrumb() {
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_SITE_URL: 'https://trinity-breath-healing.vercel.app' }
		}));
		return import('$lib/schema/breadcrumb');
	}

	it('Test 1: buildBreadcrumb returns BreadcrumbList @type', async () => {
		const { buildBreadcrumb } = await loadBreadcrumb();
		const result = buildBreadcrumb([
			{ name: 'Home', path: '/' },
			{ name: 'Werkwijze', path: '/werkwijze' }
		]);
		// schema-dts BreadcrumbList type includes `string` union — cast for test access
		const node = result as unknown as Record<string, unknown>;
		expect(node['@type']).toBe('BreadcrumbList');
	});

	it('Test 2: itemListElement has length 2 and positions 1, 2', async () => {
		const { buildBreadcrumb } = await loadBreadcrumb();
		const result = buildBreadcrumb([
			{ name: 'Home', path: '/' },
			{ name: 'Werkwijze', path: '/werkwijze' }
		]);
		const node = result as unknown as Record<string, unknown>;
		const items = node['itemListElement'] as BreadcrumbItem[];
		expect(Array.isArray(items)).toBe(true);
		expect(items).toHaveLength(2);
		expect(items[0]!.position).toBe(1);
		expect(items[1]!.position).toBe(2);
	});

	it('Test 3: items have absolute URLs from SITE_URL + path', async () => {
		const { buildBreadcrumb } = await loadBreadcrumb();
		const result = buildBreadcrumb([
			{ name: 'Home', path: '/' },
			{ name: 'Werkwijze', path: '/werkwijze' }
		]);
		const node = result as unknown as Record<string, unknown>;
		const items = node['itemListElement'] as BreadcrumbItem[];
		expect(items[0]!.item).toBe('https://trinity-breath-healing.vercel.app/');
		expect(items[1]!.item).toBe('https://trinity-breath-healing.vercel.app/werkwijze');
	});

	it('Test 4: each itemListElement has @type ListItem and name', async () => {
		const { buildBreadcrumb } = await loadBreadcrumb();
		const result = buildBreadcrumb([{ name: 'Home', path: '/' }]);
		const node = result as unknown as Record<string, unknown>;
		const items = node['itemListElement'] as BreadcrumbItem[];
		expect(items[0]!['@type']).toBe('ListItem');
		expect(items[0]!.name).toBe('Home');
	});
});
