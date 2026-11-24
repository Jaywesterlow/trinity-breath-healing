import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guard against shipping visible <Todo> markers (they render as red
 * <mark data-todo> text on public pages) beyond the ones that are known and
 * waiting on a decision.
 *
 * KNOWN_OPEN lists the markers that still exist on purpose, as file -> count.
 * It must only ever shrink: fill a marker, then lower its count here. Adding a
 * new <Todo> to a route, or raising a count, fails this test.
 *
 * Open on 2026-11-24 (each waits on the practitioner or a reviewed text):
 *  - privacyverklaring: non-EU access cell, retention period
 *  - algemene-voorwaarden: fee for cancelling inside the term, complaints scheme
 */
const KNOWN_OPEN: Record<string, number> = {
	'src/routes/privacyverklaring/+page.svelte': 2,
	'src/routes/algemene-voorwaarden/+page.svelte': 2
};

function walk(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const p = join(dir, name);
		return statSync(p).isDirectory() ? walk(p) : [p];
	});
}

describe('open <Todo> markers on routes', () => {
	const counts: Record<string, number> = {};
	for (const file of walk('src/routes').filter((f) => f.endsWith('.svelte'))) {
		// Strip /* */ comments (script docs mention <Todo>) before counting.
		const src = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
		const n = (src.match(/<Todo[\s>]/g) ?? []).length;
		if (n > 0) counts[file] = n;
	}

	it('only the known open markers remain', () => {
		expect(counts).toEqual(KNOWN_OPEN);
	});
});
