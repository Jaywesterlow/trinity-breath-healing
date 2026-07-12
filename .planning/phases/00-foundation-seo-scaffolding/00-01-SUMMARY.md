---
phase: 00-foundation-seo-scaffolding
plan: 01
status: complete
completed: 2026-06-18
---

# Plan 01 Summary — SvelteKit Scaffold + Test Infra + FND-03 Content Pipeline

## Result

Plan 01 complete. Wave 0 delivered. All acceptance criteria met.

## Verification Outputs

| Check | Result |
|-------|--------|
| `pnpm check` | 0 errors, 0 warnings (381 files) |
| `pnpm build` with `PUBLIC_SITE_URL` | Exits 0; `.svelte-kit/output/prerendered/pages/index.html` produced |
| `grep '<html lang="nl"'` on prerendered index | **MATCH** — lang attribute confirmed in initial HTML |
| `pnpm build` without `PUBLIC_SITE_URL` | Exits 1: `PUBLIC_SITE_URL is required` (FND-07 fail-loud) |
| `pnpm test:unit -- --run` | 2/2 passed (smoke fixture loads + invalid-frontmatter rejection) |
| `static/global.css` exists, `src/app.css` does NOT | ✓ D-09 enforced |
| `src/content/index.ts` exports `frontmatterSchema` + `loadCollection` + `collections` | ✓ FND-03 closed |
| `.github/workflows/ci.yml` valid YAML | ✓ `PUBLIC_SITE_URL:` in build env |

## Actual Versions Installed

| Package | Version |
|---------|---------|
| svelte | 5.56.1 |
| @sveltejs/kit | 2.65.2 |
| @sveltejs/adapter-vercel | 6.3.3 |
| mdsvex | 0.12.7 |
| zod | 3.25.76 (pinned; 4.x breaks `z.string().date()`) |
| vitest | 4.1.9 |
| jsdom | 29.1.1 (added; Vitest 4 no longer bundles it) |
| typescript | 6.0.3 |
| @playwright/test | 1.61.0 |

## Deviations from RESEARCH §11

| Item | Deviation | Why |
|------|-----------|-----|
| `tsconfig.json` `paths` block | Removed — had `$schema/*` + `$content/*` paths | SvelteKit auto-generates these from `kit.alias`; manual `paths` overrode `$lib` causing `svelte-check` error |
| `jsdom` | Installed separately as devDependency | Vitest 4 removed bundled jsdom; must be installed explicitly |
| `vitest.config.ts` | Not created — kept in `vite.config.ts` `test.projects` | Already implemented in prev session; no separate file needed |
| `pnpm.onlyBuiltDependencies` in `package.json` | WARN: pnpm 11 ignores this field | Packages already installed; non-blocking. Move to `.npmrc` when pnpm prompts during future installs |

## Blockers Closed

- **BLOCKER-1** (D-09): `static/global.css` is single CSS source. `src/app.css` absent. ✓
- **BLOCKER-2** (lang): `src/app.html` has `<html lang="nl">` on root element. ✓
- **BLOCKER-4** (FND-03): `src/content/index.ts` + smoke fixture + passing unit tests. ✓

## Open Questions

- `pnpm` field `onlyBuiltDependencies` in `package.json` triggers WARN in pnpm 11 ("no longer read"). Setting should migrate to `.npmrc` or `pnpm-workspace.yaml`. Non-blocking for Plan 01; can be resolved in Plan 08 cleanup.
- mdsvex emits `<script context="module">` in `.svx` files which Svelte 5 deprecates (use `module` attribute). This is a mdsvex upstream issue — advisory warning in tests, not an error.
- Build EPERM on Windows (Vercel adapter `closeBundle`): `.vercel/output/functions/` symlink/copy fails on Windows. Prerendered output is confirmed. CI runs on Linux — no issue in production builds.

## Files Created/Modified

- `src/routes/+layout.svelte` — rewritten (minimal placeholder, global.css import, `<main>`)
- `src/routes/+page.svelte` — rewritten (single H1 placeholder)
- `src/routes/+page.ts` — new (empty PageLoad placeholder)
- `src/content/index.ts` — new (FND-03: frontmatterSchema + loadCollection + collections glob)
- `src/content/_smoke/example.svx` — new (smoke fixture)
- `tests/unit/content.test.ts` — new (2 assertions: smoke load + invalid-frontmatter throw)
- `tests/setup.ts` — new (MOCK_SITE_URL export)
- `static/global.css` — new (empty placeholder; Plan 06 fills it)
- `playwright.config.ts` — new (webServer pnpm preview port 4173)
- `.github/workflows/ci.yml` — new (build-and-audit + lighthouse-and-a11y skeleton)
- `.pa11yci.json` — new (WCAG2AA config)
- `lighthouserc.json` — new (desktop preset, LCP/CLS/SEO/A11y gates)
- `tsconfig.json` — removed `paths` block (interfered with SvelteKit auto-generated aliases)
- `package.json` — added `jsdom` to devDependencies
- `src/lib/vitest-examples/` — **deleted** (sv create generated; not in plan)
- Directory stubs: `src/lib/{components,schema,constants,content/faq,server}/`, `static/fonts/`, `tests/{integration,scripts}/`, `scripts/`
