#!/usr/bin/env node
/**
 * Plan 08 — HTML audit gate.
 *
 * Walks prerendered pages and asserts SEO/AEO invariants:
 *   - H1 count === 1
 *   - <title> present and non-empty
 *   - <meta name="description"> length 148–162 (decoded entities)
 *   - <link rel="canonical"> absolute https://
 *   - hreflang nl + x-default
 *   - og:title, og:description, og:url, og:image, og:type
 *   - og:locale === "nl_NL"  (WARNING-3)
 *   - twitter:card, twitter:title, twitter:description
 *   - ≥1 <nav>, exactly 1 <main>, ≥1 <footer>  (BLOCKER-5 / SEO-03)
 *   - <link rel="preload" as="font" type="font/woff2" crossorigin>  (defensive FND-06)
 *   - Landing (index.html) only: exactly 1 <time datetime="YYYY-MM-DD"> with text === datetime  (BLOCKER-3 / SEO-09)
 *
 * Title length deviation (Plan 08 SUMMARY §Deviations):
 *   Head.svelte appends " | TRINITY Breath & Healing" to non-root page titles (81–86 chars rendered).
 *   Root title is brand-only ("TRINITY Breath & Healing", 24 chars). Neither matches the 50–60 spec.
 *   Gate asserts presence only. Plan 05 SUMMARY documents the suffix behaviour.
 *
 * Description length note:
 *   Gate uses decoded-entity bounds (148–162). Rendered HTML encodes "&" as "&amp;" (+4 chars/&).
 *   After decode, all actual descriptions fall within 151–159 chars.
 *
 * Env:
 *   HTML_AUDIT_ROOT  — override default .svelte-kit/output/prerendered/pages
 *   PUBLIC_SITE_URL  — canonical base URL (default: https://trinity-breath-healing.vercel.app)
 *
 * Exit 0 → all checks pass.  Exit 1 → at least one violation (all printed to stderr).
 */
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { parse } from 'node-html-parser';

const SITE_URL = (
	process.env.PUBLIC_SITE_URL ?? 'https://trinity-breath-healing.vercel.app'
).replace(/\/$/, '');
const ROOT_DIR = process.env.HTML_AUDIT_ROOT ?? '.svelte-kit/output/prerendered/pages';

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
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) files.push(...walkHtml(full));
		else if (entry.name.endsWith('.html')) files.push(full);
	}
	return files;
}

let failures = 0;

function fail(rel: string, reason: string): void {
	process.stderr.write(`✘ ${rel}: ${reason}\n`);
	failures++;
}

function auditFile(file: string): void {
	const rel = path.relative(ROOT_DIR, file).replace(/\\/g, '/');
	const html = readFileSync(file, 'utf8');
	const root = parse(html);

	// H1
	const h1count = root.querySelectorAll('h1').length;
	if (h1count !== 1) fail(rel, `expected 1 <h1>, found ${h1count}`);

	// Title (presence only — see deviation note in module docblock)
	const titleEl = root.querySelector('title');
	const titleText = titleEl ? decode(titleEl.text).trim() : '';
	if (!titleText) fail(rel, 'missing or empty <title>');

	// Meta description (148–162 chars, decoded)
	const descEl = root.querySelector("meta[name='description']");
	const descRaw = descEl?.getAttribute('content') ?? '';
	if (!descRaw) {
		fail(rel, 'missing <meta name="description">');
	} else {
		const dLen = decode(descRaw).length;
		if (dLen < DESC_MIN || dLen > DESC_MAX) {
			fail(rel, `meta description length ${dLen} outside ${DESC_MIN}–${DESC_MAX} (decoded)`);
		}
	}

	// Canonical — absolute https://
	const canonHref = root.querySelector("link[rel='canonical']")?.getAttribute('href') ?? '';
	if (!canonHref.startsWith('https://')) fail(rel, 'canonical missing or not absolute https://');

	// hreflang
	if (!root.querySelector("link[rel='alternate'][hreflang='nl']"))
		fail(rel, 'missing hreflang="nl"');
	if (!root.querySelector("link[rel='alternate'][hreflang='x-default']"))
		fail(rel, 'missing hreflang="x-default"');

	// OG tags
	for (const prop of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) {
		if (!root.querySelector(`meta[property='${prop}']`))
			fail(rel, `missing <meta property="${prop}">`);
	}

	// og:locale === nl_NL (WARNING-3)
	const ogLocale = root.querySelector("meta[property='og:locale']")?.getAttribute('content') ?? '';
	if (ogLocale !== 'nl_NL') fail(rel, `og:locale expected "nl_NL", got "${ogLocale}" (WARNING-3)`);

	// Twitter
	for (const name of ['twitter:card', 'twitter:title', 'twitter:description']) {
		if (!root.querySelector(`meta[name='${name}']`)) fail(rel, `missing <meta name="${name}">`);
	}

	// Landmarks (BLOCKER-5 / SEO-03)
	const navCount = root.querySelectorAll('nav').length;
	const mainCount = root.querySelectorAll('main').length;
	const footerCount = root.querySelectorAll('footer').length;
	if (navCount < 1) fail(rel, 'missing <nav> landmark (BLOCKER-5)');
	if (mainCount !== 1) fail(rel, `expected 1 <main>, found ${mainCount} (BLOCKER-5)`);
	if (footerCount < 1) fail(rel, 'missing <footer> landmark (BLOCKER-5)');

	// Defensive font preload (Plan 06 owns FND-06; this gate catches accidental removal)
	if (!root.querySelector("link[rel='preload'][as='font'][type='font/woff2'][crossorigin]")) {
		fail(
			rel,
			'missing <link rel="preload" as="font" type="font/woff2" crossorigin> (defensive FND-06)'
		);
	}

	// Landing-only: <time datetime> (BLOCKER-3 / SEO-09)
	if (rel === 'index.html') {
		const times = root.querySelectorAll('time[datetime]');
		if (times.length !== 1) {
			fail(rel, `expected 1 <time datetime>, found ${times.length} (BLOCKER-3 / SEO-09)`);
		} else {
			const dt = times[0].getAttribute('datetime') ?? '';
			const text = times[0].text.trim();
			if (!/^\d{4}-\d{2}-\d{2}$/.test(dt)) {
				fail(rel, `<time datetime> attribute "${dt}" is not YYYY-MM-DD (BLOCKER-3 / SEO-09)`);
			} else if (text !== dt) {
				fail(
					rel,
					`<time> visible text "${text}" !== datetime attribute "${dt}" (BLOCKER-3 / SEO-09)`
				);
			}
		}
	}
}

const files = walkHtml(ROOT_DIR);
if (files.length === 0) {
	process.stderr.write(`✘ No HTML files found in ${ROOT_DIR}\n`);
	process.exit(1);
}
for (const file of files) auditFile(file);
if (failures > 0) process.exit(1);
console.log(`HTML audit passed: ${files.length} file(s) checked.`);
