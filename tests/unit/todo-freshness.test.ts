/**
 * TODO.md is a backlog a person reads and acts on, so a stale line in it is worse
 * than no line: it sends someone to chase work that is already done. It has gone
 * stale twice — it claimed the phone number was still missing a month after it
 * shipped, and it claimed five published URLs the day there were sixteen.
 *
 * A markdown file cannot be kept fresh by good intentions, so the claims a machine
 * can check are checked here, against the code that is the actual source of truth.
 * The claims a machine cannot check (what the practitioner still owes, what a
 * decision was) stay prose and carry a date instead.
 *
 * If this fails, the fix is to update TODO.md — not to loosen the test.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ALL_ROUTES } from '../../src/lib/constants/routes';

/* Vitest runs from the project root, and its jsdom environment does not give
   import.meta.url a file: scheme to resolve against. */
const TODO = readFileSync(resolve(process.cwd(), 'TODO.md'), 'utf8');

const published = ALL_ROUTES.filter((r) => r.kind === 'landing' || r.kind === 'page');
const stubs = ALL_ROUTES.filter((r) => r.kind === 'stub' || r.kind === 'service-stub');

describe('TODO.md still describes the codebase', () => {
	it('states the route and published counts that routes.ts actually has', () => {
		expect(TODO, `TODO.md should say there are ${ALL_ROUTES.length} routes`).toContain(
			`**${ALL_ROUTES.length} routes**`
		);
		expect(TODO, `TODO.md should say ${published.length} are published`).toContain(
			`**${published.length} published**`
		);
	});

	it('names every route that is still a stub, and no route that is not', () => {
		/* The stub list is the one thing in the file someone acts on directly: it is
		   what is left to write. A graduated route left in it is an invitation to
		   redo finished work. */
		const line = TODO.split('\n').find((l) => l.includes('still stubs'));
		expect(line, 'TODO.md should carry a "still stubs" line').toBeDefined();

		/* Only the part after "still stubs" — the same sentence also names the routes
		   that graduated, and those are supposed to be there. */
		const list = line!.slice(line!.indexOf('still stubs'));

		for (const r of stubs) {
			expect(list, `${r.path} is a stub and should be listed`).toContain(`\`${r.path}\``);
		}
		for (const r of published) {
			if (r.path === '/') continue; // '/' is a substring of every path
			expect(list, `${r.path} is published and should not be in the stub list`).not.toContain(
				`\`${r.path}\``
			);
		}
	});

	it('does not carry a hardcoded test count, which is what went stale before', () => {
		expect(TODO).not.toMatch(/\d+ unit, \d+ integration/);
	});
});
