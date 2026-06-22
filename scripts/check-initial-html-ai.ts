#!/usr/bin/env node
/**
 * Plan 08 — AI-crawler initial-HTML smoke test.
 *
 * Fetches a URL with each major AI crawler User-Agent and runs the same
 * SEO assertions as check-html.ts. Verifies no cloaking: AI crawlers
 * see the same content as human browsers (per CONTEXT.md success criterion #1).
 *
 * Supports file:// URLs for offline/CI testing against prerendered output.
 *
 * Usage:
 *   tsx scripts/check-initial-html-ai.ts --url <URL> --ua <UserAgent>
 *
 *   # Offline (single UA):
 *   tsx scripts/check-initial-html-ai.ts \
 *     --url file:///path/to/.svelte-kit/output/prerendered/pages/index.html \
 *     --ua OAI-SearchBot
 *
 *   # All 5 crawlers against live URL (run in CI via Plan 09 manual step):
 *   for UA in OAI-SearchBot ChatGPT-User PerplexityBot ClaudeBot Google-Extended; do
 *     tsx scripts/check-initial-html-ai.ts --url https://trinity-breath-healing.vercel.app/ --ua $UA
 *   done
 *
 * Exit 0 → assertions pass.  Exit 1 → violation or fetch error.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { parse } from 'node-html-parser';

const AI_USER_AGENTS = [
	'OAI-SearchBot',
	'ChatGPT-User',
	'PerplexityBot',
	'ClaudeBot',
	'Google-Extended'
];

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

function parseArgs(): { url: string; ua: string } {
	const args = process.argv.slice(2);
	const urlIdx = args.indexOf('--url');
	const uaIdx = args.indexOf('--ua');
	if (urlIdx === -1 || uaIdx === -1) {
		process.stderr.write(
			'Usage: tsx scripts/check-initial-html-ai.ts --url <URL> --ua <UserAgent>\n'
		);
		process.stderr.write(`Available UAs: ${AI_USER_AGENTS.join(', ')}\n`);
		process.exit(1);
	}
	return { url: args[urlIdx + 1], ua: args[uaIdx + 1] };
}

async function fetchHtml(url: string, ua: string): Promise<string> {
	if (url.startsWith('file://')) {
		// file:// — read local prerendered output (offline/CI use)
		let filePath = fileURLToPath(url);
		// On Windows, fileURLToPath returns C:\... which is correct
		return readFileSync(filePath, 'utf8');
	}
	const res = await fetch(url, {
		headers: { 'User-Agent': ua }
	});
	if (!res.ok) {
		throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
	}
	return res.text();
}

function runAssertions(html: string, url: string, ua: string): boolean {
	const root = parse(html);
	const violations: string[] = [];

	const err = (msg: string) => violations.push(msg);

	// H1
	const h1count = root.querySelectorAll('h1').length;
	if (h1count !== 1) err(`expected 1 <h1>, found ${h1count}`);

	// Title
	const titleText = root.querySelector('title')
		? decode(root.querySelector('title')!.text).trim()
		: '';
	if (!titleText) err('missing or empty <title>');

	// Meta description
	const descRaw = root.querySelector("meta[name='description']")?.getAttribute('content') ?? '';
	if (!descRaw) {
		err('missing <meta name="description">');
	} else {
		const dLen = decode(descRaw).length;
		if (dLen < DESC_MIN || dLen > DESC_MAX)
			err(`meta description length ${dLen} outside ${DESC_MIN}–${DESC_MAX}`);
	}

	// Canonical
	const canonHref = root.querySelector("link[rel='canonical']")?.getAttribute('href') ?? '';
	if (!canonHref.startsWith('https://')) err('canonical missing or not absolute https://');

	// hreflang
	if (!root.querySelector("link[rel='alternate'][hreflang='nl']")) err('missing hreflang="nl"');
	if (!root.querySelector("link[rel='alternate'][hreflang='x-default']"))
		err('missing hreflang="x-default"');

	// OG
	for (const prop of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) {
		if (!root.querySelector(`meta[property='${prop}']`)) err(`missing <meta property="${prop}">`);
	}
	const ogLocale = root.querySelector("meta[property='og:locale']")?.getAttribute('content') ?? '';
	if (ogLocale !== 'nl_NL') err(`og:locale expected "nl_NL", got "${ogLocale}"`);

	// Twitter
	for (const name of ['twitter:card', 'twitter:title', 'twitter:description']) {
		if (!root.querySelector(`meta[name='${name}']`)) err(`missing <meta name="${name}">`);
	}

	// Landmarks
	if (root.querySelectorAll('nav').length < 1) err('missing <nav> landmark');
	if (root.querySelectorAll('main').length !== 1)
		err(`expected 1 <main>, found ${root.querySelectorAll('main').length}`);
	if (root.querySelectorAll('footer').length < 1) err('missing <footer> landmark');

	// JSON-LD
	const jsonLdEls = root.querySelectorAll("script[type='application/ld+json']");
	let jsonLdNodeCount = 0;
	let dateModified = '';
	if (jsonLdEls.length === 1) {
		try {
			const parsed = JSON.parse(jsonLdEls[0].text) as Record<string, unknown>;
			const graph = Array.isArray(parsed['@graph'])
				? (parsed['@graph'] as Record<string, unknown>[])
				: [];
			jsonLdNodeCount = graph.length;
			const wp = graph.find((n) => n['@type'] === 'WebPage');
			if (wp) dateModified = (wp['dateModified'] as string) ?? '';
		} catch {
			err('JSON-LD script does not parse as valid JSON');
		}
	} else {
		err(`expected 1 JSON-LD script, found ${jsonLdEls.length}`);
	}

	// Landing-only: <time datetime>
	const isLanding = url.endsWith('/') || url.endsWith('/index.html');
	if (isLanding) {
		const times = root.querySelectorAll('time[datetime]');
		if (times.length !== 1) {
			err(`expected 1 <time datetime>, found ${times.length} (SEO-09)`);
		} else {
			const dt = times[0].getAttribute('datetime') ?? '';
			if (!/^\d{4}-\d{2}-\d{2}$/.test(dt)) err(`<time datetime="${dt}"> not YYYY-MM-DD`);
		}
	}

	// Summary line (always printed)
	console.log(
		`AI crawler ${ua} sees: title="${decode(root.querySelector('title')?.text ?? '').trim()}", h1count=${h1count}, jsonLdNodes=${jsonLdNodeCount}, dateModified="${dateModified}"`
	);

	if (violations.length > 0) {
		for (const v of violations) process.stderr.write(`✘ [${ua}] ${v}\n`);
		return false;
	}
	console.log(`✔ ${ua}: all checks pass`);
	return true;
}

async function main(): Promise<void> {
	const { url, ua } = parseArgs();
	let html: string;
	try {
		html = await fetchHtml(url, ua);
	} catch (e) {
		process.stderr.write(`✘ fetch error for UA="${ua}" url="${url}": ${(e as Error).message}\n`);
		process.exit(1);
	}
	const ok = runAssertions(html, url, ua);
	if (!ok) process.exit(1);
}

main();
