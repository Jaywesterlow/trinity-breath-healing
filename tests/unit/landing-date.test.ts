/**
 * landing-date.test.ts — TDD gate for Plan 05 Task 1 (SEO-09 / BLOCKER-3 closure)
 *
 * Verifies that after an npm run build, the landing page HTML at
 * .svelte-kit/output/prerendered/pages/index.html:
 *   1. Contains exactly one <time datetime="YYYY-MM-DD"> element
 *   2. The datetime attribute is a valid ISO date (YYYY-MM-DD)
 *   3. The visible text content of <time> matches the datetime attribute
 *   4. The JSON-LD payload's WebPage node has dateModified matching the same date
 *   5. The literal string __BUILD_DATE__ does NOT appear anywhere in the file
 *      (Vite define replaced it at build time)
 *
 * Requirements: SEO-09, BLOCKER-3
 *
 * NOTE: This test reads the prerendered HTML. Run `npm run build` before running this test.
 * Use: `PUBLIC_SITE_URL=https://trinity-breath-healing.vercel.app npm run build && pnpm test:unit -- --run landing-date`
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'node-html-parser';

const HTML_PATH = resolve('.svelte-kit/output/prerendered/pages/index.html');

describe('Landing page SEO-09 — visible dateModified + JSON-LD single-source (BLOCKER-3)', () => {
	it('prerendered index.html exists (run npm run build first)', () => {
		expect(existsSync(HTML_PATH), `Missing: ${HTML_PATH} — run npm run build first`).toBe(true);
	});

	it('landing HTML contains exactly one <time datetime="YYYY-MM-DD"> element', () => {
		if (!existsSync(HTML_PATH)) return;
		const raw = readFileSync(HTML_PATH, 'utf8');
		const root = parse(raw);
		const times = root.querySelectorAll('time[datetime]');
		expect(times.length, `Expected exactly 1 <time datetime>, got ${times.length}`).toBe(1);
		const dt = times[0]!.getAttribute('datetime')!;
		expect(dt, 'datetime attribute must match YYYY-MM-DD format').toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('<time> text content matches its datetime attribute (visible text = machine-readable date)', () => {
		if (!existsSync(HTML_PATH)) return;
		const raw = readFileSync(HTML_PATH, 'utf8');
		const root = parse(raw);
		const times = root.querySelectorAll('time[datetime]');
		if (times.length !== 1) return; // guarded by prior test
		const el = times[0]!;
		const dt = el.getAttribute('datetime')!;
		const text = el.text.trim();
		expect(text, `<time> text "${text}" must equal datetime attribute "${dt}"`).toBe(dt);
	});

	it('JSON-LD WebPage node dateModified matches the visible <time datetime> (single source of truth)', () => {
		if (!existsSync(HTML_PATH)) return;
		const raw = readFileSync(HTML_PATH, 'utf8');
		const root = parse(raw);

		// Extract datetime from <time> element
		const times = root.querySelectorAll('time[datetime]');
		if (times.length !== 1) return;
		const dt = times[0]!.getAttribute('datetime')!;

		// Find JSON-LD script
		const scripts = root.querySelectorAll('script[type="application/ld+json"]');
		expect(scripts.length, 'Expected at least one JSON-LD script').toBeGreaterThan(0);

		// Parse @graph and find WebPage node
		let foundWebPage = false;
		for (const script of scripts) {
			try {
				const payload = JSON.parse(script.text) as Record<string, unknown>;
				const graph = payload['@graph'] as Array<Record<string, unknown>> | undefined;
				if (!graph) continue;
				const webPage = graph.find((n) => n['@type'] === 'WebPage');
				if (webPage) {
					expect(
						webPage['dateModified'],
						`WebPage.dateModified "${String(webPage['dateModified'])}" must equal visible <time datetime> "${dt}"`
					).toBe(dt);
					foundWebPage = true;
					break;
				}
			} catch {
				// not the right script tag
			}
		}
		expect(foundWebPage, 'WebPage node not found in any JSON-LD @graph').toBe(true);
	});

	it('__BUILD_DATE__ literal is NOT present in the prerendered HTML (Vite replaced it)', () => {
		if (!existsSync(HTML_PATH)) return;
		const raw = readFileSync(HTML_PATH, 'utf8');
		expect(raw, '__BUILD_DATE__ must not appear in prerendered HTML — Vite define did not replace it').not.toContain('__BUILD_DATE__');
	});
});
