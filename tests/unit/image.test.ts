/**
 * EnhancedImage primitive tests (Plan 00-07, PRF-01)
 *
 * Tests 1-4 verify rendering behaviour via Svelte SSR compilation.
 * Tests 5-7 verify required-prop TypeScript discipline via tsc --noEmit on
 * fixture .ts files (plan's explicit fallback — svelte-check on isolated
 * fixture files is unreliable in a worktree without full SvelteKit context).
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import { compile, preprocess } from 'svelte/compiler';
import { render } from 'svelte/server';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = path.resolve(import.meta.dirname, '../..');

/**
 * Compiles and server-renders EnhancedImage with the given props.
 * The Svelte compiler is called directly so we don't need @testing-library/svelte.
 * We preprocess `<enhanced:img>` → `<img>` because the Vite plugin runs at
 * build-time only; in unit tests we just need the prop-forwarding logic.
 */
async function renderEnhancedImage(props: {
	src: string;
	alt: string;
	width: number;
	height: number;
	loading?: 'eager' | 'lazy';
	fetchpriority?: 'high' | 'low' | 'auto';
	class?: string;
}): Promise<string> {
	const fs = await import('fs');
	const componentPath = path.join(ROOT, 'src/lib/components/EnhancedImage.svelte');
	const source = fs.readFileSync(componentPath, 'utf-8');

	// Preprocess: replace <enhanced:img with <img (mirrors what Vite does at build-time)
	const preprocessed = await preprocess(source, [
		{
			markup({ content }: { content: string }) {
				return { code: content.replace(/<enhanced:img/g, '<img').replace(/<\/enhanced:img>/g, '</img>') };
			}
		}
	]);

	const { js } = compile(preprocessed.code, {
		generate: 'server',
		filename: 'EnhancedImage.svelte'
	});

	// Evaluate the compiled module and call render()
	// We use a Function constructor to run the compiled ESM-like code in this context.
	// Compiled Svelte server output uses imports — we inline them from loaded modules.
	// Note: svelte/server is imported at the top of the function call chain
	// via the dynamic import below — we don't need explicit imports here.

	// The compiled code exports a default component; we need to eval it.
	// Use a data: URI import for inline module evaluation (Node 20+)
	const code = js.code
		.replace(/from 'svelte\/internal\/server'/g, "from 'svelte/internal/server'")
		.replace(/from 'svelte\/server'/g, "from 'svelte/server'");

	// Write to a temp file and import it to avoid eval security issues
	const tmpPath = path.join(ROOT, 'node_modules/.cache/test-enhanced-image.mjs');
	const cacheDir = path.dirname(tmpPath);
	if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
	fs.writeFileSync(tmpPath, code);

	// Force re-import with cache-busting
	const mod = await import(`${tmpPath}?t=${Date.now()}`);
	const Component = mod.default;

	const result = render(Component, { props });
	return result.body;
}

// ---------------------------------------------------------------------------
// Tests 1-4: Rendering behaviour
// ---------------------------------------------------------------------------

describe('EnhancedImage – rendering (PRF-01 §B)', () => {
	it('Test 1: renders with required props and lazy default', async () => {
		const html = await renderEnhancedImage({
			src: '/test.png',
			alt: 'x',
			width: 100,
			height: 50
		});
		expect(html).toMatch(/width="100"/);
		expect(html).toMatch(/height="50"/);
		expect(html).toMatch(/alt="x"/);
		expect(html).toMatch(/loading="lazy"/);
	});

	it('Test 2: loading="eager" overrides default', async () => {
		const html = await renderEnhancedImage({
			src: '/test.png',
			alt: 'hero',
			width: 1200,
			height: 800,
			loading: 'eager'
		});
		expect(html).toMatch(/loading="eager"/);
		expect(html).not.toMatch(/loading="lazy"/);
	});

	it('Test 3: fetchpriority="high" is emitted when set', async () => {
		const html = await renderEnhancedImage({
			src: '/test.png',
			alt: 'hero',
			width: 1200,
			height: 800,
			loading: 'eager',
			fetchpriority: 'high'
		});
		expect(html).toMatch(/fetchpriority="high"/);
	});

	it('Test 4: fetchpriority is NOT emitted when omitted', async () => {
		const html = await renderEnhancedImage({
			src: '/test.png',
			alt: 'below-fold',
			width: 48,
			height: 48
		});
		expect(html).not.toMatch(/fetchpriority/);
	});
});

// ---------------------------------------------------------------------------
// Tests 5-7: Required-prop TypeScript discipline
//
// We use tsc --noEmit on fixture .ts files (plan's explicit fallback).
// Each fixture file has a Props type matching EnhancedImage's Props and
// attempts to construct a value with a missing required prop.
// ---------------------------------------------------------------------------

// Use typescript/bin/tsc directly via node to avoid .cmd wrapper issues on Windows
// (paths containing & break cmd /c even when quoted).
const TSC = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
const FIXTURES_DIR = path.join(ROOT, 'tests', 'fixtures');

function runTscOnFixture(fixturePath: string): { exitCode: number; output: string } {
	try {
		// --ignoreconfig is required in TypeScript 6 when specifying files on the command line
		// (ts5112 error otherwise). --strict enables strictNullChecks so required props are enforced.
		execSync(`node "${TSC}" --ignoreconfig --noEmit --strict "${fixturePath}"`, {
			cwd: ROOT,
			stdio: 'pipe'
		});
		return { exitCode: 0, output: '' };
	} catch (err: unknown) {
		const e = err as { status?: number; stdout?: Buffer; stderr?: Buffer };
		const output = (e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? '');
		return { exitCode: e.status ?? 1, output };
	}
}

describe('EnhancedImage – required-prop TypeScript discipline', () => {
	it('Test 5: missing alt causes TypeScript compile error', () => {
		const fixturePath = path.join(FIXTURES_DIR, 'image-missing-alt.ts');
		const { exitCode, output } = runTscOnFixture(fixturePath);
		// tsc exits with code 2 on type errors; exit code 1 also acceptable
		expect(exitCode).not.toBe(0);
		// TS2741: Property 'alt' is missing in type ... but required in type ...
		expect(output).toMatch(/alt/i);
		expect(output).toMatch(/missing|required/i);
	});

	it('Test 6: missing width causes TypeScript compile error', () => {
		const fixturePath = path.join(FIXTURES_DIR, 'image-missing-width.ts');
		const { exitCode, output } = runTscOnFixture(fixturePath);
		expect(exitCode).not.toBe(0);
		expect(output).toMatch(/width/i);
		expect(output).toMatch(/missing|required/i);
	});

	it('Test 7: missing height causes TypeScript compile error', () => {
		const fixturePath = path.join(FIXTURES_DIR, 'image-missing-height.ts');
		const { exitCode, output } = runTscOnFixture(fixturePath);
		expect(exitCode).not.toBe(0);
		expect(output).toMatch(/height/i);
		expect(output).toMatch(/missing|required/i);
	});
});
