/**
 * Plan 08 — HTML audit integration test (defense in depth).
 *
 * Reads prerendered HTML directly from .svelte-kit/output/prerendered/pages/
 * and asserts the same SEO invariants as check-html.ts.
 * Redundant by design: proves the gate logic is exercised both as a CLI script
 * and as a Playwright integration test.
 *
 * Requires: npm run build must have run before this test.
 * Does NOT require a running preview server.
 */
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { parse } from 'node-html-parser';

const PAGES_DIR = path.resolve('.svelte-kit/output/prerendered/pages');
const SITE_URL = process.env.PUBLIC_SITE_URL ?? 'https://trinity-breath-healing.vercel.app';

const DESC_MIN = 148;
const DESC_MAX = 162;

function decode(s: string): string {
	return s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

function walkHtml(dir: string): string[] {
	const files: string[] = [];
	try {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) files.push(...walkHtml(full));
			else if (entry.name.endsWith('.html')) files.push(full);
		}
	} catch {
		// Directory doesn't exist — test will fail with explicit message below
	}
	return files;
}

const htmlFiles = walkHtml(PAGES_DIR);

test('prerendered HTML files exist (build must run before this test)', () => {
	expect(htmlFiles.length).toBeGreaterThan(0);
});

for (const file of htmlFiles) {
	const rel = path.relative(PAGES_DIR, file).replace(/\\/g, '/');

	test(`${rel}: H1 count === 1`, () => {
		const root = parse(readFileSync(file, 'utf8'));
		expect(root.querySelectorAll('h1').length).toBe(1);
	});

	test(`${rel}: <title> present and non-empty`, () => {
		const root = parse(readFileSync(file, 'utf8'));
		const titleEl = root.querySelector('title');
		expect(titleEl).not.toBeNull();
		expect(decode(titleEl!.text).trim().length).toBeGreaterThan(0);
	});

	test(`${rel}: meta description length ${DESC_MIN}–${DESC_MAX} (decoded)`, () => {
		const root = parse(readFileSync(file, 'utf8'));
		const descEl = root.querySelector("meta[name='description']");
		expect(descEl).not.toBeNull();
		const dLen = decode(descEl!.getAttribute('content') ?? '').length;
		expect(dLen).toBeGreaterThanOrEqual(DESC_MIN);
		expect(dLen).toBeLessThanOrEqual(DESC_MAX);
	});

	test(`${rel}: canonical is absolute https://`, () => {
		const root = parse(readFileSync(file, 'utf8'));
		const href = root.querySelector("link[rel='canonical']")?.getAttribute('href') ?? '';
		expect(href).toMatch(/^https:\/\//);
	});

	test(`${rel}: hreflang nl + x-default present`, () => {
		const root = parse(readFileSync(file, 'utf8'));
		expect(root.querySelector("link[rel='alternate'][hreflang='nl']")).not.toBeNull();
		expect(root.querySelector("link[rel='alternate'][hreflang='x-default']")).not.toBeNull();
	});

	test(`${rel}: og:locale === nl_NL (WARNING-3)`, () => {
		const root = parse(readFileSync(file, 'utf8'));
		const ogLocale = root.querySelector("meta[property='og:locale']")?.getAttribute('content');
		expect(ogLocale).toBe('nl_NL');
	});

	test(`${rel}: all required OG tags present`, () => {
		const root = parse(readFileSync(file, 'utf8'));
		for (const prop of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) {
			expect(root.querySelector(`meta[property='${prop}']`), `missing ${prop}`).not.toBeNull();
		}
	});

	test(`${rel}: all required Twitter tags present`, () => {
		const root = parse(readFileSync(file, 'utf8'));
		for (const name of ['twitter:card', 'twitter:title', 'twitter:description']) {
			expect(root.querySelector(`meta[name='${name}']`), `missing ${name}`).not.toBeNull();
		}
	});

	test(`${rel}: landmarks — ≥1 <nav>, exactly 1 <main>, ≥1 <footer> (BLOCKER-5)`, () => {
		const root = parse(readFileSync(file, 'utf8'));
		expect(root.querySelectorAll('nav').length).toBeGreaterThanOrEqual(1);
		expect(root.querySelectorAll('main').length).toBe(1);
		expect(root.querySelectorAll('footer').length).toBeGreaterThanOrEqual(1);
	});

	test(`${rel}: font preload <link rel="preload" as="font" crossorigin> present (defensive FND-06)`, () => {
		const root = parse(readFileSync(file, 'utf8'));
		expect(
			root.querySelector("link[rel='preload'][as='font'][type='font/woff2'][crossorigin]")
		).not.toBeNull();
	});

	if (rel === 'index.html') {
		test(`index.html: exactly 1 <time datetime="YYYY-MM-DD"> with text === datetime (BLOCKER-3 / SEO-09)`, () => {
			const root = parse(readFileSync(file, 'utf8'));
			const times = root.querySelectorAll('time[datetime]');
			expect(times.length).toBe(1);
			const dt = times[0]?.getAttribute('datetime') ?? '';
			expect(dt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(times[0]?.text.trim()).toBe(dt);
		});

		test(`index.html: JSON-LD WebPage.dateModified matches <time datetime> (cross-check / SEO-09)`, () => {
			const html = readFileSync(file, 'utf8');
			const root = parse(html);
			const uiDate = root.querySelector('time[datetime]')?.getAttribute('datetime') ?? '';
			const jsonLdEl = root.querySelector("script[type='application/ld+json']");
			expect(jsonLdEl).not.toBeNull();
			const parsed = JSON.parse(jsonLdEl!.text) as Record<string, unknown>;
			const graph = (parsed['@graph'] ?? []) as Record<string, unknown>[];
			const webPage = graph.find((n) => n['@type'] === 'WebPage');
			expect(webPage, 'WebPage node missing from @graph').toBeDefined();
			expect((webPage as Record<string, unknown>)['dateModified']).toBe(uiDate);
		});
	}
}
