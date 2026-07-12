import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CSS_PATH = 'src/app.css';

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

describe('src/app.css — token presence (FND-04)', () => {
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

	// D-09 (plain-CSS lock, "no @import / no @apply") superseded 2026-07-12 by the
	// Tailwind v4 + shadcn migration (Slice 1) — see CLAUDE.md. src/app.css now legitimately
	// starts with `@import 'tailwindcss';`; asserting its absence would be testing for a
	// regression to a decision this repo no longer holds.
	it('imports the Tailwind entrypoint (Slice 1 — D-09 superseded)', () => {
		expect(css).toContain("@import 'tailwindcss'");
	});
});

describe('scripts/check-tokens.sh (FND-04 enforcement)', () => {
	const scriptPath = 'scripts/check-tokens.sh';

	it.skipIf(!bashAvailable)('exits 0 on committed src/app.css', () => {
		expect(() => execSync(`bash "${scriptPath}"`, { stdio: 'pipe' })).not.toThrow();
	});

	it.skipIf(!bashAvailable)('exits 1 when a required token is missing', () => {
		const tmpDir = join(tmpdir(), 'gsd-tokens-test');
		mkdirSync(tmpDir, { recursive: true });
		const tmpCss = join(tmpDir, 'app-missing.css');
		// CSS missing --color-bg-sand entirely
		writeFileSync(tmpCss, ':root { --color-fg-forest: #3D4A35; font-display: swap; }\n');
		expect(() => execSync(`bash "${scriptPath}" "${tmpCss}"`, { stdio: 'pipe' })).toThrow();
		rmSync(tmpDir, { recursive: true, force: true });
	});
});

// scripts/no-shared-css.sh (FND-02 "single shared CSS file" enforcement) was removed in
// Slice 1 Task 4 — it asserted the plain-CSS-lock (D-09), which is superseded by the
// Tailwind v4 + shadcn migration. Tailwind's utility/theme model requires importing
// tailwindcss into src/app.css and (from Slice 2) shadcn component files may ship their
// own scoped styles; "only one shared CSS file" is no longer a rule this repo enforces.
