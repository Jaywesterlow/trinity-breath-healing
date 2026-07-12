import { describe, it, expect } from 'vitest';
import { loadCollection } from '../../src/content/index';

describe('content pipeline (FND-03)', () => {
	it('smoke fixture loads with correct title', () => {
		const glob = import.meta.glob('../../src/content/_smoke/*.svx', { eager: true });
		const entries = loadCollection(glob);
		expect(entries).toHaveLength(1);
		expect(entries[0]!.frontmatter.title).toBe('Smoke fixture');
	});

	it('invalid frontmatter throws with path in error message', () => {
		const fakePath = '/fake/path.svx';
		const glob: Record<string, unknown> = {
			[fakePath]: {
				metadata: { title: 123, datePublished: '2026-06-18', author: 'Test' },
				default: () => null
			}
		};
		expect(() => loadCollection(glob)).toThrow(fakePath);
	});
});
