/**
 * visual-regression.spec.ts — committed screenshot baselines guarding against silent
 * visual regressions.
 *
 * Why this exists: Slice 1 shipped a bug where two CSS design tokens
 * (--color-border / --color-muted) silently resolved to "" via a circular var() chain.
 * Every unit test, svelte-check, and the build stayed green — four CTA buttons rendered
 * invisible. It was caught only by screenshot-diffing against the pre-migration app, a
 * comparison that will not always be available. This spec is this repo's OWN committed
 * baseline, so future changes self-detect visual drift without needing an external
 * reference app. (See tests/integration/no-dead-css-vars.spec.ts for the companion
 * cascade-walking guard against the root cause itself.)
 *
 * Routes: / and /contact. Viewports: desktop 1440x900, mobile 390x844.
 * Full-page screenshots via toHaveScreenshot() — baselines are committed PNG files
 * under visual-regression.spec.ts-snapshots/; `--update-snapshots` regenerates them
 * after an intentional visual change (see package.json's test:visual script).
 *
 * Determinism — every known nondeterminism source in this app is neutralized below,
 * not hidden behind a loose diff threshold:
 *
 * 1. Hero draw-on animation (src/lib/components/global/Hero.svelte, .hero__draw path):
 *    a ~2.9s staggered stroke-dashoffset animation. `page.emulateMedia({ reducedMotion:
 *    'reduce' })` (called in settle() below — see item 5 for why this and not the
 *    context option) makes the browser match `prefers-reduced-motion: reduce`, which
 *    triggers Hero.svelte's own media-query rule setting `stroke-dashoffset: 0` and
 *    `animation: none` — the fully-drawn final state, with no timing dependency.
 *    Confirmed by reading the component's <style> block, not assumed.
 *
 * 2. AboutStat count-up (src/lib/components/ui/AboutStat.svelte): an rAF-driven number
 *    count-up whose onMount opens with
 *    `if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;` — reduced
 *    motion disables it entirely, leaving the SSR-rendered final value ("65+" etc.) at
 *    rest, never counting from 0.
 *
 * 3. Werkwijze mobile scroll-jack (src/lib/components/global/Werkwijze.svelte): its
 *    scroll lock is gated on `mobileMq.matches && !motionMq.matches` in onMount — reduced
 *    motion disables it outright (phase stays 'disabled'), so the full-page screenshot
 *    (which scrolls the real page to stitch a tall capture) can never trip the lock.
 *
 * 4. Behandelingen treatments carousel (src/lib/components/global/Behandelingen.svelte):
 *    Embla + a hand-rolled autoscroll ticker driven by engine.animation's own rAF loop
 *    and a composed scrollBody — a genuinely JS-driven transform, NOT a CSS animation,
 *    so Playwright's `animations: 'disabled'` (which only finalizes CSS
 *    animations/transitions) does not stop it. It also has no
 *    prefers-reduced-motion gate anywhere in the file (confirmed: no matchMedia call
 *    exists in Behandelingen.svelte). Stopping it cleanly from outside would mean
 *    reaching into a component-local, non-exported EmblaCarouselType instance with no
 *    exposed hook. Per the task brief's own offered alternative, this region is masked
 *    instead: `.treatments__carousel-wrap` covers both the moving card track AND the
 *    dots' active-ring animation (whose animation-duration is itself live-measured from
 *    the ticker's real scroll cadence, so it is equally non-deterministic). This trades
 *    away pixel coverage for that one region in exchange for a test that can never flake
 *    on it — the CTA-background bug class this suite exists to catch is fully covered
 *    everywhere else on both routes (hero CTA, service cards, nav, footer, contact stub).
 *
 * 5. IMPORTANT: `test.use({ reducedMotion: 'reduce' })` does NOT reliably apply in this
 *    repo's Playwright setup — confirmed empirically (a throwaway spec asserting
 *    `matchMedia('(prefers-reduced-motion: reduce)').matches` via the context option
 *    came back `false`). `page.emulateMedia({ reducedMotion: 'reduce' })` does work
 *    (confirmed `true`, and it's the pattern tests/integration/werkwijze-scrolljack.spec.ts
 *    already relies on) — so it is called explicitly in settle() below, before goto,
 *    rather than trusted to the context option. Without this fix, items 1-3 above are
 *    NOT neutralized and AboutStat in particular renders whatever count-up value a
 *    ~600ms delay + rAF race happens to land on — caught here because the very first
 *    seeded baseline showed "0+" instead of the real "8+"/"65+" stat values.
 *
 * 6. NavLogo (src/lib/components/global/NavLogo.svelte, rendered in Nav + Footer on every
 *    route): loads Cinzel/Montserrat from Google Fonts at runtime with
 *    `display=swap` — a live network dependency with no guarantee in a sandboxed/offline
 *    test run, and even when reachable its swap timing races the screenshot.
 *    fonts.googleapis.com and fonts.gstatic.com requests are aborted via page.route()
 *    below, forcing the same fallback-font rendering every run regardless of network.
 *    (The primary body/heading fonts — DM Sans, Cormorant Garamond — are self-hosted
 *    woff2 under /fonts/, no network dependency; this spec still awaits
 *    `document.fonts.ready` before capturing so a slow local decode can't race it either.)
 *
 * 7. Lazy-loaded below-fold images: the deterministic scroll pass (bottom, settle, back
 *    to top) below exercises native lazy-loading before the screenshot, and a
 *    networkidle wait after it gives any newly-triggered image fetches time to resolve.
 *
 * 8. Stale build: Playwright's webServer runs `vite preview` against .svelte-kit/output —
 *    run `npm run build` immediately before every `npm run test:visual` invocation.
 *    (Enforced by the operator/CI step, not by this file — documented here so it isn't
 *    missed.)
 *
 * THRESHOLD — maxDiffPixels: 50 (an absolute pixel budget, not a ratio). History: this spec
 * originally used `maxDiffPixelRatio: 0.001` (0.1%), calibrated only against a large-element
 * sabotage (`--brand-border: transparent`, which blanks the tan CTA buttons). That ratio is
 * BLIND to small-text regressions: setting `--brand-muted: transparent` makes the "Werkwijze"/
 * "Over mij" eyebrow labels render literally invisible (`color: rgba(0,0,0,0)`), and because
 * that text occupies well under 0.1% of a 1440x3763 page's pixels, all 4 tests still PASSED.
 * A ratio scales with page size, which is exactly what created the blind spot — an absolute
 * pixel budget does not.
 *
 * Measurements behind the 50px number (all captured with `maxDiffPixels: 0`, i.e. zero
 * tolerance, to read the real diff count off each failure):
 *   - Noise floor: 5 consecutive clean-build runs (3 at the original ratio config, 2 more at
 *     maxDiffPixels: 0) produced 0 differing pixels every time — byte-for-byte identical
 *     screenshots. This machine's real noise floor is exactly zero.
 *   - Small-text regression (`--brand-muted: transparent`, rebuilt): home-desktop 4177px,
 *     contact-desktop 404px, home-mobile 577px, contact-mobile 0px (that route/viewport has
 *     no muted-colored text, so this token change is simply invisible there — not a threshold
 *     problem). Smallest real signal: 404px.
 *   - Large regression (`--brand-border: transparent`, rebuilt): home-desktop 35851px,
 *     contact-desktop 6581px, home-mobile 6419px, contact-mobile 1343px. Smallest real
 *     signal: 1343px.
 *   - Both sabotage measurements were reproduced twice each and were exactly reproducible
 *     (identical pixel counts run to run) — this app's Playwright/vite-preview pipeline on
 *     this machine is deterministic, not merely "usually stable."
 *
 * 50px sits comfortably above the measured noise floor (0) while remaining 8x below the
 * smallest real small-text signal (404px) and ~27x below the smallest real large-element
 * signal (1343px) — enough margin to never miss either bug class, tight enough that neither
 * bug class can hide behind it the way 0.1% of a tall page could.
 *
 * threshold: 0.2 (Playwright's per-pixel color-diff sensitivity default, kept rather than
 * loosened) — the noise-floor measurements above already hit exactly 0 diff pixels at this
 * setting, so antialiasing/GPU jitter is not being miscounted as diff and there was no reason
 * to move it.
 */
import { test, expect, type Page } from '@playwright/test';

const ROUTES = [
	{ path: '/', label: 'home' },
	{ path: '/contact', label: 'contact' }
] as const;

const VIEWPORTS = {
	desktop: { width: 1440, height: 900 },
	mobile: { width: 390, height: 844 }
} as const;

/** Aborts Google Fonts requests so NavLogo always renders its fallback font — see file header #5. */
async function blockGoogleFonts(page: Page): Promise<void> {
	await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
}

/**
 * Deterministic settle sequence, run before every capture: blocks the Google Fonts
 * network dependency, navigates, waits for the self-hosted webfonts to finish decoding,
 * then drives a full scroll to the bottom and back to the top so any lazy-loaded image
 * or scroll-position-dependent state is exercised and rested at a known position (top)
 * before the screenshot. This app has no IntersectionObserver-triggered fade-ins beyond
 * the two already neutralized by reducedMotion (Werkwijze, AboutStat) — the scroll pass
 * is kept anyway as a cheap, generic guard against any future scroll-triggered effect.
 */
async function settle(page: Page, route: string): Promise<void> {
	// Explicit emulateMedia, NOT the `reducedMotion` context option — see file header #5.
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await blockGoogleFonts(page);
	await page.goto(route, { waitUntil: 'load' });
	await page.waitForLoadState('networkidle');
	await page.evaluate(() => document.fonts.ready);

	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(150);
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.waitForTimeout(150);
}

test.use({ deviceScaleFactor: 1 });

/**
 * Platform guard — see file header #8 and the note in .github/workflows/ci.yml above
 * playwright-integration's `npm run test:integration` step.
 *
 * The committed baselines under visual-regression.spec.ts-snapshots/ are suffixed
 * `-win32.png` (generated on Windows; Playwright's toHaveScreenshot() auto-appends the
 * platform name to the snapshot filename). `npm run test:integration` is a bare
 * `playwright test` — the WHOLE tests/integration/ directory, including this spec — and
 * the `playwright-integration` CI job runs it on `ubuntu-latest`. On Linux, Playwright
 * looks for `*-linux.png` baselines, finds none, and with `CI=true` a missing snapshot
 * is a hard failure (not an auto-pass) — every PR would go red as soon as win32-only
 * baselines existed here.
 *
 * Skip the whole suite when not on win32, so the guard still runs in full (still
 * catches the Slice-1 class of silently-blanked-CTA regressions) on the only platform
 * it has real baselines for, instead of either failing CI everywhere or being deleted
 * from the PR-triggered run.
 *
 * To enable Linux coverage later: generate baselines on a Linux runner —
 * `npx playwright test tests/integration/visual-regression.spec.ts --update-snapshots`
 * — commit the resulting `*-linux.png` files alongside the existing `*-win32.png` ones,
 * then narrow or remove this guard accordingly.
 */
test.skip(
	process.platform !== 'win32',
	'Visual regression baselines are win32-only (see visual-regression.spec.ts-snapshots/*-win32.png). ' +
		'Run on Windows via `npm run test:visual`, or generate `*-linux.png` baselines on a Linux ' +
		'runner with --update-snapshots and commit them to enable this platform.'
);

for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
	test.describe(`${viewportName} (${viewport.width}x${viewport.height})`, () => {
		test.use({ viewport });

		for (const { path, label } of ROUTES) {
			test(`${label} matches baseline`, async ({ page }) => {
				await settle(page, path);

				// Only the home route renders the treatments carousel — see file header #4.
				const mask = label === 'home' ? [page.locator('.treatments__carousel-wrap')] : [];

				await expect(page).toHaveScreenshot(`${label}-${viewportName}.png`, {
					fullPage: true,
					animations: 'disabled',
					mask,
					maxDiffPixels: 50,
					threshold: 0.2
				});
			});
		}
	});
}
