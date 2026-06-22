/**
 * landing-date.test.ts — TDD gate for Task 1 SEO-09 wiring (Plan 05)
 * Tests: __BUILD_DATE__ injected, visible <time datetime>, JSON-LD WebPage.dateModified
 * Requirements: SEO-09 (visible dateModified on landing), BLOCKER-3 closure
 *
 * Reads the prerendered index.html from .svelte-kit/output/prerendered/pages/index.html
 * This file must exist BEFORE these tests run (run `pnpm build` first or use the
 * verify command in the plan: PUBLIC_SITE_URL=... pnpm build && pnpm test:unit -- --run landing-date)
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'node-html-parser';
import { resolve } from 'path';

const HTML_PATH = resolve('.svelte-kit/output/prerendered/pages/index.html');

describe('SEO-09 — landing page visible dateModified + JSON-LD WebPage.dateModified', () => {
	let html: string;
	let root: ReturnType<typeof parse>;

	beforeAll(() => {
		if (!existsSync(HTML_PATH)) {
			throw new Error(
				`Prerendered index.html not found at ${HTML_PATH}. Run \`pnpm build\` first.`
			);
		}
		html = readFileSync(HTML_PATH, 'utf8');
		root = parse(html);
	});

	it('Test 1: exactly one <time datetime="YYYY-MM-DD"> element exists', () => {
		const times = root.querySelectorAll('time[datetime]');
		expect(times.length).toBe(1);
		const dt = times[0].getAttribute('datetime') ?? '';
		expect(dt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('Test 2: <time> text content matches the datetime attribute (visible = attribute)', () => {
		const times = root.querySelectorAll('time[datetime]');
		expect(times.length).toBeGreaterThan(0);
		const dt = times[0].getAttribute('datetime') ?? '';
		const text = times[0].text.trim();
		expect(text).toBe(dt);
	});

	it('Test 3: JSON-LD WebPage.dateModified matches the visible <time datetime> value', () => {
		const times = root.querySelectorAll('time[datetime]');
		const dt = times[0].getAttribute('datetime') ?? '';

		const scriptEl = root.querySelector('script[type="application/ld+json"]');
		expect(scriptEl, 'no JSON-LD script found').toBeTruthy();
		const graph = JSON.parse(scriptEl!.text)['@graph'] as Array<Record<string, unknown>>;
		const wp = graph.find((n) => n['@type'] === 'WebPage');
		expect(wp, 'WebPage node not in @graph').toBeTruthy();
		expect(wp!['dateModified']).toBe(dt);
	});

	it('Test 4: __BUILD_DATE__ is not present as literal string in output (Vite define replaced it)', () => {
		expect(html).not.toContain('__BUILD_DATE__');
	});
});
