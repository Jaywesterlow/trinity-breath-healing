import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execSync, execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const ROBOTS_PATH = 'static/robots.txt';

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

describe('static/robots.txt', () => {
	it('file exists', () => {
		expect(() => readFileSync(ROBOTS_PATH, 'utf8')).not.toThrow();
	});

	describe('content structure', () => {
		const content = readFileSync(ROBOTS_PATH, 'utf8');
		const lines = content.split('\n');

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

	it.skipIf(!bashAvailable)('exits 0 on the committed robots.txt', () => {
		expect(() => execSync(`bash "${scriptPath}"`, { stdio: 'pipe' })).not.toThrow();
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
