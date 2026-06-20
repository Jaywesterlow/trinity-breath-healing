/**
 * Plan 08 — Synthetic violation tests.
 *
 * Proves every HTML/JSON-LD audit gate fires on its specific violation.
 * Each test mutates a baseline HTML string, writes it to a tmpdir, runs
 * the relevant audit script via spawnSync, and asserts exit code + stderr.
 *
 * No browser needed — pure Node.js subprocess testing via Playwright runner.
 *
 * WARNING-2 control test: FAQPage with mainEntity=[] must NOT cause
 * validate-json-ld.ts to exit 1 (Phase 0 contract — empty FAQ is valid).
 */
import { test, expect } from '@playwright/test';
import { spawnSync } from 'child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import os from 'os';
import path from 'path';

// ---------------------------------------------------------------------------
// Baseline HTML — passes all check-html.ts + validate-json-ld.ts assertions.
// Uses a real canonical URL so the landing-only <time datetime> gate fires.
// ---------------------------------------------------------------------------
const SITE_URL = 'https://trinity-breath-healing.vercel.app';

const VALID_JSON_LD = {
	'@context': 'https://schema.org',
	'@graph': [
		{ '@type': 'Organization', '@id': `${SITE_URL}/#organization` },
		{ '@type': 'ProfessionalService', '@id': `${SITE_URL}/#business` },
		{ '@type': 'Person', '@id': `${SITE_URL}/#practitioner` },
		{ '@type': 'WebSite', '@id': `${SITE_URL}/#website` },
		{ '@type': 'Service', '@id': `${SITE_URL}/#service-mahatma-healing` },
		{ '@type': 'Service', '@id': `${SITE_URL}/#service-goldhealing` },
		{ '@type': 'Service', '@id': `${SITE_URL}/#service-raster-energie` },
		{ '@type': 'Service', '@id': `${SITE_URL}/#service-spinal-touch` },
		{
			'@type': 'WebPage',
			'@id': `${SITE_URL}/#webpage`,
			dateModified: '2026-06-20'
		}
	]
};

const DESC_150 =
	'Adem- en energetische therapie bij Trinity Breath & Healing in Amsterdam en omgeving, Nederland. Lees meer over onze aanpak en de behandelingen die we bieden';

const BASELINE_HTML = `<!doctype html>
<html lang="nl">
<head>
  <title>TRINITY Breath &amp; Healing</title>
  <meta name="description" content="${DESC_150}">
  <link rel="canonical" href="${SITE_URL}/">
  <link rel="alternate" hreflang="nl" href="${SITE_URL}/">
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/">
  <meta property="og:title" content="TRINITY Breath &amp; Healing">
  <meta property="og:description" content="Energetische therapie Amsterdam">
  <meta property="og:url" content="${SITE_URL}/">
  <meta property="og:image" content="${SITE_URL}/og-image.jpg">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="nl_NL">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="TRINITY Breath &amp; Healing">
  <meta name="twitter:description" content="Energetische therapie Amsterdam">
  <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/dm-sans.woff2">
  <script type="application/ld+json">${JSON.stringify(VALID_JSON_LD)}</script>
</head>
<body>
  <nav><a href="/">Home</a></nav>
  <main>
    <h1>Trinity Breath &amp; Healing</h1>
    <p>Welkom bij Trinity Breath &amp; Healing.</p>
    <p class="page-meta">Laatst bijgewerkt: <time datetime="2026-06-20">2026-06-20</time></p>
  </main>
  <footer><p>&copy; 2026 Trinity Breath &amp; Healing</p></footer>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
	return mkdtempSync(path.join(os.tmpdir(), 'tbh-audit-'));
}

function runCheckHtml(tmpDir: string): { exitCode: number; stderr: string } {
	const result = spawnSync('node', ['--import', 'tsx/esm', 'scripts/check-html.ts'], {
		env: { ...process.env, HTML_AUDIT_ROOT: tmpDir, PUBLIC_SITE_URL: SITE_URL },
		encoding: 'utf8'
	});
	return { exitCode: result.status ?? 1, stderr: result.stderr ?? '' };
}

function runValidateJsonLd(tmpDir: string): { exitCode: number; stderr: string } {
	const result = spawnSync('node', ['--import', 'tsx/esm', 'scripts/validate-json-ld.ts'], {
		env: { ...process.env, HTML_AUDIT_ROOT: tmpDir },
		encoding: 'utf8'
	});
	return { exitCode: result.status ?? 1, stderr: result.stderr ?? '' };
}

function writeIndex(tmpDir: string, html: string): void {
	writeFileSync(path.join(tmpDir, 'index.html'), html, 'utf8');
}

function cleanup(tmpDir: string): void {
	if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// check-html.ts synthetic violations
// ---------------------------------------------------------------------------

test('baseline passes check-html.ts', () => {
	const tmp = makeTmpDir();
	try {
		writeIndex(tmp, BASELINE_HTML);
		const { exitCode } = runCheckHtml(tmp);
		expect(exitCode).toBe(0);
	} finally {
		cleanup(tmp);
	}
});

test('second <h1> causes check-html.ts to exit 1', () => {
	const tmp = makeTmpDir();
	try {
		const mutated = BASELINE_HTML.replace('<h1>Trinity Breath &amp; Healing</h1>', '<h1>Trinity Breath &amp; Healing</h1><h1>Tweede koptitel</h1>');
		writeIndex(tmp, mutated);
		const { exitCode, stderr } = runCheckHtml(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('expected 1 <h1>');
	} finally {
		cleanup(tmp);
	}
});

test('missing <title> causes check-html.ts to exit 1', () => {
	const tmp = makeTmpDir();
	try {
		const mutated = BASELINE_HTML.replace(/<title>[^<]*<\/title>/, '');
		writeIndex(tmp, mutated);
		const { exitCode, stderr } = runCheckHtml(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('<title>');
	} finally {
		cleanup(tmp);
	}
});

test('oversized meta description causes check-html.ts to exit 1', () => {
	const tmp = makeTmpDir();
	try {
		const longDesc = 'X'.repeat(300);
		const mutated = BASELINE_HTML.replace(
			/content="[^"]*"(?=\s*>(?!<\/head>))/,
			`content="${longDesc}"`
		);
		// Use targeted replacement for description
		const fixed = BASELINE_HTML.replace(
			`content="${DESC_150}"`,
			`content="${longDesc}"`
		);
		writeIndex(tmp, fixed);
		const { exitCode, stderr } = runCheckHtml(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('meta description length');
	} finally {
		cleanup(tmp);
	}
});

test('missing canonical causes check-html.ts to exit 1', () => {
	const tmp = makeTmpDir();
	try {
		const mutated = BASELINE_HTML.replace(/<link rel="canonical"[^>]+>/, '');
		writeIndex(tmp, mutated);
		const { exitCode, stderr } = runCheckHtml(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('canonical');
	} finally {
		cleanup(tmp);
	}
});

test('missing og:locale causes check-html.ts to exit 1 (WARNING-3)', () => {
	const tmp = makeTmpDir();
	try {
		const mutated = BASELINE_HTML.replace(/<meta property="og:locale"[^>]+>/, '');
		writeIndex(tmp, mutated);
		const { exitCode, stderr } = runCheckHtml(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('og:locale');
	} finally {
		cleanup(tmp);
	}
});

test('wrong og:locale value causes check-html.ts to exit 1 (WARNING-3)', () => {
	const tmp = makeTmpDir();
	try {
		const mutated = BASELINE_HTML.replace('content="nl_NL"', 'content="en_US"');
		writeIndex(tmp, mutated);
		const { exitCode, stderr } = runCheckHtml(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('og:locale');
		expect(stderr).toContain('nl_NL');
	} finally {
		cleanup(tmp);
	}
});

test('missing <nav> causes check-html.ts to exit 1 (BLOCKER-5)', () => {
	const tmp = makeTmpDir();
	try {
		const mutated = BASELINE_HTML.replace(/<nav>[\s\S]*?<\/nav>/, '<div class="nav-replaced">nav removed</div>');
		writeIndex(tmp, mutated);
		const { exitCode, stderr } = runCheckHtml(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('<nav>');
	} finally {
		cleanup(tmp);
	}
});

test('missing <footer> causes check-html.ts to exit 1 (BLOCKER-5)', () => {
	const tmp = makeTmpDir();
	try {
		const mutated = BASELINE_HTML.replace(/<footer>[\s\S]*?<\/footer>/, '<div class="footer-replaced"></div>');
		writeIndex(tmp, mutated);
		const { exitCode, stderr } = runCheckHtml(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('<footer>');
	} finally {
		cleanup(tmp);
	}
});

test('missing landing <time datetime> causes check-html.ts to exit 1 (BLOCKER-3 / SEO-09)', () => {
	const tmp = makeTmpDir();
	try {
		const mutated = BASELINE_HTML.replace(/<time datetime="[^"]*">[^<]*<\/time>/, 'bijgewerkt');
		writeIndex(tmp, mutated);
		const { exitCode, stderr } = runCheckHtml(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('SEO-09');
	} finally {
		cleanup(tmp);
	}
});

// ---------------------------------------------------------------------------
// validate-json-ld.ts synthetic violations
// ---------------------------------------------------------------------------

test('baseline passes validate-json-ld.ts', () => {
	const tmp = makeTmpDir();
	try {
		writeIndex(tmp, BASELINE_HTML);
		const { exitCode } = runValidateJsonLd(tmp);
		expect(exitCode).toBe(0);
	} finally {
		cleanup(tmp);
	}
});

test('missing JSON-LD script causes validate-json-ld.ts to exit 1', () => {
	const tmp = makeTmpDir();
	try {
		const mutated = BASELINE_HTML.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
		writeIndex(tmp, mutated);
		const { exitCode, stderr } = runValidateJsonLd(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('missing <script type="application/ld+json">');
	} finally {
		cleanup(tmp);
	}
});

test('second JSON-LD script causes validate-json-ld.ts to exit 1', () => {
	const tmp = makeTmpDir();
	try {
		const extra = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Thing"}</script>`;
		const mutated = BASELINE_HTML.replace('</head>', extra + '</head>');
		writeIndex(tmp, mutated);
		const { exitCode, stderr } = runValidateJsonLd(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('expected 1 JSON-LD script');
	} finally {
		cleanup(tmp);
	}
});

test('corrupt JSON-LD causes validate-json-ld.ts to exit 1', () => {
	const tmp = makeTmpDir();
	try {
		const mutated = BASELINE_HTML.replace(
			/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
			'<script type="application/ld+json">{ NOT VALID JSON !!!</script>'
		);
		writeIndex(tmp, mutated);
		const { exitCode, stderr } = runValidateJsonLd(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('valid JSON');
	} finally {
		cleanup(tmp);
	}
});

test('missing Organization node causes validate-json-ld.ts to exit 1', () => {
	const tmp = makeTmpDir();
	try {
		const graphWithoutOrg = VALID_JSON_LD['@graph'].filter((n) => n['@type'] !== 'Organization');
		const ld = { ...VALID_JSON_LD, '@graph': graphWithoutOrg };
		const mutated = BASELINE_HTML.replace(
			/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
			`<script type="application/ld+json">${JSON.stringify(ld)}</script>`
		);
		writeIndex(tmp, mutated);
		const { exitCode, stderr } = runValidateJsonLd(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('Organization');
	} finally {
		cleanup(tmp);
	}
});

test('missing WebPage.dateModified causes validate-json-ld.ts to exit 1 (SEO-09)', () => {
	const tmp = makeTmpDir();
	try {
		const graphNoDM = VALID_JSON_LD['@graph'].map((n) => {
			if (n['@type'] === 'WebPage') {
				const { dateModified: _dm, ...rest } = n as { '@type': string; dateModified?: string; [k: string]: unknown };
				return rest;
			}
			return n;
		});
		const ld = { ...VALID_JSON_LD, '@graph': graphNoDM };
		const mutated = BASELINE_HTML.replace(
			/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
			`<script type="application/ld+json">${JSON.stringify(ld)}</script>`
		);
		writeIndex(tmp, mutated);
		const { exitCode, stderr } = runValidateJsonLd(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('dateModified');
	} finally {
		cleanup(tmp);
	}
});

test('non-ISO WebPage.dateModified causes validate-json-ld.ts to exit 1 (SEO-09)', () => {
	const tmp = makeTmpDir();
	try {
		const graphBadDM = VALID_JSON_LD['@graph'].map((n) => {
			if (n['@type'] === 'WebPage') return { ...n, dateModified: 'June 20 2026' };
			return n;
		});
		const ld = { ...VALID_JSON_LD, '@graph': graphBadDM };
		const mutated = BASELINE_HTML.replace(
			/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
			`<script type="application/ld+json">${JSON.stringify(ld)}</script>`
		);
		writeIndex(tmp, mutated);
		const { exitCode, stderr } = runValidateJsonLd(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('YYYY-MM-DD');
	} finally {
		cleanup(tmp);
	}
});

// WARNING-2 positive control: FAQPage with mainEntity=[] must be VALID in Phase 0
test('FAQPage with mainEntity=[] passes validate-json-ld.ts (WARNING-2 Phase 0 contract)', () => {
	const tmp = makeTmpDir();
	try {
		const graphWithFaq = [
			...VALID_JSON_LD['@graph'],
			{
				'@type': 'FAQPage',
				'@id': `${SITE_URL}/#faq`,
				// WARNING-2 / Phase 0 contract: FAQPage with mainEntity=[] is valid.
				// Phase 1 LND-07 raises the threshold; flip the gate there.
				mainEntity: []
			}
		];
		const ld = { ...VALID_JSON_LD, '@graph': graphWithFaq };
		const mutated = BASELINE_HTML.replace(
			/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
			`<script type="application/ld+json">${JSON.stringify(ld)}</script>`
		);
		writeIndex(tmp, mutated);
		const { exitCode } = runValidateJsonLd(tmp);
		// Must exit 0 — empty FAQPage is VALID in Phase 0
		expect(exitCode).toBe(0);
	} finally {
		cleanup(tmp);
	}
});

// ---------------------------------------------------------------------------
// Stub page validations (non-landing HTML)
// ---------------------------------------------------------------------------

test('stub page missing BreadcrumbList causes validate-json-ld.ts to exit 1', () => {
	const tmp = makeTmpDir();
	try {
		const stubLd = {
			'@context': 'https://schema.org',
			'@graph': [
				{ '@type': 'Organization', '@id': `${SITE_URL}/#organization` },
				{ '@type': 'WebPage', '@id': `${SITE_URL}/werkwijze#webpage` }
				// BreadcrumbList intentionally missing
			]
		};
		const stubHtml = BASELINE_HTML
			.replace(`href="${SITE_URL}/"`, `href="${SITE_URL}/werkwijze"`)
			.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(stubLd)}</script>`);
		writeFileSync(path.join(tmp, 'werkwijze.html'), stubHtml, 'utf8');
		const { exitCode, stderr } = runValidateJsonLd(tmp);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('BreadcrumbList');
	} finally {
		cleanup(tmp);
	}
});
