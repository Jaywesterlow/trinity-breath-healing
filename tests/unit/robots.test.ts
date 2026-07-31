import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildRobotsTxt } from '../../src/lib/seo/robots';

// robots.txt is generated (src/routes/robots.txt/+server.ts), not a static file — a static file
// could not interpolate PUBLIC_SITE_URL and its Sitemap line went stale. Asserting against the
// builder rather than a built artefact keeps these as unit tests: no build, no environment.
const SITE_URL = 'https://trinitybreathhealing.nl';

const NAMED_BOTS = [
	'OAI-SearchBot',
	'ChatGPT-User',
	'PerplexityBot',
	'Perplexity-User',
	'ClaudeBot',
	'Claude-User',
	'Google-Extended',
	'Applebot-Extended'
];

/** Detect bash availability once — bash tests skip if not available (CI runs Linux). */
const bashAvailable = (() => {
	try {
		execSync('bash --version', { stdio: 'pipe' });
		return true;
	} catch {
		return false;
	}
})();

describe('robots.txt (generated)', () => {
	it('there is no static/robots.txt shadowing the route', async () => {
		// SvelteKit serves static/ ahead of routes, so a stray file here would silently win and
		// re-introduce the hardcoded domain this route exists to remove.
		const { existsSync } = await import('node:fs');
		expect(existsSync('static/robots.txt')).toBe(false);
	});

	it('the Sitemap line follows the site URL it is given', () => {
		expect(buildRobotsTxt('https://example.test')).toContain(
			'Sitemap: https://example.test/sitemap.xml'
		);
	});

	describe('content structure', () => {
		const content = buildRobotsTxt(SITE_URL);
		const lines = content.split(/\r?\n/);

		for (const bot of NAMED_BOTS) {
			it(`contains User-agent: ${bot} followed by Allow: /`, () => {
				const botIdx = lines.findIndex((l) => l.trim() === `User-agent: ${bot}`);
				expect(botIdx, `User-agent: ${bot} not found`).toBeGreaterThanOrEqual(0);
				// next non-blank line after the bot declaration must be Allow: /
				let next = botIdx + 1;
				while (next < lines.length && (lines[next] ?? '').trim() === '') next++;
				expect(lines[next]?.trim()).toBe('Allow: /');
			});
		}

		it('every named bot User-agent line index is less than wildcard index', () => {
			const wildcardIdx = lines.findIndex((l) => l.trim() === 'User-agent: *');
			expect(wildcardIdx, 'User-agent: * not found').toBeGreaterThanOrEqual(0);
			for (const bot of NAMED_BOTS) {
				const botIdx = lines.findIndex((l) => l.trim() === `User-agent: ${bot}`);
				expect(botIdx, `User-agent: ${bot} not found`).toBeGreaterThanOrEqual(0);
				expect(botIdx, `${bot} line must precede wildcard`).toBeLessThan(wildcardIdx);
			}
		});

		it('wildcard block contains Allow: / and Disallow: /api/', () => {
			const wildcardIdx = lines.findIndex((l) => l.trim() === 'User-agent: *');
			const afterWildcard = lines.slice(wildcardIdx + 1).join('\n');
			expect(afterWildcard).toContain('Allow: /');
			expect(afterWildcard).toContain('Disallow: /api/');
		});

		it('contains Sitemap line starting with https:// and ending with /sitemap.xml', () => {
			const sitemapLine = lines.find((l) => l.startsWith('Sitemap: https://'));
			expect(sitemapLine).toBeDefined();
			expect(sitemapLine).toMatch(/Sitemap: https:\/\/.+\/sitemap\.xml$/);
		});

		it('contains DECISION comment referencing CONTEXT.md', () => {
			expect(content).toContain('DECISION');
			expect(content).toContain('CONTEXT.md');
		});
	});
});

describe('scripts/check-robots.sh', () => {
	const scriptPath = 'scripts/check-robots.sh';

	it.skipIf(!bashAvailable)('exits 0 on the generated robots.txt', () => {
		const tmpDir = join(tmpdir(), 'gsd-robots-test');
		mkdirSync(tmpDir, { recursive: true });
		const tmpFile = join(tmpDir, 'robots-generated.txt');
		writeFileSync(tmpFile, buildRobotsTxt(SITE_URL));
		expect(() => execSync(`bash "${scriptPath}" "${tmpFile}"`, { stdio: 'pipe' })).not.toThrow();
	});

	it.skipIf(!bashAvailable)('exits 1 on a synthetic violation (wildcard before named bots)', () => {
		const violatingContent = [
			'# robots.txt — violation test',
			'',
			'User-agent: *',
			'Allow: /',
			'Disallow: /api/',
			'',
			...NAMED_BOTS.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
			'Sitemap: https://example.com/sitemap.xml'
		].join('\n');

		const tmpDir = join(tmpdir(), 'gsd-robots-test');
		mkdirSync(tmpDir, { recursive: true });
		const tmpFile = join(tmpDir, 'robots-violation.txt');
		writeFileSync(tmpFile, violatingContent);

		expect(() => execSync(`bash "${scriptPath}" "${tmpFile}"`, { stdio: 'pipe' })).toThrow();
	});
});
