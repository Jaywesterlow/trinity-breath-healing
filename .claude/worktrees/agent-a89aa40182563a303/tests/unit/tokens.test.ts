import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CSS_PATH = 'static/global.css';

const REQUIRED_TOKENS = [
	'--color-bg-sand',
	'--color-fg-forest',
	'--color-accent-gold',
	'--color-card-warm',
	'--color-muted',
	'--color-border',
	'--space-1',
	'--space-4',
	'--space-16',
	'--radius-sm',
	'--radius-md',
	'--radius-lg',
	'--radius-full',
	'--font-display',
	'--font-body',
	'--font-size-base',
	'--font-size-3xl',
	'--line-height-tight',
	'--line-height-normal',
	'--font-weight-regular',
	'--font-weight-bold',
	'--motion-fast',
	'--motion-base',
	'--ease-out',
	'--container-max'
];

/** Detect bash once — bash tests skip on Windows dev machine; CI runs Linux. */
const bashAvailable = (() => {
	try {
		execSync('bash --version', { stdio: 'pipe' });
		return true;
	} catch {
		return false;
	}
})();

describe('static/global.css — token presence (FND-04)', () => {
	const css = readFileSync(CSS_PATH, 'utf8');

	for (const token of REQUIRED_TOKENS) {
		it(`declares ${token}:`, () => {
			expect(css).toContain(`${token}:`);
		});
	}

	it('declares font-display: swap (FND-06)', () => {
		expect(css).toContain('font-display: swap');
	});

	it('contains @media (prefers-reduced-motion: reduce) block (a11y)', () => {
		expect(css).toContain('prefers-reduced-motion');
	});

	it('contains .visually-hidden utility class (a11y)', () => {
		expect(css).toContain('.visually-hidden');
	});

	it('does NOT contain @import (no @import chains per D-09)', () => {
		expect(css).not.toContain('@import');
	});

	it('does NOT contain @apply (no Tailwind directive per D-09)', () => {
		expect(css).not.toContain('@apply');
	});
});

describe('scripts/check-tokens.sh (FND-04 enforcement)', () => {
	const scriptPath = 'scripts/check-tokens.sh';

	it.skipIf(!bashAvailable)('exits 0 on committed global.css', () => {
		expect(() => execSync(`bash "${scriptPath}"`, { stdio: 'pipe' })).not.toThrow();
	});

	it.skipIf(!bashAvailable)('exits 1 when a required token is missing', () => {
		const tmpDir = join(tmpdir(), 'gsd-tokens-test');
		mkdirSync(tmpDir, { recursive: true });
		const tmpCss = join(tmpDir, 'global-missing.css');
		// CSS missing --color-bg-sand entirely
		writeFileSync(tmpCss, ':root { --color-fg-forest: #3D4A35; font-display: swap; }\n');
		expect(() =>
			execSync(`bash "${scriptPath}" "${tmpCss}"`, { stdio: 'pipe' })
		).toThrow();
		rmSync(tmpDir, { recursive: true, force: true });
	});
});

describe('scripts/no-shared-css.sh (FND-02 enforcement)', () => {
	const scriptPath = 'scripts/no-shared-css.sh';

	it.skipIf(!bashAvailable)('exits 0 on current repo (only static/global.css exists)', () => {
		expect(() => execSync(`bash "${scriptPath}"`, { stdio: 'pipe' })).not.toThrow();
	});

	it.skipIf(!bashAvailable)('exits 1 when a rogue CSS file exists in src/', () => {
		const violationPath = 'src/lib/components/Button.css';
		try {
			writeFileSync(violationPath, '.btn { color: red; }\n');
			expect(() =>
				execSync(`bash "${scriptPath}"`, { stdio: 'pipe' })
			).toThrow();
		} finally {
			rmSync(violationPath, { force: true });
		}
	});
});
