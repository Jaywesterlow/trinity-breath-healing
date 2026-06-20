#!/usr/bin/env node
/**
 * Plan 08 — JSON-LD validation gate.
 *
 * Walks prerendered pages and asserts structured-data invariants:
 *   - Exactly 1 <script type="application/ld+json"> per page
 *   - Parses as valid JSON with @context === "https://schema.org" and @graph array
 *   - Every @graph node has a @type string
 *   - Landing (index.html): Organization + ProfessionalService + Person + WebSite + ≥4 Service nodes present;
 *     WebPage.dateModified is YYYY-MM-DD; dateModified matches <time datetime> in the same HTML (cross-check)
 *   - Stub pages: BreadcrumbList + WebPage types present
 *   - Service stubs (diensten/<modality>.html): Service with @id "#service-<modality>" present
 *   - FAQPage with mainEntity=[] is VALID in Phase 0 (WARNING-2 / Phase 1 LND-07 raises this gate)
 *
 * Env:
 *   HTML_AUDIT_ROOT  — override default .svelte-kit/output/prerendered/pages
 *
 * Exit 0 → all checks pass.  Exit 1 → at least one violation.
 */
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { parse as parseHtml } from 'node-html-parser';

const ROOT_DIR = process.env.HTML_AUDIT_ROOT ?? '.svelte-kit/output/prerendered/pages';

const LANDING_REQUIRED_TYPES = new Set([
	'Organization',
	'ProfessionalService',
	'Person',
	'WebSite'
]);

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
	const root = parseHtml(html);

	// Exactly one JSON-LD script
	const jsonLdEls = root.querySelectorAll("script[type='application/ld+json']");
	if (jsonLdEls.length === 0) {
		fail(rel, 'missing <script type="application/ld+json">');
		return;
	}
	if (jsonLdEls.length > 1) {
		fail(rel, `expected 1 JSON-LD script, found ${jsonLdEls.length} (Pitfall #6 — one @graph per page)`);
		return;
	}

	// Valid JSON
	let parsed: Record<string, unknown>;
	try {
		parsed = JSON.parse(jsonLdEls[0].text) as Record<string, unknown>;
	} catch {
		fail(rel, 'JSON-LD script does not parse as valid JSON');
		return;
	}

	// @context
	if (parsed['@context'] !== 'https://schema.org') {
		fail(rel, `@context expected "https://schema.org", got "${parsed['@context']}"`);
	}

	// @graph array
	if (!Array.isArray(parsed['@graph'])) {
		fail(rel, '@graph must be an array');
		return;
	}
	const graph = parsed['@graph'] as Record<string, unknown>[];

	// Every node has @type
	for (let i = 0; i < graph.length; i++) {
		if (typeof graph[i]['@type'] !== 'string') {
			fail(rel, `@graph[${i}] missing @type string`);
		}
	}

	const types = graph.map((n) => n['@type'] as string);

	// WARNING-2: FAQPage with mainEntity=[] is valid in Phase 0.
	// Phase 1 LND-07 will flip this gate to require mainEntity.length > 0.
	// (No assertion on FAQPage mainEntity here — intentional Phase 0 contract)

	if (rel === 'index.html') {
		// Landing: required singleton types
		for (const required of LANDING_REQUIRED_TYPES) {
			if (!types.includes(required)) {
				fail(rel, `missing @type "${required}" in @graph`);
			}
		}

		// Landing: ≥4 Service nodes
		const serviceCount = types.filter((t) => t === 'Service').length;
		if (serviceCount < 4) {
			fail(rel, `expected ≥4 Service nodes in @graph, found ${serviceCount}`);
		}

		// Landing: WebPage with dateModified (BLOCKER-3 / SEO-09)
		const webPage = graph.find((n) => n['@type'] === 'WebPage');
		if (!webPage) {
			fail(rel, 'missing WebPage node in @graph');
		} else {
			const dm = webPage['dateModified'] as string | undefined;
			if (!dm) {
				fail(rel, 'WebPage.dateModified missing (BLOCKER-3 / SEO-09)');
			} else if (!/^\d{4}-\d{2}-\d{2}$/.test(dm)) {
				fail(rel, `WebPage.dateModified "${dm}" not YYYY-MM-DD (BLOCKER-3 / SEO-09)`);
			} else {
				// Cross-check: dateModified must match visible <time datetime> in same HTML
				const timeEl = root.querySelector('time[datetime]');
				const uiDate = timeEl?.getAttribute('datetime');
				if (uiDate && dm !== uiDate) {
					fail(
						rel,
						`WebPage.dateModified "${dm}" !== <time datetime="${uiDate}"> (cross-check / SEO-09)`
					);
				}
			}
		}
	} else {
		// All stubs: BreadcrumbList + WebPage required
		if (!types.includes('BreadcrumbList')) fail(rel, 'missing @type "BreadcrumbList" in @graph');
		if (!types.includes('WebPage')) fail(rel, 'missing @type "WebPage" in @graph');

		// Service stubs: assert matching Service @id
		const relParts = rel.split('/');
		if (relParts[0] === 'diensten' && relParts.length === 2) {
			const modality = path.basename(rel, '.html');
			const expectedId = `#service-${modality}`;
			const hasServiceNode = graph.some(
				(n) =>
					n['@type'] === 'Service' &&
					typeof n['@id'] === 'string' &&
					(n['@id'] as string).endsWith(expectedId)
			);
			if (!hasServiceNode) {
				fail(rel, `missing Service @id ending with "${expectedId}"`);
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
console.log(`JSON-LD audit passed: ${files.length} file(s) checked.`);
