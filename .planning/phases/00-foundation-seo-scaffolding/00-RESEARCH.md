# Phase 0: Foundation & SEO Scaffolding — Research

**Researched:** 2026-06-15
**Domain:** SvelteKit + Svelte 5 (runes) + Vercel + plain CSS — SSG-first marketing scaffold whose default route output ships content + meta + JSON-LD in initial HTML before any visible landing section is built.
**Confidence:** HIGH on architecture/patterns/SEO/AEO posture (derived from CONTEXT.md decisions + verified Dutch SEO/AEO playbook + cross-checked against PITFALLS.md/ARCHITECTURE.md). MEDIUM on exact package patch versions — web/registry verification was blocked this round; all versioned recommendations carry `[VERIFY at install]` flags and the planner MUST gate every npm install behind a `checkpoint:human-verify` task per the Package Legitimacy Gate fallback. HIGH on tooling/pattern names themselves (training-data is recent, packages are mature and widely deployed).

> **Tooling caveat (read before planning):** WebSearch, WebFetch, npm registry queries, ctx7/Context7, and slopcheck were ALL blocked in this research session. Per the Package Legitimacy Gate fallback protocol, **every package this research recommends is tagged `[ASSUMED]`**. The planner MUST insert a `checkpoint:human-verify` task before any `npm install` step that:
> 1. Runs `npm view <pkg> version` to confirm existence + capture current version
> 2. Confirms the package GitHub repo matches what is recommended here
> 3. Optionally runs `slopcheck install <pkg-list>` if the user wants to install the tool first
>
> Architectural recommendations remain HIGH confidence (CONTEXT.md locks the stack; this research just codifies the pattern). Only the version numbers and the existence-on-registry of specific names are unverified.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hosting & deploy**
- **Hosting platform: Vercel** (NOT Cloudflare Pages). Decided 2026-06-15.
- **Adapter:** `@sveltejs/adapter-vercel` (replaces `@astrojs/cloudflare`).
- **Region:** `fra1` (Frankfurt) for Vercel Functions — EU data residency.
- **Production URL (interim):** `trinity-breath-healing.vercel.app` (no custom domain yet).
- **Preview URLs:** Vercel auto-generates `*-trinity-breath-healing-<branch>.vercel.app` per PR.
- **Custom domain:** `trinitybnh.nl` reserved/intended but NOT being registered or configured in Phase 0.
- **CI: GitHub Actions** for tests + Lighthouse CI + pa11y/axe + JSON-LD validation. Vercel handles deploy via GitHub integration; GHA does the gates BEFORE the merge.
- **Repository:** `trinity-breath-healing` on GitHub, **private**, owned by user. Default branch: `main`. Branch protection: require PR + passing CI before merge.
- **Staging vs production:** Vercel native pattern — every PR = preview URL, `main` = production. No separate `staging.<domain>` subdomain in v1.

**SEO / crawler config**
- **`robots.txt` policy:** explicit allow for search/RAG crawlers (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Claude-User`) + training crawlers (`Google-Extended`, `Applebot-Extended`) BEFORE the wildcard catchall. Sitemap reference at bottom.
- **`llms.txt` / `llms-full.txt`: NOT shipped.** No proven retrieval effect 2026.
- **Search Console verification:** user's Google account, HTML-file method, URL-prefix property (DNS-TXT deferred until custom domain).
- **Hreflang infrastructure ready, Dutch-only content.** Site emits `<link rel="alternate" hreflang="nl">` + `<link rel="alternate" hreflang="x-default">` from day one.

**Schema / JSON-LD architecture**
- **Schema strategy:** `Organization` + `ProfessionalService` + `Person` + per-service `Service` nodes in a single `@graph` per page.
- **NOT `LocalBusiness` with storefront** — practitioner is mobile + remote + part-time. `ProfessionalService` (a `LocalBusiness` subclass) with `areaServed` + `serviceType`.
- **`Person`** for practitioner with `jobTitle`, `worksFor`, `memberOf`.
- **`Service`** per modality: Mahatma Healing, Goldhealing, Raster Energie, Spinal Touch — each with `areaServed` and `provider` linked to Organization.
- **`WebSite`** with site search action (deferred but type-ready).
- **`BreadcrumbList`** on every non-root page.
- **`FAQPage`** — generated from the SAME source as the rendered FAQ section (single source of truth).
- **`@id` strategy:** stable `@id` per shared node (e.g., `https://<host>/#organization`) for cross-page dedup. Use `SITE_URL` env.
- **Service slugs (Dutch):** `mahatma-healing`, `goldhealing`, `raster-energie`, `spinal-touch`.

**Site structure (15 routes — 1 active + 14 stubs, all HTTP 200 from day one)**
- **Active in v1:** `/` (landing — Phase 1)
- **Stubbed in Phase 0:** `/werkwijze`, `/over-mij`, `/behandelingen`, `/contact`, `/diensten/mahatma-healing`, `/diensten/goldhealing`, `/diensten/raster-energie`, `/diensten/spinal-touch`, `/diensten`, `/blog`, `/artikelen`, `/faq`, `/privacyverklaring`, `/algemene-voorwaarden`
- **Dropped:** `/boeken` (booking inline in contact toggle), `/reviews` (no testimonials v1).

**Build approach**
- **Mobile-first markup + structure first, CSS layered to match Figma desktop after.**

**Design tokens**
- **Source of truth: deferred.** User provides exact tokens later.
- Phase 0 ships **placeholder design tokens** in `static/global.css` (CSS variables on `:root` for color, spacing, radius, type, motion) marked `/* TODO: replace with Figma values */`.
- Estimated palette starters: `--color-bg-sand: #F2EBDD`, `--color-fg-forest: #3A4530`, `--color-accent-gold: #D4A968`, `--color-card-warm: #E8DEC8`.

**Styling architecture rules (LOCKED 2026-06-15)**
- **`static/global.css` ONLY for:** CSS variables on `:root` (design tokens), CSS reset (minimal `*, *::before, *::after { box-sizing: border-box; }` + `body` defaults), typography baseline (heading/body font-family + base sizes), and truly global utility classes (`.visually-hidden` for a11y).
- **EVERY component file** owns its own styles in a `<style>` block at the bottom of the `.svelte` file. Svelte scopes them automatically.
- **NO** shared CSS files beyond `global.css`. NO `src/styles/`. NO `@import` chains. NO CSS-in-JS, NO PostCSS preprocessing beyond Vite defaults.
- Reused values → CSS variables in `global.css`. Reused PATTERNS → Svelte components (composition over CSS reuse).
- Mobile-first: components write base styles first, then `@media (min-width: …)` for desktop overrides.

**Stack confirmations**
- **Framework:** SvelteKit + Svelte 5 (runes: `$state`, `$derived`, `$effect`, `$props`) + TypeScript strict
- **Adapter:** `@sveltejs/adapter-vercel` (region `fra1`)
- **Rendering posture:** SSG by default via `export const prerender = true` in root `+layout.ts`; per-route opt-out for `/api/contact` `+server.ts` endpoint (Phase 3)
- **Routing:** filesystem-based, SvelteKit `src/routes/`
- **Styling:** PLAIN CSS ONLY (rules above)
- **Content/MDX:** `mdsvex` — `.svx` files in `src/content/` consumed via Vite glob imports; Zod for type-safe frontmatter
- **Schema-typed JSON-LD:** `schema-dts`
- **Head/meta:** `<svelte:head>` inside a reusable `<Head>` component + `<PageTitle>` for one-H1 discipline
- **Images:** `@sveltejs/enhanced-img` — AVIF/WebP at build, explicit width/height → CLS=0
- **Sitemap:** hand-rolled `src/routes/sitemap.xml/+server.ts`
- **robots.txt:** static file at `static/robots.txt`
- **Forms / serverless:** SvelteKit `+server.ts` POST endpoints (Vercel Functions automatically)
- **Fonts:** self-hosted woff2 in `static/fonts/`, `font-display: swap`, metric-matched fallback
- **Analytics:** Plausible Cloud EU (Phase 3, not Phase 0)
- **Transactional email:** Resend `eu-west-1` (Phase 3)
- **Booking:** Cal.com inline embed (Phase 3) — INSIDE landing contact toggle, NOT a separate page
- **Scaffolding:** consider invoking `svelte-project` skill (and `plain-css-system` for tokens) to bootstrap the project.

### Claude's Discretion

- Exact file layout under `src/lib/` for primitives, schema sources, constants
- Choice of HTML-parser library for post-build CI gates (Cheerio vs node-html-parser — research recommends below)
- Choice of one-H1-per-page enforcement: build-time vs runtime
- Choice of fallback strategy for fonts (Capsize vs Fontaine vs manual size-adjust)
- Whether stubs ship as 14 per-page files or one dynamic `[stub]/+page.svelte` with a config map
- UX of stubs: silent placeholder vs "Komt binnenkort" message
- Initial palette of self-hosted fonts (Figma frames suggest serif display + humanist sans; final font decision waits for design tokens)
- Lighthouse CI deployment-URL-detection mechanism (action vs script)
- Exact wording of the `<Head>` component's TypeScript `PageMeta` interface

### Deferred Ideas (OUT OF SCOPE)

- `llms.txt` / `llms-full.txt`
- Multi-language EN (`hreflang` infra ships ready)
- Headless CMS (Sanity EU — v2 trigger: >50 pages OR >2 editors)
- Aggregate review schema
- Newsletter signup
- Per-modality DEEP service pages (`/diensten/<slug>` ship as stubs)
- Blog + Artikelen + FAQ + Privacy + AV deep content (stubs only)
- Service worker / PWA
- Custom domain registration
- LocalBusiness schema with storefront
- Practitioner photo (Figma uses illustration)
- Tailwind / CSS-in-JS / SCSS / PostCSS preprocessing
- Shared CSS files beyond `static/global.css`

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FND-01 | SvelteKit + Svelte 5 runes + TS strict + `adapter-vercel` (`fra1`) + SSG via `prerender = true` in root `+layout.ts` | §1 Standard Stack — SvelteKit core; §3 Pattern 1 (Root layout SSG); §11 Code Examples (`+layout.ts`) |
| FND-02 | Plain CSS architecture: `static/global.css` for tokens/reset/typography/utilities + component `<style>` blocks | §1 Standard Stack — no CSS lib; §3 Pattern 2 (Token system); §11 Code Examples (`global.css`); discretion handed off to `plain-css-system` skill |
| FND-03 | `mdsvex` configured for `.svx` files in `src/content/`; Vite glob imports; Zod schemas for frontmatter | §1 Standard Stack — mdsvex + zod; §3 Pattern 6 (Single-source FAQ); §11 Code Examples (`svelte.config.js` mdsvex wiring + Zod frontmatter validator) |
| FND-04 | Design tokens placeholder set (CSS variables) marked `/* TODO */` | §3 Pattern 2; §11 Code Examples (`global.css`) |
| FND-05 | Mobile-first reset + responsive grid system | §3 Pattern 2; §3 Pattern 3 (Component-scoped mobile-first); §11 Code Examples (`global.css` reset + container utility) |
| FND-06 | Self-hosted woff2 + `font-display: swap` + metric-matched fallback (no CLS) | §1 Standard Stack — Fontaine; §3 Pattern 7 (Self-hosted fonts); §4 Pitfall 5 (FOUT/FOIT/CLS) |
| FND-07 | `SITE_URL` env strategy with no localhost default | §3 Pattern 8 (Env-driven canonical/JSON-LD `@id`); §11 Code Examples (`.env` + `$env/dynamic/public`) |
| FND-08 | Reserved 200-response stub pages for all 14 routes | §3 Pattern 9 (Stub strategy); §11 Code Examples (per-route stub) |
| FND-09 | Repository on GitHub, main-branch-protected, Vercel auto-deploys, preview URLs per PR | §3 Pattern 10 (Vercel-GitHub link); §6 Vercel-specific config; mostly external/UI ops |
| FND-10 | GHA workflow runs build + Lighthouse CI + pa11y + JSON-LD validation per PR; merge blocked on failure | §1 Standard Stack — @lhci/cli, pa11y-ci, structured-data-testing-tool; §3 Pattern 11 (GHA workflow + preview-URL wait); §11 Code Examples (workflow YAML) |
| SEO-01 | `+layout.svelte` + `<Head>` component enforce per-page unique `<title>` (50–60) + meta description (150–160) in initial HTML | §3 Pattern 4 (Head primitive); §11 Code Examples (`<Head>` + `PageMeta` interface) |
| SEO-02 | `<PageTitle>` enforces one `<H1>` per page; CI gate parses rendered HTML | §3 Pattern 4 (PageTitle primitive); §3 Pattern 12 (Post-build HTML audit); §11 Code Examples (`scripts/check-html.ts`) |
| SEO-03 | Semantic HTML5 landmarks on every page | §3 Pattern 1 (Root layout); §11 Code Examples (`+layout.svelte`) |
| SEO-04 | Canonical tag on every page | §3 Pattern 4; §11 Code Examples (`<Head>`) |
| SEO-05 | `hreflang="nl"` + `x-default` infrastructure ready | §3 Pattern 4; §11 Code Examples (`<Head>`) |
| SEO-06 | OG + Twitter Card on every page | §3 Pattern 4; §11 Code Examples (`<Head>`) |
| SEO-07 | XML sitemap generated by `src/routes/sitemap.xml/+server.ts` | §3 Pattern 5 (Sitemap endpoint); §11 Code Examples (`+server.ts`) |
| SEO-08 | `robots.txt` with explicit AI-crawler allows BEFORE wildcard | §3 Pattern 5; §11 Code Examples (`robots.txt`) |
| SEO-09 | Visible `dateModified` on landing | §3 Pattern 13 (Recency signal placement) — Phase 1 visible work; Phase 0 ships the placeholder + JSON-LD wiring |
| SEO-10 | Search Console URL-prefix verification via HTML-file method | §6 Vercel-specific config; §11 Code Examples (`static/google<hash>.html` placement) |
| SEO-11 | CI gate fails build on zero/multiple H1, missing/duplicate meta, invalid canonical | §3 Pattern 12 (Post-build HTML audit); §11 Code Examples (`scripts/check-html.ts`) |
| SCH-01 | `<JsonLd>` component emits single `<script type="application/ld+json">` per page via `<svelte:head>` using `schema-dts` types | §3 Pattern 5 (JsonLd primitive); §11 Code Examples (`<JsonLd>` component using `{@html}`) |
| SCH-02 | `Organization` + `ProfessionalService` shared schema source file | §3 Pattern 6 (Shared schema); §11 Code Examples (`src/lib/schema/shared.ts`) |
| SCH-03 | `Person` schema for practitioner | §3 Pattern 6; §11 Code Examples (`Person` in shared) |
| SCH-04 | Per-modality `Service` schemas with `areaServed` + `provider` linked to Org | §3 Pattern 6; §11 Code Examples (`Service` factory) |
| SCH-05 | `WebSite` schema with site search action (type-ready) | §3 Pattern 6 |
| SCH-06 | `BreadcrumbList` on all non-root pages | §3 Pattern 6; §11 Code Examples (`buildBreadcrumb`) |
| SCH-07 | `FAQPage` generated from same source as rendered FAQ | §3 Pattern 6 (Single source — FAQ array of `{question, answer}` feeds both); discretion handed off to Phase 1 LND-07 |
| SCH-08 | CI gate validates JSON-LD parse + `schema-dts` types + Rich Results | §3 Pattern 12 (Post-build JSON-LD validator); §11 Code Examples (`scripts/validate-json-ld.ts`) |
| PRF-01 | Hero illustration via `@sveltejs/enhanced-img` AVIF/WebP + explicit dimensions; SVG preferred for line art | §3 Pattern 14 (Image primitive); §11 Code Examples (`<enhanced:img>` usage); §1 Standard Stack — enhanced-img |
| PRF-08 | CI Lighthouse budget gate fails on LCP/INP/CLS breach | §1 Standard Stack — @lhci/cli; §11 Code Examples (`lighthouserc.json` + GHA step) |
| A11Y-05 | pa11y / axe CI gate fails build on WCAG 2.2 AA violations | §1 Standard Stack — pa11y-ci; §11 Code Examples (GHA step + `.pa11yci.json`) |

</phase_requirements>

## Summary

This phase ships the SvelteKit + Svelte 5 + plain CSS + Vercel scaffold whose default behavior — for any of 15 routes — is rendering `H1` + `<title>` + meta description + canonical + OG/Twitter + a `@graph` JSON-LD `<script>` into the **initial HTML**, before any landing section is built. The stack is locked in CONTEXT.md; this research codifies the patterns, file layouts, package list, and CI scripts that satisfy all 32 phase requirements without re-litigating choices.

The dominant architectural risk is not "did I pick the right library" — it's **silent invisibility** to AI crawlers if any of three things fails: (1) JS-injected H1/meta/JSON-LD instead of initial HTML, (2) `robots.txt` wildcard `Disallow` accidentally shadowing AI-crawler `Allow` rules, (3) a primitive that compiles but doesn't actually render its content during SvelteKit prerender. Phase 0 prevents all three by shipping enforcement gates (post-build HTML parser walks `.svelte-kit/output/prerendered/pages/**/*.html`; JSON-LD parser + `schema-dts` type-check; `curl -A "OAI-SearchBot"` smoke test) BEFORE any visible work.

The plain-CSS architecture is unusual in 2026 (most stacks default to Tailwind) but is the explicit user lock, so the recommendation is: lean into Svelte's auto-scoped `<style>` blocks as the discipline (one component = one style scope), keep `static/global.css` strictly to tokens/reset/typography/utilities, and use the `plain-css-system` project skill to seed the token file.

**Primary recommendation:** Bootstrap via `npx sv create trinity-breath-healing` (the modern SvelteKit creator) with TS-strict template, add `@sveltejs/adapter-vercel` + `mdsvex` + `@sveltejs/enhanced-img` + `schema-dts` + `zod` + `fontaine`, ship the 7 primitives (`<Head>`, `<PageTitle>`, `<JsonLd>`, `<Breadcrumbs>`, `<EnhancedImage>`, `<StubLayout>`, `<SchemaGraph>`), wire 3 CI scripts (`check-html.ts`, `validate-json-ld.ts`, `placeholder-grep.sh`) into GitHub Actions alongside Lighthouse CI + pa11y-ci, and ship 14 per-route stub `+page.svelte` files (NOT one dynamic `[stub]` route — see §3 Pattern 9 rationale).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Initial-HTML rendering of content + meta + JSON-LD | Build-time prerender (SvelteKit SSG) | — | AI crawlers don't execute JS; SSG default is the only architecture that guarantees initial-HTML content. (Pitfall #1 in `PITFALLS.md`.) |
| Per-page `<title>` + meta description + canonical + OG/Twitter | Build-time prerender via `<svelte:head>` in component | — | `<svelte:head>` is SvelteKit's idiomatic head primitive; prerender pulls it into the static HTML output. (Pitfall #6.) |
| JSON-LD `@graph` per page | Build-time prerender via `<svelte:head>` in `<JsonLd>` component | — | Same as above. `schema-dts` provides compile-time type safety; `{@html}` serializes the JSON. |
| `robots.txt` | CDN / Static asset (`static/robots.txt`) | — | Static file served verbatim by Vercel from `static/`. Order matters; AI-crawler `Allow` blocks before wildcard. (Pitfall #2.) |
| `sitemap.xml` | API / Backend (`+server.ts` SSR endpoint, but prerendered at build) | — | A SvelteKit `+server.ts` endpoint with `export const prerender = true` emits a static XML file at build time. Cleaner than a manual file because the route manifest is source-of-truth. |
| Image optimization (AVIF/WebP, responsive `srcset`) | Build-time (Vite plugin) | — | `@sveltejs/enhanced-img` transforms `<enhanced:img>` tags at build, never at runtime. |
| `H1` discipline + meta-length + canonical validity | CI / Build (post-build HTML parse) | — | The only sound enforcement is parsing the prerendered HTML output, because `<svelte:head>` props can be wrong without erroring at compile time. |
| JSON-LD type safety | Build-time (TypeScript via `schema-dts`) | CI (post-build parse + Rich-Results CLI) | Two gates: types catch typos at compile; runtime parse catches forgotten `@id` or broken `@graph` composition. |
| Lighthouse CI budget enforcement | CI / GitHub Actions | — | Runs against Vercel preview URL after deploy; GHA workflow waits for the deploy then triggers `@lhci/cli`. |
| pa11y / axe accessibility budget | CI / GitHub Actions | — | Runs against Vercel preview URL post-deploy. |
| 14 stub routes returning HTTP 200 with full SEO scaffolding | Build-time prerender (one `+page.svelte` per route) | — | Per-page files are easier to deepen in v2 than dynamic routes. Tier-correct: this is content, not API. |
| Self-hosted fonts + preload | Build-time (`static/fonts/` + preload `<link>` in root `+layout.svelte` `<svelte:head>`) | — | No font-CDN dependency. Preload primary weight only. (Pitfall #18.) |
| Search Console verification | Static file (`static/google<hash>.html` → served at `/google<hash>.html`) | — | Google URL-prefix property verifies via static HTML file. |
| `SITE_URL` propagation to canonical + JSON-LD `@id` | Runtime env via `$env/dynamic/public` | Build-time fallback (env at deploy) | Public env reads on Vercel allow per-environment URLs (prod vs preview) without rebuild. |

**Why this matters:** Every capability has exactly one primary tier. Misassignment is the #1 source of "compiles, deploys, looks fine, AI bots see nothing" failures.

## Standard Stack

> **All packages below are tagged `[ASSUMED]` because registry verification was blocked this round (no WebSearch, no WebFetch, no Bash → npm view, no ctx7, no slopcheck).** The planner MUST gate every `npm install <pkg>` step in the PLAN.md behind a `checkpoint:human-verify` task that runs `npm view <pkg> version` to confirm existence + capture the actual current version, then updates this table. Package names below are sourced from official SvelteKit / Vercel / SchemaApp docs and Svelte ecosystem knowledge through training cutoff (Jan 2026); ecosystem maturity makes hallucination unlikely, but verification is non-negotiable per the protocol.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `svelte` `[ASSUMED]` | `^5.x` `[VERIFY at install]` | Framework runtime + runes (`$state`, `$derived`, `$effect`, `$props`) | Svelte 5 is the runes-mode era; v4 syntax still works but runes are the path forward. CONTEXT.md locks Svelte 5. |
| `@sveltejs/kit` `[ASSUMED]` | `^2.x` `[VERIFY at install]` | App framework (routing, SSR/SSG, endpoints) | Native SSG via `prerender = true`; idiomatic Svelte 5 host. |
| `@sveltejs/vite-plugin-svelte` `[ASSUMED]` | `^5.x or compatible with Svelte 5` `[VERIFY at install]` | Svelte 5 compiler integration with Vite | Bundled by `npx sv create`; verify version matches Svelte 5 major. |
| `@sveltejs/adapter-vercel` `[ASSUMED]` | `^5.x` `[VERIFY at install]` | Vercel deployment adapter (Functions + edge regions) | CONTEXT.md locks Vercel + `fra1`; this adapter handles both prerendered static output AND Vercel Functions for the future `/api/contact` endpoint. |
| `typescript` `[ASSUMED]` | `^5.x` `[VERIFY at install]` | TypeScript strict mode | Per `svelte-project` skill. |
| `vite` `[ASSUMED]` | `^5.x or ^6.x` (whatever SvelteKit peer-requires) `[VERIFY at install]` | Build tool | Bundled with SvelteKit; do not pin independently. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `mdsvex` `[ASSUMED]` | `^0.12.x or later` `[VERIFY Svelte 5 compat at install]` | Svelte-native MDX preprocessor (`.svx` files) | FND-03: FAQ source, future blog/kennisbank content. **Verify Svelte 5 compatibility** — mdsvex was Svelte-4-first; check release notes for runes-mode support. If not yet compatible, fall back to per-Svelte-component-in-content pattern + JSON frontmatter (covered in §10 Pitfalls). |
| `zod` `[ASSUMED]` | `^3.x` `[VERIFY at install]` | Runtime + type-safe schemas for mdsvex frontmatter, form input | FND-03: validates FAQ/blog frontmatter at build; Phase 3 reuses for `/api/contact` POST validation. |
| `@sveltejs/enhanced-img` `[ASSUMED]` | `^0.4.x or later` `[VERIFY at install]` | Vite plugin: AVIF/WebP transform, explicit dimensions, responsive `srcset` | PRF-01: hero illustration + future images. Build-time only, no runtime cost. |
| `schema-dts` `[ASSUMED]` | `^1.x` `[VERIFY at install]` | TypeScript types for Schema.org | SCH-01..08: typed JSON-LD prevents typos becoming production bugs. Framework-agnostic. |
| `fontaine` `[ASSUMED]` | `^0.5.x or later` `[VERIFY at install]` | Computes `size-adjust`, `ascent-override`, `descent-override` for metric-matched font fallback | FND-06: kills font-swap CLS. Alternative: Capsize. Fontaine is the lighter-weight option; Capsize is more configurable. |
| `node-html-parser` `[ASSUMED]` | `^7.x` `[VERIFY at install]` | Fast HTML parser for post-build CI gates | SEO-11 / SEO-02: walks `.svelte-kit/output/prerendered/pages/**/*.html`, asserts `querySelectorAll('h1').length === 1`, meta length, canonical. **Preferred over Cheerio for this use case** because it's ~5× faster on static markup, has zero dependencies, and we don't need jQuery-style traversal. |
| `@lhci/cli` `[ASSUMED]` | `^0.14.x or later` `[VERIFY at install]` | Lighthouse CI runner | FND-10 / PRF-08: budget gate on LCP/INP/CLS + Lighthouse SEO/A11y scores against Vercel preview URL. |
| `pa11y-ci` `[ASSUMED]` | `^3.x` `[VERIFY at install]` | Headless WCAG 2.2 AA audit (uses pa11y + axe-core) | A11Y-05: budget gate. Runs against preview URL post-deploy. |
| `prettier` + `prettier-plugin-svelte` `[ASSUMED]` | latest `[VERIFY at install]` | Formatter | Per `svelte-project` skill scripts allowlist. |
| `eslint` + `@typescript-eslint/*` + `eslint-plugin-svelte` `[ASSUMED]` | latest `[VERIFY at install]` | Linter | Per `svelte-project` skill scripts allowlist. |

### Optional but Strongly Recommended

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `structured-data-testing-tool` `[ASSUMED]` | `^7.x` (CLI) `[VERIFY at install]` | JSON-LD validator beyond what `schema-dts` catches at compile | SCH-08: schema-dts catches type errors; this CLI catches `@id` mismatches, broken graph references, missing-required-field issues. Run in GHA post-build. |
| `amondnet/vercel-action` (GitHub Action) `[ASSUMED]` | use action ref `@v25` or later `[VERIFY at use]` | Detect Vercel preview deployment URL for Lighthouse CI step | FND-10: alternative is `actions/github-script` polling the Vercel deployments API. Vercel-action is the established community action; vendor-lock-free fallback is to wait on Vercel's GitHub deployment status. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `node-html-parser` | `cheerio` | Cheerio has jQuery-like API + larger ecosystem; node-html-parser is faster + lighter. We only need `querySelectorAll` + text extraction → node-html-parser wins. |
| `fontaine` | `Capsize` (`@capsizecss/core`) | Capsize is older + more configurable but heavier; Fontaine integrates directly with build pipelines and is simpler for our 2-font scenario. |
| `structured-data-testing-tool` (local CLI) | Google Rich Results Test API | Google's official tester is authoritative but rate-limited + asynchronous. The CLI tool runs locally against rendered HTML and is sufficient for CI. Reserve Rich Results Test for one-off manual checks. |
| `mdsvex` | Build-step MD-to-Svelte | mdsvex is the standard. If Svelte 5 compatibility is an issue at install time, fall back to authoring FAQ entries as plain TS arrays in `src/lib/content/faq.ts` (simpler, no MDX needed) — see §10 Pitfalls. |
| Per-route stub files (14 of them) | Single `[stub]/+page.svelte` + config map | Per-route files have minor file noise but cleaner v2 evolution: deepening one route doesn't require refactoring out of a shared map. Choose per-route for v1. |

**Installation order** (one `checkpoint:human-verify` task BEFORE each command):
```bash
# Step 0 — scaffold
# Run via the svelte-project skill, NOT npx invocations here. The skill handles npm create + ESLint + Prettier + TS strict + folder layout.

# Step 1 — Vercel adapter (the svelte-project skill intentionally does NOT add this)
npm install -D @sveltejs/adapter-vercel

# Step 2 — content
npm install -D mdsvex
npm install zod

# Step 3 — images + schema
npm install -D @sveltejs/enhanced-img
npm install -D schema-dts

# Step 4 — fonts
npm install -D fontaine

# Step 5 — CI gates
npm install -D node-html-parser @lhci/cli pa11y-ci structured-data-testing-tool
```

**Version verification (REQUIRED before install):** the planner must add a `checkpoint:human-verify` task that runs, for each package:
```bash
npm view <pkg> version          # confirm current latest
npm view <pkg> repository.url   # confirm GitHub source matches official repo
npm view <pkg> scripts.postinstall  # flag any unexpected postinstall hook
```
Document the verified version + publish date back into this table before proceeding.

## Package Legitimacy Audit

> **VERIFIED 2026-06-18** via `npm view` (identical registry data to `pnpm view`; pnpm not installed on dev machine — deviation noted). User approved all packages. Verification method: `npm view <pkg> version repository.url scripts.postinstall` for all packages; mdsvex peer deps checked; adapter-vercel type definitions extracted from tarball.

| Package | Verified Version | Source Repo | Postinstall | Verdict |
|---------|-----------------|-------------|-------------|---------|
| `svelte` | 5.56.3 | github.com/sveltejs/svelte | none | ✅ APPROVED |
| `@sveltejs/kit` | 2.66.0 | github.com/sveltejs/kit | none | ✅ APPROVED |
| `@sveltejs/vite-plugin-svelte` | 7.1.2 | github.com/sveltejs/vite-plugin-svelte | none | ✅ APPROVED |
| `@sveltejs/adapter-vercel` | 6.3.4 | github.com/sveltejs/kit (monorepo) | none | ✅ APPROVED — `regions: string[]` + `runtime: 'nodejs20.x'` confirmed in index.d.ts |
| `@sveltejs/enhanced-img` | 0.11.0 | github.com/sveltejs/kit (monorepo) | none | ✅ APPROVED |
| `mdsvex` | 0.12.7 | github.com/pngwn/MDsveX | none | ✅ APPROVED — Svelte 5 peer: `^5.0.0-next.120` covers 5.56.3 |
| `schema-dts` | 2.0.0 | github.com/google/schema-dts | none | ✅ APPROVED |
| `zod` | **3.25.76** (pinned `zod@3`) | github.com/colinhacks/zod | none | ✅ APPROVED — pinned to 3.x; latest is 4.4.3 but Zod 4 breaks `z.string().date()` used in frontmatterSchema |
| `fontaine` | 0.8.0 | github.com/unjs/fontaine | none | ✅ APPROVED |
| `node-html-parser` | 7.1.0 | github.com/taoqf/node-fast-html-parser | none | ✅ APPROVED |
| `@lhci/cli` | 0.15.1 | github.com/GoogleChrome/lighthouse-ci | none | ✅ APPROVED |
| `pa11y-ci` | 4.1.1 | github.com/pa11y/pa11y-ci | none | ✅ APPROVED |
| `structured-data-testing-tool` | 4.5.0 | github.com/glitchdigital/structured-data-testing-tool | none | ✅ APPROVED |
| `vitest` | 4.1.9 | github.com/vitest-dev/vitest | none | ✅ APPROVED — v4 config change audit ran; `environment: 'jsdom'` + basic `include` config unchanged |
| `@playwright/test` | 1.61.0 | github.com/microsoft/playwright | none | ✅ APPROVED — no postinstall; browsers need `npx playwright install chromium` (manual, not supply-chain risk) |
| `typescript` | 6.0.3 | github.com/microsoft/TypeScript | none | ✅ APPROVED — SvelteKit 2.66.0 peer: `^5.3.3 \|\| ^6.0.0` |
| `prettier` | 3.8.4 | github.com/prettier/prettier | none | ✅ APPROVED |
| `prettier-plugin-svelte` | 4.1.1 | github.com/sveltejs/prettier-plugin-svelte | none | ✅ APPROVED |
| `eslint` | 10.5.0 | github.com/eslint/eslint | none | ✅ APPROVED |
| `eslint-plugin-svelte` | 3.19.0 | github.com/sveltejs/eslint-plugin-svelte | none | ✅ APPROVED |
| `@typescript-eslint/parser` | 8.61.1 | github.com/typescript-eslint/typescript-eslint | none | ✅ APPROVED |
| `@typescript-eslint/eslint-plugin` | 8.61.1 | github.com/typescript-eslint/typescript-eslint | none | ✅ APPROVED |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged [SUS]:** none — all repos match official orgs; no postinstall hooks on any package.
**Version pin rationale:** `zod` pinned to `^3.25.76` (not `^4.x`) — breaking API change confirmed. All other packages use latest verified version.

## Architecture Patterns

### System Architecture Diagram

```
                                        TRINITY-BREATH-HEALING SCAFFOLD (Phase 0)

   Developer push to GitHub
   ───────────────────────────────────────────────────────────────────────────────────────────────
              │
              ▼
   ┌──────────────────────┐         ┌────────────────────────────────────────┐
   │   GitHub             │ ──────► │  GitHub Actions CI (per PR)            │
   │   trinity-breath-    │         │   1. install deps                      │
   │   healing (private)  │         │   2. npm run check (svelte-check + tsc)│
   │   main branch        │         │   3. npm run build                     │
   │   protected          │         │   4. post-build HTML audit             │
   └──────────┬───────────┘         │      (node-html-parser walks           │
              │                     │       .svelte-kit/output/prerendered/) │
              │ webhook             │   5. JSON-LD validate (parse +         │
              ▼                     │      schema-dts + struct-data-test-tool│
   ┌──────────────────────┐         │   6. placeholder grep                  │
   │   Vercel             │         │   7. wait for Vercel preview deploy    │
   │   - auto-deploy main │ ──────► │   8. Lighthouse CI vs preview URL      │
   │   - preview URLs/PR  │         │   9. pa11y-ci vs preview URL           │
   │   - fra1 region      │         └──────────┬─────────────────────────────┘
   │   - adapter-vercel   │                    │
   └──────────┬───────────┘                    │ pass/fail gates merge
              │                                ▼
              ▼                     ┌────────────────────────────────────────┐
   ┌──────────────────────────────┐ │  Branch protection blocks merge        │
   │ Build pipeline (per route)   │ │  if any gate fails                     │
   │                              │ └────────────────────────────────────────┘
   │ +layout.ts (prerender=true)  │
   │      │                       │
   │      ▼                       │              Crawlers (AI + search)
   │ +layout.svelte               │              ──────────────────────
   │   ┌─ <Head> primitive ◄──────┼──── fetch / curl
   │   │  (svelte:head meta)      │              │
   │   ├─ <JsonLd> primitive      │              ▼
   │   │  (svelte:head JSON-LD)   │   ┌────────────────────────────────┐
   │   ├─ <SiteHeader>            │   │ /robots.txt (static)           │
   │   ├─ <main slot/>            │   │   AI-allows BEFORE wildcard    │
   │   └─ <SiteFooter>            │   │   Sitemap: /sitemap.xml        │
   │      │                       │   ├────────────────────────────────┤
   │      ▼                       │   │ /sitemap.xml (prerendered)     │
   │ +page.svelte (route file)    │   │   one entry per route          │
   │   ┌─ <PageTitle> (h1)        │   ├────────────────────────────────┤
   │   ├─ <Breadcrumbs>           │   │ /<route> initial HTML          │
   │   ├─ page-specific schema    │   │   <title> 50-60               │
   │   └─ content                 │   │   <meta description> 150-160  │
   │                              │   │   <link rel="canonical">       │
   │                              │   │   <link rel="alternate" nl/x>  │
   │                              │   │   <meta og:..> + <meta twitter>│
   │                              │   │   <h1> exactly one             │
   │                              │   │   <script application/ld+json> │
   │                              │   │     @graph: [Org, ProfService, │
   │                              │   │      Person, Service*, WebSite,│
   │                              │   │      Breadcrumb, FAQPage*]     │
   │                              │   └────────────────────────────────┘
   └──────────────────────────────┘
              │
              ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │  Vercel CDN serves static HTML from edge (fra1)                      │
   │  Future Phase 3: /api/contact +server.ts → Vercel Function (fra1)    │
   └──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| File | Responsibility |
|------|----------------|
| `svelte.config.js` | Wires `@sveltejs/adapter-vercel` with `regions: ['fra1']`; registers `mdsvex` with `.svx` extension |
| `vite.config.ts` | Registers `@sveltejs/enhanced-img` Vite plugin + `@sveltejs/vite-plugin-svelte`; NO Tailwind, NO PostCSS preset |
| `tsconfig.json` | `strict: true` + path aliases (`$lib`, `$schema`) |
| `src/app.html` | Minimal shell; SvelteKit injects head + body content |
| `src/app.d.ts` | Type declarations for `App.Locals`, `App.PageData`, `App.Platform` |
| `src/routes/+layout.ts` | `export const prerender = true;` — SSG-applies to all child routes |
| `src/routes/+layout.svelte` | Mounts `<Head>` + `<JsonLd>` primitives + global font preload + imports `static/global.css` via `<svelte:head>`-injected `<link rel="stylesheet">` |
| `src/routes/+page.svelte` | Landing route — Phase 0 ships placeholder hero with full SEO scaffolding; Phase 1 deepens |
| `src/routes/<stub>/+page.svelte` × 14 | Per-route stub. Imports shared `<StubLayout>` component, passes per-route `PageMeta` + per-route `schema` |
| `src/routes/robots.txt/+server.ts` OR `static/robots.txt` | robots.txt. **Recommend static file** (CONTEXT.md says so; less moving parts) |
| `src/routes/sitemap.xml/+server.ts` | Hand-rolled sitemap; iterates the 15 routes, emits XML with `lastmod` |
| `static/global.css` | CSS variables on `:root` (tokens, placeholder), reset, typography baseline, `.visually-hidden` |
| `static/fonts/<family>/*.woff2` | Self-hosted font files |
| `static/robots.txt` | AI-crawler allows + wildcard + sitemap ref |
| `static/google<hash>.html` | Search Console verification file |
| `src/lib/components/Head.svelte` | Reusable head emitter; takes typed `PageMeta` prop |
| `src/lib/components/PageTitle.svelte` | Wraps content in `<h1>` — enforces one-H1-per-page by convention + CI gate |
| `src/lib/components/JsonLd.svelte` | Emits `<script type="application/ld+json">` via `<svelte:head>` + `{@html}` |
| `src/lib/components/Breadcrumbs.svelte` | Renders breadcrumb trail + emits BreadcrumbList fragment (also wires into `<JsonLd>`) |
| `src/lib/components/StubLayout.svelte` | "Komt binnenkort" message + link back to landing + per-route meta + schema |
| `src/lib/components/EnhancedImage.svelte` | Thin wrapper around `<enhanced:img>` enforcing required `alt`, `width`, `height` props |
| `src/lib/schema/shared.ts` | `Organization`, `ProfessionalService`, `Person`, `WebSite` nodes — single source of truth |
| `src/lib/schema/services.ts` | Per-modality `Service` nodes (Mahatma, Goldhealing, Raster Energie, Spinal Touch) |
| `src/lib/schema/buildGraph.ts` | Composes shared + per-page nodes into one `@graph`; dedup by `@id` |
| `src/lib/constants/brand.ts` | NAP source of truth (already has placeholder content per UNKNOWNS.md) |
| `src/lib/constants/routes.ts` | Single array of 15 routes with metadata (slug, title, description, schema kind) — feeds sitemap + nav + breadcrumbs |
| `src/lib/seo/defaults.ts` | Default `PageMeta` (site title suffix, OG image, locale `nl_NL`) |
| `scripts/check-html.ts` | Post-build HTML audit script (one-H1, meta length, canonical) |
| `scripts/validate-json-ld.ts` | Post-build JSON-LD validator |
| `scripts/grep-placeholders.sh` | Pre-launch placeholder grep (FND-10 plumbing; non-blocking until Phase 4) |
| `.github/workflows/ci.yml` | Build + check-html + validate-json-ld + Lighthouse CI + pa11y |
| `lighthouserc.json` | Lighthouse CI budgets |
| `.pa11yci.json` | pa11y-ci config |

### Recommended Project Structure

```
trinity-breath-healing/
├── .github/
│   └── workflows/
│       └── ci.yml                              # build + audits + LH + pa11y
├── .planning/                                  # already exists
├── scripts/
│   ├── check-html.ts                           # post-build H1/meta/canonical audit
│   ├── validate-json-ld.ts                     # JSON-LD parse + schema validation
│   └── grep-placeholders.sh                    # pre-launch placeholder grep
├── src/
│   ├── app.html                                # SvelteKit shell
│   ├── app.d.ts                                # SvelteKit type augmentation
│   ├── routes/
│   │   ├── +layout.ts                          # prerender = true (SSG)
│   │   ├── +layout.svelte                      # mounts Head + JsonLd + font preload
│   │   ├── +page.svelte                        # landing (Phase 0: placeholder content + full meta/schema)
│   │   ├── sitemap.xml/+server.ts              # hand-rolled sitemap endpoint
│   │   ├── werkwijze/+page.svelte              # stub
│   │   ├── over-mij/+page.svelte               # stub
│   │   ├── behandelingen/+page.svelte          # stub
│   │   ├── contact/+page.svelte                # stub (Phase 2 deepens)
│   │   ├── diensten/+page.svelte               # stub
│   │   ├── diensten/mahatma-healing/+page.svelte    # stub
│   │   ├── diensten/goldhealing/+page.svelte        # stub
│   │   ├── diensten/raster-energie/+page.svelte     # stub
│   │   ├── diensten/spinal-touch/+page.svelte       # stub
│   │   ├── blog/+page.svelte                   # stub
│   │   ├── artikelen/+page.svelte              # stub
│   │   ├── faq/+page.svelte                    # stub
│   │   ├── privacyverklaring/+page.svelte      # stub (Phase 2 deepens)
│   │   └── algemene-voorwaarden/+page.svelte   # stub (Phase 2 deepens)
│   ├── lib/
│   │   ├── index.ts                            # re-exports (per svelte-project skill)
│   │   ├── components/
│   │   │   ├── Head.svelte
│   │   │   ├── PageTitle.svelte
│   │   │   ├── JsonLd.svelte
│   │   │   ├── Breadcrumbs.svelte
│   │   │   ├── StubLayout.svelte
│   │   │   ├── EnhancedImage.svelte
│   │   │   ├── SiteHeader.svelte               # placeholder Phase 0; Phase 1 LND-02 deepens
│   │   │   └── SiteFooter.svelte               # placeholder Phase 0; Phase 1 LND-08 deepens
│   │   ├── schema/
│   │   │   ├── shared.ts                       # Org + ProfService + Person + WebSite
│   │   │   ├── services.ts                     # per-modality Service factories
│   │   │   ├── faq.ts                          # FAQPage builder from shared FAQ data
│   │   │   ├── breadcrumb.ts                   # BreadcrumbList builder
│   │   │   └── buildGraph.ts                   # composes graph + dedups by @id
│   │   ├── content/
│   │   │   └── faq/                            # MDX FAQ entries (Phase 1 LND-07 fills)
│   │   ├── constants/
│   │   │   ├── brand.ts                        # NAP + brand identity (from UNKNOWNS.md template)
│   │   │   └── routes.ts                       # 15-route manifest (slug, title, description, schema kind)
│   │   ├── seo/
│   │   │   ├── defaults.ts                     # site title suffix, OG image, nl_NL locale
│   │   │   └── types.ts                        # PageMeta interface
│   │   └── server/                             # empty .gitkeep; ready for /api/contact (Phase 3)
│   └── env.d.ts                                # SITE_URL etc. type augmentation
├── static/
│   ├── global.css                              # tokens, reset, typography, .visually-hidden
│   ├── robots.txt                              # static — AI allows + wildcard + sitemap ref
│   ├── favicon.png                             # placeholder (UNKNOWNS.md: real file pending)
│   ├── og-default.jpg                          # placeholder (UNKNOWNS.md)
│   ├── google<hash>.html                       # Search Console URL-prefix verification file
│   └── fonts/
│       ├── <serif>/                            # placeholder; final choice waits for design tokens
│       │   └── <weight>.woff2
│       └── <sans>/
│           └── <weight>.woff2
├── lighthouserc.json
├── .pa11yci.json
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### Pattern 1: Root layout sets SSG default

**What:** Add `export const prerender = true;` to `src/routes/+layout.ts`. Every child route inherits SSG unless it explicitly opts out (e.g., `export const prerender = false;` in `src/routes/api/contact/+server.ts` in Phase 3).
**When to use:** Default. Marketing site = static = SSG. Only opt out for form/booking endpoints.
**Trade-off vs alternative:** Per-route `prerender = true` is more explicit but easy to forget. Layout-level default → safer; the one (eventually) dynamic route opts out loudly.
**See §11 Code Examples — `+layout.ts`.**

### Pattern 2: Token system in `static/global.css`

**What:** CSS custom properties on `:root` (color/spacing/radius/type/motion) + minimal reset + typography baseline + `.visually-hidden` utility. NO component styles in this file.
**When to use:** Always. This is the only global stylesheet in the project.
**Loading approach:** `import '../static/global.css';` from `src/routes/+layout.ts` (or `+layout.svelte` `<script>`). This is the canonical Svelte+Vite pattern — Vite hoists the import into a `<link rel="stylesheet">` in the prerendered HTML head, no FOUC. The `<svelte:head><link></svelte:head>` alternative works but routes the stylesheet through SvelteKit's runtime head manager (more moving parts; no benefit here).
**See §11 Code Examples — `global.css` + layout import.**

### Pattern 3: Component-scoped mobile-first CSS

**What:** Every `.svelte` component ends with a `<style>` block. Svelte adds a hash class to all selectors → scope-isolated by default. Base styles are mobile; desktop overrides come behind `@media (min-width: <breakpoint>)`.
**`:global(...)` policy:** use only when targeting framework-injected DOM (e.g., `:global(html)` in root layout). Component authors should never need it.
**When to use:** Every component. No exceptions.

### Pattern 4: Head / PageTitle / JsonLd primitives

**Three primitives, one purpose:** make initial-HTML SEO output the default behavior, impossible to forget.

- `<Head meta={pageMeta}>` — writes `<title>` + meta description + canonical + hreflang + OG + Twitter via `<svelte:head>`. Takes a typed `PageMeta` prop.
- `<PageTitle>{title}</PageTitle>` — renders `<h1>`. By convention, pages don't write `<h1>` directly. CI gate parses prerendered HTML and asserts exactly one `<h1>` per page (defense in depth).
- `<JsonLd graph={builtGraph}>` — emits `<script type="application/ld+json">` via `<svelte:head>` + `{@html}`. Takes a composed `@graph`.

**Composition site:** root `+layout.svelte` mounts `<Head>` and `<JsonLd>` with `data.meta` + `data.graph` from `$page.data`; route `+page.svelte` files export `load()` returning `{ meta, graph }`.
**See §11 Code Examples — `<Head>`, `<PageTitle>`, `<JsonLd>`.**

### Pattern 5: `robots.txt` + sitemap.xml

- **`robots.txt`:** static file at `static/robots.txt`. Order: AI-crawler `Allow` blocks → wildcard `Allow: /` (with `Disallow: /api/` to keep future form endpoint out of crawl) → `Sitemap:` reference.
- **`sitemap.xml`:** `src/routes/sitemap.xml/+server.ts` endpoint with `export const prerender = true;` — emits valid XML at build, iterates `src/lib/constants/routes.ts`. Sets `Content-Type: application/xml`.
**Why hand-rolled over `sveltekit-sitemap`:** the route count is small (15) and tightly controlled. The community lib adds a dependency for a 30-line endpoint. CONTEXT.md also names hand-rolled explicitly.
**See §11 Code Examples — `robots.txt` + `sitemap.xml/+server.ts`.**

### Pattern 6: Single source of truth — FAQ feeds both rendered HTML and FAQPage JSON-LD

**What:** FAQ entries live as MDX (`src/lib/content/faq/*.svx`) with Zod-validated frontmatter `{ question: string, order: number, slug: string }`. The body is the answer. A single Vite glob import (`import.meta.glob('$lib/content/faq/*.svx', { eager: true })`) feeds:
1. The rendered `<details>`/`<dl>` accordion in `+page.svelte`
2. The `FAQPage` JSON-LD entries in `buildGraph()`

**Why it matters:** SCH-07 explicitly demands the two outputs come from the same source. If they drift, the user sees one set of Q&A and AI engines extract another → breach of trust + AEO fail.
**Phase 0 ships the wiring with 0 FAQ entries; Phase 1 LND-07 fills it.**
**See §11 Code Examples — `faq.ts` + Zod schema.**

### Pattern 7: Self-hosted fonts in SvelteKit

**Strategy:**
1. Download woff2 files; place in `static/fonts/<family>/<weight>.woff2`.
2. Declare `@font-face` in `static/global.css` with `font-display: swap` + `size-adjust`, `ascent-override`, `descent-override` computed by Fontaine (build-time).
3. Preload primary weight via `<link rel="preload" as="font" type="font/woff2" crossorigin>` in root `+layout.svelte` `<svelte:head>`.
4. Final font family decision waits for design tokens; Phase 0 ships with a placeholder pair documented in code.

**Recommended placeholder pair** (matches Figma's serif-display + humanist-sans feel; all SIL-OFL or similar open licenses — confirm at install):
- Display/serif: Cormorant Garamond or Bodoni Moda or EB Garamond
- Body sans: Inter or Source Sans 3 or Atkinson Hyperlegible (last has accessibility advantage)

### Pattern 8: `SITE_URL` env strategy

**Why no localhost default:** if `SITE_URL` defaults to `http://localhost:5173`, the prerendered HTML will leak `localhost` URLs into canonical + JSON-LD `@id` + OG URLs in production → Pitfall #15.

**Strategy:**
1. Required env var `SITE_URL` — no default. Vercel sets per environment (preview = preview URL, prod = `trinity-breath-healing.vercel.app` until custom domain).
2. Read via `$env/dynamic/public` (Vite-time public-prefixed env) for runtime use; for build-time hard-bake (sitemap), read at prerender time (it's still env-driven).
3. Local dev: `.env` (gitignored) sets `SITE_URL=http://localhost:5173` explicitly — devs must opt in, never silent.
4. CI fails the build if `SITE_URL` is unset (defensive check in a build step).
**See §11 Code Examples — `.env.example` + `seo/defaults.ts`.**

### Pattern 9: Per-route stub pages (not dynamic `[stub]`)

**Choice:** ship 14 files: `src/routes/werkwijze/+page.svelte`, `src/routes/over-mij/+page.svelte`, ..., each importing `<StubLayout>` and passing per-route props.

**Rationale:**
- Easier to deepen one route in v2: just replace its file. With dynamic `[stub]`, deepening requires lifting the route out + creating a real file + updating the config map.
- Cleaner git diff history when content actually lands.
- The "minor file noise" cost is 14 small files (~10 lines each) — trivial.
- File-system routing makes each stub URL grep-able.

**`<StubLayout>` props:** `{ title, description, slug, schemaKind, crumb }` — passed once per stub, populates `<Head>`, `<PageTitle>`, `<Breadcrumbs>`, `<JsonLd>`.

**UX:** human-visible "Komt binnenkort — terug naar [home]" message + a real link back to `/`. Crawlers still get full meta + schema + breadcrumb.

### Pattern 10: Vercel + GitHub auto-deploy + branch protection

**Setup (Phase 0 ops checklist, not code):**
1. Create GitHub repo `trinity-breath-healing` (private).
2. Branch protection on `main`: require PR + passing checks before merge.
3. Vercel project: connect to GitHub repo, set production branch = `main`, set preview branch = all others. Set env vars `SITE_URL` per environment.
4. `vercel.json` is NOT NEEDED for SvelteKit + adapter-vercel — the adapter handles framework detection, build command, output dir. Add only if a Vercel-specific override is needed (none in Phase 0).
5. Adapter config in `svelte.config.js`: `adapter({ runtime: 'nodejs20.x', regions: ['fra1'] })` — region pin applies to functions; static prerender ships globally via Vercel's edge.

### Pattern 11: GitHub Actions workflow with Vercel preview detection

**Flow:**
1. PR opens → GHA workflow `ci.yml` triggers.
2. Steps 1–3 run independently of Vercel: install, `check`, `build`, `check-html.ts`, `validate-json-ld.ts`, `grep-placeholders.sh` (non-blocking until Phase 4).
3. Steps 4–5 wait for Vercel to finish deploying the preview: use `amondnet/vercel-action` (recommended) or poll Vercel deployments API via `actions/github-script` (vendor-lock-free fallback).
4. Once preview URL is available → run `@lhci/cli` and `pa11y-ci` against it.
5. All steps must pass for the GHA workflow to be green; branch protection won't allow merge otherwise.

**See §11 Code Examples — full `ci.yml`.**

### Pattern 12: Post-build HTML + JSON-LD audit

**What runs:**
- `scripts/check-html.ts` walks `.svelte-kit/output/prerendered/pages/**/*.html` (this is the SvelteKit prerender output directory). For each file: parse with `node-html-parser`, assert `querySelectorAll('h1').length === 1`, `<title>` length 50–60, `<meta name="description">` length 150–160, `<link rel="canonical">` present and absolute, no duplicate canonicals.
- `scripts/validate-json-ld.ts` walks the same files. For each: extract every `<script type="application/ld+json">`, `JSON.parse()` each, run `structured-data-testing-tool` CLI against the page URL.

**Why post-build instead of compile-time:** `<svelte:head>` accepts any string. A wrong title or missing canonical is not a TypeScript error — only a parsed-HTML check catches it. Build-time runs once per PR in CI; cost is sub-second per page.

### Pattern 13: Visible `dateModified` placement

**What:** Landing page footer shows "Bijgewerkt op: <date>". Same date populates `dateModified` in the page-level JSON-LD entry (e.g., on `WebPage` or `Article` types when applicable; for landing, attach to the `Service` or `WebPage` entry).

**Source:** read from file modification time at build OR maintain in `src/lib/constants/dateModified.ts` (manual update). Auto-from-mtime is fragile (touch-on-build = false positive). Manual is honest.
**Phase 0 ships the wiring + placeholder; Phase 1 lands real value when landing content goes live.**

### Pattern 14: Image primitive — `<EnhancedImage>` wrapping `<enhanced:img>`

**What:** `src/lib/components/EnhancedImage.svelte` wraps `<enhanced:img>` with required props (`src`, `alt`, `width`, `height`, `loading?`, `fetchpriority?`).
**Why a wrapper:** enforces required props (alt, width, height = CLS guard). `enhanced-img` itself is forgiving; the wrapper is the discipline.

**Hero illustration recommendation (PRF-01):**
- If Figma can export the tree+river illustration as SVG (line art is vector-friendly): use raw `<svg>` inline → zero LCP cost, crawler-readable text (if any), infinite scaling.
- If SVG export not feasible: PNG → `<enhanced:img>` produces AVIF + WebP + responsive widths, with explicit dimensions.
- Either way: `<link rel="preload" as="image" fetchpriority="high" href="...">` in `+layout.svelte` `<svelte:head>` ONLY when route is `/` (page-scope this preload).

### Pattern 15: Placeholder grep gate (FND-10 plumbing)

**What:** `scripts/grep-placeholders.sh` runs `grep -rE "TODO|PLACEHOLDER" src/ static/`. In Phase 0 this is **non-blocking** (would always fail because design tokens + brand placeholders are intentional). Wire the script + GHA step now; flip from `continue-on-error: true` to false at Phase 4 (LGL-11).

### Anti-Patterns to Avoid

- **DON'T add `vercel.json`** unless you have a Vercel-specific override (none in Phase 0). The adapter handles routing + builds. Extra config = more places to drift.
- **DON'T configure `prerender = true` per-page.** Set at the root layout; opt out per-endpoint.
- **DON'T set the canonical or `@id` from a hardcoded URL string.** Always derive from `SITE_URL` env. Anything else leaks preview URLs into production.
- **DON'T use `<svelte:head>` to write client-only content** (e.g., conditional based on `$state`). It works on the client but the server's prerendered output is the only thing crawlers see. Always make `<svelte:head>` content derivable at prerender time.
- **DON'T add Tailwind, PostCSS plugins, or any CSS preprocessor.** Locked by CONTEXT.md.
- **DON'T author shared CSS files beyond `static/global.css`** (no `src/styles/`). Locked by CONTEXT.md.
- **DON'T use `loading="lazy"` on the hero image.** Pitfall #6 — blinds the LCP candidate. Lazy is for below-fold only.
- **DON'T inject meta or JSON-LD client-side.** Pitfall #6 — bots don't run JS, all of it must be in the initial HTML via `<svelte:head>`.
- **DON'T let `SITE_URL` default to localhost.** Pitfall #15.
- **DON'T put two `<script type="application/ld+json">` blocks on one page.** Compose into one `@graph`.
- **DON'T omit the `@id` on shared graph nodes.** Without `@id`, cross-page dedup breaks and AI engines see four different "Organizations" on four pages.
- **DON'T use mdsvex if the Svelte 5 + mdsvex compatibility is broken at install time.** Fall back to plain TS arrays for FAQ data (see §10 Pitfall on this).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema.org type safety | Hand-typed JSON-LD constants | `schema-dts` | Catches `Organization.name = 42` at compile time; framework-agnostic; Google-owned. |
| Image responsive variants + AVIF/WebP transform | Per-image Sharp calls or `<picture>` by hand | `@sveltejs/enhanced-img` | Build-time, integrated with Vite, automatic `srcset`, explicit dimensions. |
| HTML parsing for CI gates | Regex over HTML files (`grep '<h1'`) | `node-html-parser` | Regex on HTML is famously fragile; proper parser handles whitespace, attributes-in-any-order, self-closing tags. |
| Lighthouse runs in CI | Curl Chrome flags by hand | `@lhci/cli` | Officially maintained, structured budget files, GHA-friendly output. |
| Accessibility audit in CI | Hand-coded axe-core wiring | `pa11y-ci` | Same automation level for less code; uses axe-core under the hood. |
| Schema.org runtime validation beyond TS types | Hand-written validators | `structured-data-testing-tool` CLI | Built-in presets for Org/Service/FAQPage/etc.; catches what `schema-dts` types miss (e.g., recommended vs required fields, `@id` mismatches). |
| Markdown-with-Svelte-components in `.svx` files | Hand-built MDX preprocessor | `mdsvex` | Standard Svelte MDX preprocessor; supports Vite glob. **Verify Svelte 5 compat at install** (see §10 Pitfall). |
| Frontmatter type-safety | Hand-typed TS interface for each frontmatter | `zod` | Single schema → both runtime parse error + inferred TS type. |
| Self-hosted font fallback metric matching | Hand-tweaked `size-adjust`/`ascent-override` | `fontaine` (build-time) | Computes exact metrics from the woff2 file. Manual values are always slightly off → CLS regression. |
| Sitemap regeneration | Static `static/sitemap.xml` | `src/routes/sitemap.xml/+server.ts` (prerendered) | Auto-updates with route changes (Phase 2 deepens stubs without touching sitemap). |
| Robots.txt | Build-time generator | Static `static/robots.txt` | 20 lines, never changes. Static file is the right shape. |
| Detecting Vercel preview URL in GHA for Lighthouse | Custom polling script (fragile) | `amondnet/vercel-action` GitHub Action | Established community action. Fallback: GitHub deployments API via `actions/github-script`. |
| CSRF on form actions | Hand-written tokens | SvelteKit's built-in `actions` CSRF (Phase 3) | Framework provides it; verify enabled. |

**Key insight:** the "plain CSS" choice means we DO hand-roll our styles — but everywhere else, this stack is mature enough that hand-rolling is a regression vector.

## Runtime State Inventory

**Not applicable.** Phase 0 is greenfield scaffolding — no existing data, no live services to migrate, no OS-registered state, no installed-elsewhere packages, no stored secrets keyed to renamed things. Nothing to inventory.

(Listed explicitly per protocol: "If the answer for a category is 'nothing' — say so explicitly. Leaving it blank is not acceptable.")

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — greenfield project, no databases or datastores. | None |
| Live service config | None — no n8n/Datadog/Tailscale state. Vercel project does not yet exist; it WILL be created in Phase 0, but as a new resource, not a migration. | None |
| OS-registered state | None — no scheduled tasks, no pm2, no systemd. | None |
| Secrets/env vars | None — `SITE_URL` is created fresh; no inherited secrets. | None |
| Build artifacts | None — no existing build to invalidate. | None |

## Common Pitfalls

### Pitfall 1: mdsvex + Svelte 5 compatibility uncertainty

**What goes wrong:** mdsvex was built for Svelte 3/4 syntax. Svelte 5's runes mode may require a newer mdsvex release. If the current published mdsvex doesn't support Svelte 5, you can install it but it produces compile errors in `.svx` files using runes — and Phase 0 ships with FAQ content (in Phase 1) and other MDX-driven content (v2 blog).
**Why it happens:** mdsvex maintenance cadence is slower than Svelte's; transitive Svelte 5 support may lag.
**How to avoid:**
1. AT INSTALL: planner inserts checkpoint that runs `npm view mdsvex peerDependencies` and `npm view mdsvex versions --json | tail -5` — confirm latest version explicitly lists Svelte 5 as peer.
2. If NOT YET COMPATIBLE: fall back to authoring FAQ entries as plain TS arrays (`src/lib/content/faq.ts` exporting `{ question, answer, slug, order }[]`). Same single-source-of-truth pattern, just without MDX. Defer mdsvex to v2 when ecosystem catches up.
3. This fallback satisfies SCH-07 (single source) and FND-03 (the spirit, if not the literal `.svx` extension). Document the deviation in CONTEXT.md if it happens.
**Warning signs:** `svelte-check` errors mentioning runes in a `.svx` file; mdsvex GitHub issues mentioning Svelte 5.

### Pitfall 2: `<svelte:head>` content not appearing in prerendered HTML

**What goes wrong:** `<svelte:head>` writes to the document head — but only if it runs. If you put it inside a component that's conditional on `$state` (client-runtime state), the server prerender skips it, the bot sees empty meta, and you're back to the empty-HTML problem.
**Why it happens:** Devs reach for runes by default; runes' reactivity doesn't run during SSR for SSG output.
**How to avoid:** all `<svelte:head>` content must derive from `data` returned by `+page.ts` / `+layout.ts` `load()` (or from props/constants). Never gate it on `$state` or `$effect`.
**Warning signs:** View Source on a prerendered page shows partial `<head>`; only certain meta tags missing.

### Pitfall 3: `static/global.css` import order vs FOUC

**What goes wrong:** Imported globally from `+layout.svelte`'s `<script>`, Vite handles it; if imported from a deep component, Vite may bundle it later → flash of unstyled content on slow connections.
**How to avoid:** Import `static/global.css` from `src/routes/+layout.ts` (preferred — runs in load phase before render) OR top of `src/routes/+layout.svelte` `<script>`. Never anywhere else.
**Warning signs:** CLS spikes in Lighthouse trace correlate with stylesheet load events.

### Pitfall 4: Adapter region pin doesn't apply to prerendered output

**What goes wrong:** Confusing the region pin: `regions: ['fra1']` applies to Vercel Functions (the future `/api/contact` endpoint), NOT to static prerendered pages. Static HTML serves from Vercel's global CDN, not from one region. This is correct behavior; misunderstanding it leads to misconfigured caching or unnecessary "is it serving from Frankfurt?" debugging.
**How to avoid:** Document the region behavior in code comments where the adapter config lives. The function region is what matters for EU data residency (Phase 3).
**Warning signs:** Lighthouse from US shows fast TTFB for HTML (CDN) but slow for `/api/contact` (only `fra1` — correct, expected).

### Pitfall 5: Self-hosted font CLS without fallback metric match

**What goes wrong:** `font-display: swap` shows fallback text first, then swaps to woff2 when loaded. If fallback metrics differ from woff2 (line-height, x-height), the swap shifts layout → CLS spike. This is what makes the difference between Lighthouse CLS = 0.02 and CLS = 0.18.
**How to avoid:** Run Fontaine (build-time) or compute Capsize metrics; set `size-adjust`, `ascent-override`, `descent-override` on the `@font-face` declaration. Phase 0 deliverable.
**Warning signs:** Lighthouse "Reduce unused JS" warning citing font subset; CLS regression when font loads.

### Pitfall 6: One `<JsonLd>` per page becomes many `<script>` tags via composition

**What goes wrong:** Root layout emits a `<JsonLd>` with the shared Org graph. Route also emits its own `<JsonLd>` with page-specific Service. Now there are two `<script type="application/ld+json">` blocks per page — valid but messy, and Google's Rich Results Test sometimes only reads the first.
**How to avoid:** Compose into one `@graph` at the route level. The `load()` function in `+page.ts` calls `buildGraph({ shared, pageSpecific })` and returns it; only ONE `<JsonLd>` mount, in root `+layout.svelte`, reading from `$page.data.graph`.
**Warning signs:** View Source shows multiple `<script type="application/ld+json">`.

### Pitfall 7: Stub pages without per-page JSON-LD

**What goes wrong:** The 14 stubs share `<StubLayout>` but if `<StubLayout>` doesn't accept a per-route schema prop, every stub emits the same `BreadcrumbList` (or no breadcrumb at all). AI crawlers can't distinguish `/over-mij` from `/werkwijze`.
**How to avoid:** `<StubLayout>` accepts `{ title, description, slug, schemaKind, crumb }`. The page-level `+page.ts` `load()` builds the per-page graph (calling `buildBreadcrumb(crumb)` + appropriate `Service`-or-`WebPage` node). Stubs differ in their `load()` data, not their UI.
**Warning signs:** `curl https://preview/over-mij/ | grep '@type'` and `curl .../werkwijze/` return identical schema.

### Pitfall 8: SvelteKit prerender silently skipping routes

**What goes wrong:** `export const prerender = true` in root `+layout.ts` should apply to all routes — BUT SvelteKit's prerender crawler discovers routes by following `<a href>` from the entry point. If no link points to `/diensten/spinal-touch`, it's never prerendered → 404 in production despite the route file existing.
**How to avoid:** In `svelte.config.js`, set `kit.prerender.entries = ['*']` to prerender every reachable route. Or list explicit entries: `['/', '/werkwijze', '/over-mij', ...]`. The `'*'` setting tells SvelteKit "prerender every route I can statically discover," which is what we want for 15 known routes.
**Warning signs:** Build output shows only some routes in `.svelte-kit/output/prerendered/pages/`; production returns 404 for missing routes.

### Pitfall 9: Lighthouse CI in GHA running against the wrong URL

**What goes wrong:** GHA spins up its own runner, runs `npm run build`, then runs Lighthouse — but against `localhost:4173` (preview), not against the deployed Vercel preview URL. Network conditions and TLS are different from production. Worse: this hides actual Vercel CDN behavior (caching, edge routing) from the audit.
**How to avoid:** Use `amondnet/vercel-action` (or poll Vercel deployments API) to capture the preview URL after deploy completes; pass it to `lhci autorun --url=<preview-url>`. Documented in §11 Code Examples.
**Warning signs:** Lighthouse scores in CI differ from `npx lighthouse <preview-url>` run locally.

### Pitfall 10: Allowing both AI search AND training crawlers without explicit toggle

**What goes wrong:** This is a *decision*, not a mistake — but mis-implementing it is. CONTEXT.md decides to ALLOW `Google-Extended` + `Applebot-Extended` (training). If a future contributor copies a "block training crawlers" robots.txt snippet without reading CONTEXT.md, they silently kill the training-allow posture.
**How to avoid:** Inline comment in `static/robots.txt`: `# DECISION: training crawlers allowed per CONTEXT.md — wellness content has low IP risk + high citation upside. Change requires architectural discussion.`
**Warning signs:** Robots.txt PRs from contributors removing Google-Extended/Applebot-Extended without ADR discussion.

### Pitfall 11: Runes mode quirks for devs coming from Svelte 4

**What goes wrong:** Devs reach for `let count = 0` for reactive state — works in Svelte 4, silently non-reactive in Svelte 5 components compiled in runes mode. Or they use `export let` for props (Svelte 4 pattern) instead of `let { foo } = $props()` (Svelte 5 pattern). The component compiles; behavior is wrong.
**How to avoid:**
1. Set runes mode globally in `svelte.config.js`: `compilerOptions: { runes: true }`. With `runes: true`, the compiler errors on Svelte 4 reactive patterns inside components.
2. Code-review checklist: `let foo` for reactive needs to be `$state(foo)`; `export let foo` needs to be `$props()`; `$:` reactive blocks need to be `$derived(...)` or `$effect(() => ...)`.
**Warning signs:** UI doesn't update on state change in dev; `svelte-check` warnings about Svelte 4 patterns.

### Pitfall 12: Plain CSS without a system → inconsistency

**What goes wrong:** No Tailwind = no atomic tokens enforced. Devs reach for `padding: 16px` in one component, `padding: 1rem` in another, `padding: var(--space-4)` in a third. Within months, design drift accumulates without anyone noticing.
**How to avoid:**
1. Token discipline: `static/global.css` defines `--space-1` through `--space-12`. Code review rejects raw `px` / `rem` for spacing inside components — must use a token.
2. Optional lint: ESLint plugin to flag hardcoded color hex codes / px values in `<style>` blocks (light-touch; not Phase 0 priority).
3. Reused PATTERNS become Svelte components — composition over CSS reuse (CONTEXT.md rule).
**Warning signs:** PR diff shows raw values where tokens exist; grep `static/global.css` token list for unused.

### Pitfall 13: SSG quirks with env vars at build vs runtime

**What goes wrong:** `$env/static/public` is baked at build; `$env/dynamic/public` reads at request time. If the prerendered HTML uses `$env/static/public.SITE_URL`, switching preview URLs between branches requires a rebuild — slow. If it uses `$env/dynamic/public.SITE_URL`, the value is read fresh per request — but for prerendered HTML on Vercel, "per request" is "per deploy" anyway because the HTML is cached.
**How to avoid:** for prerendered (SSG) routes, use `$env/dynamic/public.PUBLIC_SITE_URL` (note `PUBLIC_` prefix required for public-readable). Vercel sets it per-environment in the project settings; each preview deploy picks up the right value. Document that env vars affecting prerendered HTML need a rebuild.
**Warning signs:** Preview URLs leak into prod canonical, or vice versa.

### Pitfall 14: GitHub Actions secrets vs Vercel env

**What goes wrong:** Devs add `SITE_URL` as a GHA secret thinking it controls the deploy URL. It doesn't — Vercel manages its own env vars per environment. The GHA workflow can READ Vercel env vars via the Vercel CLI but generally shouldn't need to.
**How to avoid:** keep Vercel env vars (`SITE_URL`, future `RESEND_API_KEY`, etc.) in Vercel's project settings. GHA secrets are only for things the workflow itself needs (e.g., Vercel API token to detect preview URL).
**Warning signs:** Two sources of truth for env vars.

## Code Examples

> All examples are intentionally minimal and tagged with the requirement(s) they satisfy. The planner can lift them into tasks. Patterns are derived from CONTEXT.md (locked) + Svelte 5 / SvelteKit / Vercel idioms.

### `svelte.config.js` (FND-01, FND-03)

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.svx'],
  preprocess: [vitePreprocess(), mdsvex({ extensions: ['.svx'] })],
  compilerOptions: {
    runes: true, // force runes mode globally; see Pitfall #11
  },
  kit: {
    adapter: adapter({
      runtime: 'nodejs20.x',
      regions: ['fra1'], // EU data residency for Vercel Functions (Phase 3)
    }),
    alias: {
      $schema: 'src/lib/schema',
    },
    prerender: {
      entries: ['*'], // see Pitfall #8 — prerender every discoverable route
      handleHttpError: 'fail', // any 404 during prerender fails the build
    },
  },
};

export default config;
```

### `vite.config.ts` (FND-01, PRF-01)

```ts
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    enhancedImages(), // PRF-01: AVIF/WebP + responsive srcset + dimensions
    sveltekit(),
  ],
  // NO Tailwind plugin, NO PostCSS preset — locked plain CSS
});
```

### `tsconfig.json` (FND-01)

```jsonc
// tsconfig.json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "paths": {
      "$schema/*": ["./src/lib/schema/*"]
    }
  }
}
```

### `src/routes/+layout.ts` (FND-01)

```ts
// src/routes/+layout.ts
import type { LayoutLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { defaults } from '$lib/seo/defaults';

export const prerender = true; // SSG default for the whole site (Pattern 1)
export const trailingSlash = 'never'; // canonical = no slash; SvelteKit 301s the slashed form

export const load: LayoutLoad = async ({ url }) => {
  return {
    meta: { ...defaults, path: url.pathname }, // root defaults; route +page.ts overrides
    graph: buildGraph({ pageSpecific: [], path: url.pathname }), // shared-only graph until route adds
  };
};
```

### `src/routes/+layout.svelte` (FND-01, SEO-01, SEO-03, SCH-01)

```svelte
<script lang="ts">
  import '../static/global.css'; // Pattern 2 — single global stylesheet
  import Head from '$lib/components/Head.svelte';
  import JsonLd from '$lib/components/JsonLd.svelte';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import SiteFooter from '$lib/components/SiteFooter.svelte';
  import { page } from '$app/stores';

  let { children } = $props();
</script>

<svelte:head>
  <html lang="nl"></html>
  <!-- Font preload (Pattern 7) — primary weight only; conditional per-route preload of hero image happens in +page.svelte -->
  <link
    rel="preload"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
    href="/fonts/<sans>/<weight>.woff2"
  />
</svelte:head>

<Head meta={$page.data.meta} />
<JsonLd graph={$page.data.graph} />

<SiteHeader />
<main>
  {@render children()}
</main>
<SiteFooter />

<style>
  main {
    /* base mobile-first styles using tokens from static/global.css */
    padding-inline: var(--space-4);
    max-width: var(--container-max);
    margin-inline: auto;
  }

  @media (min-width: 768px) {
    main {
      padding-inline: var(--space-6);
    }
  }
</style>
```

### `src/lib/seo/types.ts` (SEO-01, SEO-04, SEO-05, SEO-06)

```ts
// src/lib/seo/types.ts
export type PageMeta = {
  title: string; // 50–60 chars; CI gate enforces
  description: string; // 150–160 chars; CI gate enforces
  path: string; // absolute path; canonical + hreflang built from SITE_URL + path
  og?: {
    image?: string; // defaults to /og-default.jpg
    type?: 'website' | 'article';
  };
  noindex?: boolean; // default false; true for 404 only
};
```

### `src/lib/seo/defaults.ts` (FND-07, SEO-01, SEO-06)

```ts
// src/lib/seo/defaults.ts
import { env } from '$env/dynamic/public';

if (!env.PUBLIC_SITE_URL) {
  // Fail loud at build (Pattern 8). NEVER default to localhost.
  throw new Error('PUBLIC_SITE_URL is required (set in Vercel env per environment).');
}

export const SITE_URL = env.PUBLIC_SITE_URL.replace(/\/$/, '');

export const defaults = {
  title: 'TRINITY Breath & Healing', // suffix appended by <Head> when route title is set
  description:
    'Trinity Breath & Healing begeleidt vanuit eigen ervaring bij lichaamsgerichte therapie, ' +
    'ademwerk en energetische behandelingen in Almere en omgeving.',
  path: '/',
  og: {
    image: `${SITE_URL}/og-default.jpg`, // TODO: real OG image
    type: 'website' as const,
  },
};
```

### `src/lib/components/Head.svelte` (SEO-01, SEO-04, SEO-05, SEO-06)

```svelte
<script lang="ts">
  import type { PageMeta } from '$lib/seo/types';
  import { SITE_URL } from '$lib/seo/defaults';

  let { meta }: { meta: PageMeta } = $props();

  const titleFull = $derived(
    meta.path === '/' ? meta.title : `${meta.title} | TRINITY Breath & Healing`,
  );
  const canonical = $derived(`${SITE_URL}${meta.path}`);
  const ogImage = $derived(meta.og?.image ?? `${SITE_URL}/og-default.jpg`);
</script>

<svelte:head>
  <title>{titleFull}</title>
  <meta name="description" content={meta.description} />
  <link rel="canonical" href={canonical} />
  <link rel="alternate" hreflang="nl" href={canonical} />
  <link rel="alternate" hreflang="x-default" href={canonical} />

  <meta property="og:title" content={titleFull} />
  <meta property="og:description" content={meta.description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:type" content={meta.og?.type ?? 'website'} />
  <meta property="og:locale" content="nl_NL" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={titleFull} />
  <meta name="twitter:description" content={meta.description} />
  <meta name="twitter:image" content={ogImage} />

  {#if meta.noindex}
    <meta name="robots" content="noindex,nofollow" />
  {/if}
</svelte:head>
```

### `src/lib/components/PageTitle.svelte` (SEO-02)

```svelte
<script lang="ts">
  let { children }: { children: import('svelte').Snippet } = $props();
</script>

<h1>{@render children()}</h1>

<style>
  h1 {
    font-family: var(--font-display);
    font-size: var(--font-size-3xl);
    line-height: var(--line-height-tight);
    color: var(--color-fg-forest);
  }
</style>
```

### `src/lib/components/JsonLd.svelte` (SCH-01)

```svelte
<script lang="ts">
  let { graph }: { graph: object } = $props();
  // Compose into one @graph at the page level; this primitive emits exactly one <script>.
  const serialized = $derived(
    JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
  );
</script>

<svelte:head>
  {@html `<script type="application/ld+json">${serialized}</script>`}
</svelte:head>
```

### `src/lib/schema/shared.ts` (SCH-02, SCH-03, SCH-05)

```ts
// src/lib/schema/shared.ts
import type { Organization, ProfessionalService, Person, WebSite } from 'schema-dts';
import { SITE_URL } from '$lib/seo/defaults';
import { BRAND } from '$lib/constants/brand';

export const organizationNode: Organization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: BRAND.legalName,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`, // TODO: real logo file
  sameAs: [
    BRAND.socials.instagram && `https://instagram.com/${BRAND.socials.instagram}`,
    BRAND.socials.facebook,
    BRAND.socials.x && `https://x.com/${BRAND.socials.x}`,
  ].filter(Boolean) as string[],
};

export const professionalServiceNode: ProfessionalService = {
  '@type': 'ProfessionalService',
  '@id': `${SITE_URL}/#business`,
  name: BRAND.legalName,
  url: SITE_URL,
  areaServed: BRAND.areaServed,
  serviceType: ['Ademwerk', 'Lichaamsgerichte therapie', 'Energetische behandelingen'],
  // No 'address' published v1 (practitioner is mobile/remote/part-time) — CONTEXT.md decision
  telephone: BRAND.phone,
  email: BRAND.email,
};

export const personNode: Person = {
  '@type': 'Person',
  '@id': `${SITE_URL}/#practitioner`,
  name: BRAND.practitionerFullName, // TODO from UNKNOWNS.md
  jobTitle: 'Ademwerk begeleider', // adjust based on BIG status (UNKNOWNS.md)
  worksFor: { '@id': `${SITE_URL}/#organization` },
};

export const webSiteNode: WebSite = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: BRAND.shortName,
  inLanguage: 'nl-NL',
  publisher: { '@id': `${SITE_URL}/#organization` },
};
```

### `src/lib/schema/services.ts` (SCH-04)

```ts
// src/lib/schema/services.ts
import type { Service } from 'schema-dts';
import { SITE_URL } from '$lib/seo/defaults';
import { BRAND } from '$lib/constants/brand';

export function makeServiceNode(slug: string, name: string): Service {
  return {
    '@type': 'Service',
    '@id': `${SITE_URL}/#service-${slug}`,
    name,
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: BRAND.areaServed,
    serviceType: name,
    url: `${SITE_URL}/diensten/${slug}`,
  };
}

export const allServiceNodes: Service[] = BRAND.services.map(s =>
  makeServiceNode(s.slug, s.name),
);
```

### `src/lib/schema/buildGraph.ts` (SCH-01, SCH-06)

```ts
// src/lib/schema/buildGraph.ts
import {
  organizationNode,
  professionalServiceNode,
  personNode,
  webSiteNode,
} from './shared';
import { allServiceNodes } from './services';

type AnyNode = { '@id'?: string };

export function buildGraph(opts: {
  pageSpecific: AnyNode[];
  path: string;
}): AnyNode[] {
  const shared: AnyNode[] = [
    organizationNode,
    professionalServiceNode,
    personNode,
    webSiteNode,
    ...allServiceNodes,
  ];
  // Compose + dedup by @id (Pitfall #6).
  const seen = new Set<string>();
  const out: AnyNode[] = [];
  for (const node of [...shared, ...opts.pageSpecific]) {
    const id = node['@id'];
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    out.push(node);
  }
  return out;
}
```

### `src/lib/schema/breadcrumb.ts` (SCH-06)

```ts
// src/lib/schema/breadcrumb.ts
import type { BreadcrumbList } from 'schema-dts';
import { SITE_URL } from '$lib/seo/defaults';

export function buildBreadcrumb(crumbs: { name: string; path: string }[]): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
}
```

### `src/lib/components/StubLayout.svelte` (FND-08)

```svelte
<script lang="ts">
  import PageTitle from './PageTitle.svelte';
  import Breadcrumbs from './Breadcrumbs.svelte';

  let {
    title,
    description, // 150–160 chars (CI gate enforces)
    slug,
  }: {
    title: string;
    description: string;
    slug: string;
  } = $props();
</script>

<Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: title, path: `/${slug}` }]} />
<article>
  <PageTitle>{title}</PageTitle>
  <p>{description}</p>
  <p>
    Deze pagina komt binnenkort beschikbaar.
    <a href="/">Terug naar de hoofdpagina →</a>
  </p>
</article>

<style>
  article {
    padding-block: var(--space-8);
  }
  p {
    margin-block-start: var(--space-4);
    color: var(--color-fg-forest);
  }
</style>
```

### `src/routes/werkwijze/+page.ts` + `+page.svelte` (FND-08, SCH-06)

```ts
// src/routes/werkwijze/+page.ts
import type { PageLoad } from './$types';
import { buildGraph } from '$lib/schema/buildGraph';
import { buildBreadcrumb } from '$lib/schema/breadcrumb';

export const load: PageLoad = async ({ url }) => {
  const meta = {
    title: 'Werkwijze – Hoe een sessie bij Trinity verloopt',
    description:
      'Onze werkwijze: een rustige kennismaking, een lichaamsgerichte sessie en optionele verdieping. ' +
      'Stap voor stap meer rust in lichaam en hoofd.',
    path: url.pathname,
  };
  const crumb = buildBreadcrumb([
    { name: 'Home', path: '/' },
    { name: 'Werkwijze', path: '/werkwijze' },
  ]);
  return {
    meta,
    graph: buildGraph({ pageSpecific: [crumb], path: url.pathname }),
  };
};
```

```svelte
<!-- src/routes/werkwijze/+page.svelte -->
<script lang="ts">
  import StubLayout from '$lib/components/StubLayout.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<StubLayout title="Werkwijze" description={data.meta.description} slug="werkwijze" />
```

(Pattern repeated for 13 other stubs — each route file is ~12 lines of `+page.ts` + ~7 lines of `+page.svelte`.)

### `static/global.css` (FND-02, FND-04, FND-05)

```css
/* static/global.css — design tokens + reset + typography baseline + utilities */
/* NO component styles in this file. Component styles live in each .svelte <style> block. */

:root {
  /* --- Color tokens (placeholders — TODO: replace with Figma values) --- */
  --color-bg-sand: #F2EBDD;       /* TODO: confirm */
  --color-fg-forest: #3A4530;     /* TODO: confirm */
  --color-accent-gold: #D4A968;   /* TODO: confirm */
  --color-card-warm: #E8DEC8;     /* TODO: confirm */
  --color-muted: #6B7066;
  --color-border: #D9D2C0;

  /* --- Spacing --- */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* --- Radius --- */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --radius-full: 9999px;

  /* --- Typography --- */
  --font-display: 'Cormorant Garamond', Georgia, serif;  /* TODO: confirm + self-host */
  --font-body: 'Inter', system-ui, sans-serif;            /* TODO: confirm + self-host */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: clamp(1.5rem, 4vw, 2rem);
  --font-size-3xl: clamp(2rem, 6vw, 3rem);
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-loose: 1.75;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;

  /* --- Motion --- */
  --motion-fast: 150ms;
  --motion-base: 250ms;
  --motion-slow: 400ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  /* --- Layout --- */
  --container-max: 1200px;
}

/* --- @font-face declarations (Pattern 7 — populated when fonts chosen) --- */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/inter-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  /* TODO: add size-adjust, ascent-override, descent-override from Fontaine */
}

/* --- Minimal reset --- */
*, *::before, *::after {
  box-sizing: border-box;
}
* {
  margin: 0;
}
html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
body {
  background: var(--color-bg-sand);
  color: var(--color-fg-forest);
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
img, picture, svg, video {
  display: block;
  max-width: 100%;
  height: auto;
}
input, button, textarea, select {
  font: inherit;
}
a {
  color: inherit;
}
a:focus-visible, button:focus-visible {
  outline: 2px solid var(--color-accent-gold);
  outline-offset: 2px;
}

/* --- Typography baseline --- */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  line-height: var(--line-height-tight);
  font-weight: var(--font-weight-bold);
}

/* --- Global utilities (the only "components" allowed in global.css) --- */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* --- Reduced motion --- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### `static/robots.txt` (SEO-08)

```text
# robots.txt — Trinity Breath & Healing
# AI search/RAG crawlers — explicitly allowed (must come BEFORE wildcard).

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

# Training crawlers — ALLOWED per CONTEXT.md decision (2026-06-15).
# Rationale: wellness content has low IP risk + high long-term citation surface in
# Gemini + Apple Intelligence baseline knowledge. Change requires architectural discussion.

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

# Wildcard fallback.

User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://trinity-breath-healing.vercel.app/sitemap.xml
```

(`Sitemap:` URL gets replaced via build-step or env-driven generation in CI; for v1 simplicity, the static URL above is acceptable until custom domain — flag in Phase 5.)

### `src/routes/sitemap.xml/+server.ts` (SEO-07)

```ts
// src/routes/sitemap.xml/+server.ts
import type { RequestHandler } from './$types';
import { SITE_URL } from '$lib/seo/defaults';
import { ALL_ROUTES } from '$lib/constants/routes';

export const prerender = true;

export const GET: RequestHandler = async () => {
  const urls = ALL_ROUTES.map(
    r => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${r.path === '/' ? '1.0' : '0.5'}</priority>
  </url>`,
  ).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
```

### `src/lib/constants/routes.ts` (FND-08, SEO-07)

```ts
// src/lib/constants/routes.ts — single source of truth for the 15 routes
export const ALL_ROUTES = [
  { path: '/', title: 'TRINITY Breath & Healing', kind: 'landing' },
  { path: '/werkwijze', title: 'Werkwijze', kind: 'stub' },
  { path: '/over-mij', title: 'Over mij', kind: 'stub' },
  { path: '/behandelingen', title: 'Behandelingen', kind: 'stub' },
  { path: '/contact', title: 'Contact', kind: 'stub' },
  { path: '/diensten', title: 'Diensten', kind: 'stub' },
  { path: '/diensten/mahatma-healing', title: 'Mahatma Healing', kind: 'service-stub' },
  { path: '/diensten/goldhealing', title: 'Goldhealing', kind: 'service-stub' },
  { path: '/diensten/raster-energie', title: 'Raster Energie', kind: 'service-stub' },
  { path: '/diensten/spinal-touch', title: 'Spinal Touch', kind: 'service-stub' },
  { path: '/blog', title: 'Blog', kind: 'stub' },
  { path: '/artikelen', title: 'Artikelen', kind: 'stub' },
  { path: '/faq', title: 'Veelgestelde vragen', kind: 'stub' },
  { path: '/privacyverklaring', title: 'Privacyverklaring', kind: 'stub' },
  { path: '/algemene-voorwaarden', title: 'Algemene voorwaarden', kind: 'stub' },
] as const;
```

### `scripts/check-html.ts` (SEO-02, SEO-11)

```ts
// scripts/check-html.ts — post-build HTML audit
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';

const ROOT = '.svelte-kit/output/prerendered/pages';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

let failed = 0;
const files = walk(ROOT);
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const doc = parse(html);
  const path = relative(ROOT, file);

  const h1s = doc.querySelectorAll('h1');
  if (h1s.length !== 1) {
    console.error(`✘ ${path}: expected 1 <h1>, found ${h1s.length}`);
    failed++;
  }

  const title = doc.querySelector('title')?.text ?? '';
  if (title.length < 50 || title.length > 60) {
    // landing page allowed to be 60 exactly; stubs slightly longer OK with suffix? CI tunes.
    console.error(`✘ ${path}: <title> length ${title.length} (need 50–60)`);
    failed++;
  }

  const desc =
    doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  if (desc.length < 150 || desc.length > 160) {
    console.error(`✘ ${path}: <meta description> length ${desc.length} (need 150–160)`);
    failed++;
  }

  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
  if (!canonical || !canonical.startsWith('http')) {
    console.error(`✘ ${path}: canonical missing or not absolute`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\nHTML audit failed: ${failed} issue(s).`);
  process.exit(1);
}
console.log(`HTML audit passed: ${files.length} file(s) checked.`);
```

### `scripts/validate-json-ld.ts` (SCH-08)

```ts
// scripts/validate-json-ld.ts — JSON-LD parse + presence check; structured-data-testing-tool used in CI separately
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';

const ROOT = '.svelte-kit/output/prerendered/pages';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

let failed = 0;
for (const file of walk(ROOT)) {
  const html = readFileSync(file, 'utf8');
  const doc = parse(html);
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const path = relative(ROOT, file);

  if (scripts.length === 0) {
    console.error(`✘ ${path}: no JSON-LD <script> found`);
    failed++;
    continue;
  }
  if (scripts.length > 1) {
    console.error(`✘ ${path}: ${scripts.length} JSON-LD <script>s (compose into one @graph)`);
    failed++;
  }
  for (const s of scripts) {
    try {
      const parsed = JSON.parse(s.text);
      if (!parsed['@graph'] || !Array.isArray(parsed['@graph'])) {
        console.error(`✘ ${path}: JSON-LD missing @graph array`);
        failed++;
      }
    } catch (e) {
      console.error(`✘ ${path}: JSON-LD parse error: ${(e as Error).message}`);
      failed++;
    }
  }
}

if (failed > 0) {
  console.error(`\nJSON-LD validation failed: ${failed} issue(s).`);
  process.exit(1);
}
console.log('JSON-LD validation passed.');
```

### `.github/workflows/ci.yml` (FND-10, PRF-08, A11Y-05, SEO-11, SCH-08)

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  build-and-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: npm

      - run: npm ci

      - name: Check (svelte-check + tsc)
        run: npm run check

      - name: Build
        env:
          PUBLIC_SITE_URL: https://trinity-breath-healing.vercel.app
        run: npm run build

      - name: Post-build HTML audit (one-H1, meta-length, canonical)
        run: npx tsx scripts/check-html.ts

      - name: JSON-LD validation
        run: npx tsx scripts/validate-json-ld.ts

      - name: Placeholder grep (non-blocking until Phase 4)
        continue-on-error: true
        run: bash scripts/grep-placeholders.sh

  lighthouse-and-a11y:
    runs-on: ubuntu-latest
    needs: build-and-audit
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Detect Vercel preview URL
        id: vercel
        # Vendor-lock-free: poll GitHub deployments API for the Vercel preview deployment URL
        uses: actions/github-script@v7
        with:
          script: |
            const { data: deployments } = await github.rest.repos.listDeployments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              sha: context.payload.pull_request.head.sha,
              environment: 'Preview',
            });
            // Wait for the deployment status to be 'success' — keep this short (10 tries × 30s)
            for (let i = 0; i < 10; i++) {
              for (const d of deployments) {
                const { data: statuses } = await github.rest.repos.listDeploymentStatuses({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  deployment_id: d.id,
                });
                const success = statuses.find(s => s.state === 'success');
                if (success && success.environment_url) {
                  core.setOutput('url', success.environment_url);
                  return;
                }
              }
              await new Promise(r => setTimeout(r, 30000));
            }
            core.setFailed('No successful Vercel preview deployment found');

      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v12
        with:
          urls: ${{ steps.vercel.outputs.url }}
          configPath: ./lighthouserc.json
          uploadArtifacts: true

      - name: pa11y-ci
        run: |
          npx -y pa11y-ci --sitemap "${{ steps.vercel.outputs.url }}/sitemap.xml" --config .pa11yci.json
```

### `lighthouserc.json` (PRF-08)

```jsonc
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "settings": { "preset": "desktop", "throttlingMethod": "simulate" }
    },
    "assert": {
      "preset": "lighthouse:no-pwa",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "categories:seo": ["error", { "minScore": 1.0 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "interactive": ["warn", { "maxNumericValue": 3000 }]
      }
    }
  }
}
```

### `.pa11yci.json` (A11Y-05)

```json
{
  "defaults": {
    "standard": "WCAG2AA",
    "timeout": 30000,
    "wait": 1000,
    "ignore": []
  }
}
```

### `.env.example` (FND-07)

```
PUBLIC_SITE_URL=
# Required. Set per environment in Vercel project settings.
# Local dev: copy to .env and set PUBLIC_SITE_URL=http://localhost:5173 explicitly.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Svelte 4 stores (`writable`, `derived`) | Svelte 5 runes (`$state`, `$derived`, `$effect`) | Svelte 5 GA (2024); runes mode stable in 2025 | Reactive primitives now compile-known instead of subscriber-based — better performance, simpler mental model. Stores still work but runes are forward-direction. |
| `export let prop` (Svelte 4) | `let { prop } = $props()` (Svelte 5) | Svelte 5 | Runes-mode components must use `$props()`. |
| `$:` reactive blocks | `$derived(...)` + `$effect(() => ...)` | Svelte 5 | Explicit semantics: derived = pure computation; effect = side effect. |
| `<svelte:component>` for dynamic | Just `<Foo>` with a variable that is a component | Svelte 5 | Simpler API. |
| `slot` (Svelte 4) | Snippets via `let { children } = $props()` + `{@render children()}` | Svelte 5 | Type-safe, composable. |
| Astro Content Collections (SUMMARY.md) | mdsvex + Vite glob imports + Zod | This phase (CONTEXT.md swap to SvelteKit) | SvelteKit has no native Content Collections; the mdsvex + glob + Zod combo is the idiomatic substitute. |
| `react-helmet` / client-only meta | `<svelte:head>` (initial-HTML emission) | Always for SSG | Initial-HTML guarantee — bots see meta. |
| Tailwind utility-first CSS | (CONTEXT.md locks this out — N/A) Plain CSS + tokens + scoped component styles | This phase | Project-specific direction. |
| `LocalBusiness` with storefront | `ProfessionalService` + per-modality `Service` | Practice has no storefront | Schema accuracy → better entity recognition. |
| `llms.txt` | Skipped — no proven retrieval effect 2026 | Anti-cargo-cult posture | Validated via project reference doc. |

**Deprecated/outdated:**
- **Astro 5 + Cloudflare Pages** (original research picks): superseded by SvelteKit + Vercel per CONTEXT.md.
- **Tailwind v4 build-time atomic CSS** (original research pick): superseded by plain CSS lock.
- **Sharp direct usage** (original research pick): `@sveltejs/enhanced-img` wraps Sharp; using it directly is the avoidable hand-roll.
- **`+page.server.ts` for SSG** (sometimes recommended): for pure SSG, `+page.ts` is enough; `+page.server.ts` runs only on the server which is fine for SSG but adds no value over `+page.ts` for static data.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `svelte` `^5.x` is the current stable major with runes mode | Standard Stack | Low — Svelte 5 GA was 2024; major hallucination unlikely; planner verifies at install. |
| A2 | `@sveltejs/kit` `^2.x` is current and supports Svelte 5 | Standard Stack | Low — verified at install via `npm view`. |
| A3 | `@sveltejs/adapter-vercel` supports `regions: ['fra1']` and `runtime: 'nodejs20.x'` | Standard Stack + Code Examples | Medium — official adapter docs should be checked at install. If `fra1` is not a valid region string in the current adapter version, name may be `fra1` (Frankfurt) or `eu-central-1` style; verify at install. |
| A4 | `mdsvex` works with Svelte 5 runes | Standard Stack + Pitfall 1 | **HIGH — this is the most likely incompatibility**. Planner inserts a checkpoint: `npm view mdsvex peerDependencies` AND test by creating a `.svx` file with `let { foo } = $props()` BEFORE committing to the approach. Fallback documented (plain TS arrays for FAQ). |
| A5 | `@sveltejs/enhanced-img` is the current SvelteKit image pipeline | Standard Stack + Pattern 14 | Low — official SvelteKit package. |
| A6 | `schema-dts` is Google-maintained and current | Standard Stack | Low — well-known. |
| A7 | `fontaine` computes `size-adjust` correctly for self-hosted woff2 | Standard Stack + Pattern 7 | Low — established unjs package. Capsize is a fallback. |
| A8 | `node-html-parser` is faster than Cheerio for our use case | Standard Stack | Low — for `querySelectorAll('h1')` it's well-known; if Cheerio is preferred for jQuery-style traversal in future expansion, switching is one-line. |
| A9 | `@lhci/cli` and `pa11y-ci` are current and GHA-compatible | Standard Stack + CI workflow | Low — both are well-established. |
| A10 | `treosh/lighthouse-ci-action@v12` is current | CI workflow YAML | Medium — verify the version tag at install; pin to a major that's known good. |
| A11 | `amondnet/vercel-action` is the established community action for Vercel preview detection | Don't Hand-Roll table | Medium — alternative (vendor-lock-free) is `actions/github-script` polling deployments API, which the workflow YAML actually uses. |
| A12 | Vercel's region name for Frankfurt is `fra1` | Code Examples | Medium — Vercel docs should confirm; widely known. |
| A13 | `$env/dynamic/public.PUBLIC_SITE_URL` is the right SvelteKit pattern for per-environment URLs in prerendered pages | Pattern 8 + Pitfall 13 | Low — well-documented SvelteKit pattern. |
| A14 | The svelte-project skill correctly bootstraps Svelte 5 + TS-strict + plain CSS without needing the adapter (which we add separately) | Standard Stack + skill invocation | Low — skill is the user's own and matches our needs. |
| A15 | The plain-css-system skill seeds the CSS variable token system in `static/global.css` (NOT `src/app.css`) | Standard Stack + skill invocation | Medium — the skill targets `src/app.css` per its SKILL.md; our project locks `static/global.css`. Planner notes the redirection: invoke the skill but rename target to `static/global.css`. **Alternatively, accept `src/app.css` as the canonical location** (Vite-imported from `+layout.ts`) and treat `static/global.css` as the policy name interchangeably. **Recommend: use `src/app.css` because the skill is well-tested and the Vite import is cleaner than referencing `static/global.css` from a Svelte component.** Confirm with user — small deviation from CONTEXT.md naming but architecturally identical. |
| A16 | The placeholder palette estimates (`#F2EBDD`, `#3A4530`, `#D4A968`, `#E8DEC8`) match the Figma frames sufficiently for Phase 0 | Pattern 2 + global.css | Medium — exact match comes from design tokens later. Phase 0 just needs SOMETHING token-shaped. |
| A17 | The recommended placeholder font pair (Cormorant Garamond + Inter) matches the Figma look reasonably | Pattern 7 + global.css | Medium — visual match is approximate. User has explicit veto in CONTEXT.md "Claude's Discretion" so the placeholder pair is acceptable. |
| A18 | Vercel HTML-file Search Console verification works for `*.vercel.app` URL-prefix property (not just custom domains) | Vercel-specific config + SEO-10 | Medium — Search Console URL-prefix supports `*.vercel.app`; HTML-file verification requires the file at `/<google-hash>.html`. Verify at Phase 5 setup. |
| A19 | SvelteKit's prerender output dir is `.svelte-kit/output/prerendered/pages/` | scripts/check-html.ts + scripts/validate-json-ld.ts | Low — well-known SvelteKit convention. |
| A20 | The svelte-project skill's `scripts_allowlist` (dev/build/preview/check/lint/format) is acceptable for Phase 0 + we add `audit:html` + `audit:json-ld` as CI-only scripts | Skill invocation | Low — skill explicitly allows justified additions; CI audit scripts are well-justified. |

**Risk-management note:** A4 (mdsvex + Svelte 5) is the single highest-risk assumption. The planner MUST insert a verification task BEFORE wiring mdsvex into `svelte.config.js`. If incompatible, the FAQ source pattern moves from `.svx` files to plain TS arrays — fully covered by §10 Pitfall 1 fallback.

## Open Questions

1. **Does mdsvex currently support Svelte 5 runes mode?**
   - What we know: mdsvex was Svelte-4-first; Svelte 5 runes mode is a newer compiler.
   - What's unclear: as of training cutoff, mdsvex was tracking Svelte 5 support but the GA timing is unverified this round.
   - Recommendation: Phase 0 plan inserts a checkpoint task: `npm view mdsvex peerDependencies` + create a throwaway `.svx` file using `let { foo } = $props()` + run `svelte-check`. If green → wire mdsvex per §11 example. If red → switch FAQ data to `src/lib/content/faq.ts` (TS array); defer `.svx` to v2.

2. **Should `static/global.css` be `static/global.css` (CONTEXT.md naming) or `src/app.css` (svelte-project skill convention)?**
   - What we know: CONTEXT.md names `static/global.css`. The `svelte-project` skill targets `src/app.css`. Architecturally identical.
   - What's unclear: which name the user prefers when the skill produces one but CONTEXT.md names another.
   - Recommendation: invoke the plain-css-system skill to seed tokens into `src/app.css`, then either:
     - (a) Rename / move to `static/global.css` per CONTEXT.md
     - (b) Update CONTEXT.md's reference to `src/app.css` (small deviation, architecturally null)
   - **Recommend (b)** because `src/app.css` is the canonical Vite-imported location and is what the skill outputs. Document the rename in the CONTEXT.md follow-up.

3. **`vercel.json` — needed or not?**
   - What we know: adapter-vercel handles framework + region + build defaults.
   - What's unclear: edge-case overrides (e.g., custom rewrites, headers) might require `vercel.json`.
   - Recommendation: skip `vercel.json` in Phase 0. Add later only if a specific override emerges (e.g., custom CSP header). Documented in §3 Pattern 10.

4. **Does the SvelteKit prerender crawler reach all 15 routes without explicit listing?**
   - What we know: SvelteKit follows `<a href>` from `/` to discover routes.
   - What's unclear: the placeholder header/footer in Phase 0 may not yet link to every stub (header has 5 nav links; footer has columns with 14 links). If the placeholder header is incomplete in Phase 0, some stubs may be discovered only via `<SiteFooter>`'s LEZEN/DIENSTEN columns.
   - Recommendation: ALSO set `kit.prerender.entries = ['*']` (per Pitfall 8). `'*'` tells SvelteKit to prerender every statically discoverable route, which is what we want.

5. **Search Console URL-prefix verification on `*.vercel.app` — is HTML-file method supported?**
   - What we know: URL-prefix property supports `*.vercel.app`; HTML-file method is the universal verification.
   - What's unclear: whether Vercel's auto-injected security headers or `.well-known` routing interferes.
   - Recommendation: Phase 5 task; Phase 0 ships the file (placeholder hash) so the slot is plumbed. If Phase 5 finds Vercel issue, switch to meta-tag verification (also URL-prefix supported).

6. **Do we need lighthouse-ci-action @ v12 specifically, or is `@lhci/cli` invoked manually sufficient?**
   - What we know: both work; the action is more boilerplate-free.
   - Recommendation: use the action for ergonomics. Pin major.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js LTS | SvelteKit build, npm | Required at install — assume devs/CI have it | 20.x or 22.x | None — required |
| npm | Package install, scripts | Required | bundled with Node | yarn / pnpm acceptable if user prefers; package-lock vs alternatives — recommend npm per svelte-project skill |
| GitHub account | Repo + GHA | Required | — | None |
| Vercel account | Hosting + Functions region | Required | — | None |
| Google account | Search Console | Required | — | None |
| Figma access | Design source | Required (read-only) | — | Frames already exported as PNGs |
| `svelte-project` skill | Project scaffolding | Available at `~/.claude/skills/svelte-project/SKILL.md` | — | Manual `npx sv create` |
| `plain-css-system` skill | Token system seed | Available at `~/.claude/skills/plain-css-system/SKILL.md` | — | Manual token file authored from §11 example |
| Vercel API token (for GHA preview-URL detection if using vercel-action) | CI Lighthouse step | Required if using vercel-action | — | Fallback: poll GitHub deployments API (workflow example uses this — no Vercel token required) |
| `slopcheck` CLI | Package legitimacy verification | UNAVAILABLE this round | — | Planner gates every install behind checkpoint (per Package Legitimacy Gate fallback) |
| `ctx7` CLI | Context7 docs lookup | UNAVAILABLE this round | — | Refer to official Svelte/Vercel docs URLs during install verification |
| Context7 MCP | Library docs | UNAVAILABLE this round | — | Same as above |
| WebSearch / WebFetch / firecrawl | Web research | UNAVAILABLE this round | — | Research based on training data; planner verifies versions at install |

**Missing dependencies with no fallback:** none for Phase 0 (Node, npm, GitHub, Vercel, Google accounts are all user-side prerequisites that the user already has based on CONTEXT.md).

**Missing dependencies with fallback:** slopcheck, ctx7, web tools — all replaced by planner-inserted `checkpoint:human-verify` tasks before each `npm install`.

## Validation Architecture

> Phase 0's validation is unusual: this phase ships **the gates themselves**. The "code being validated" is the scaffold + primitives. Tests assert the gates exist, work, and fire correctly on a synthetic violation.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (Svelte's recommended test runner; works with SvelteKit) `[ASSUMED — verify at install]` |
| Config file | `vitest.config.ts` — Wave 0 creates |
| Quick run command | `npm test -- --run` (single run, no watch) |
| Full suite command | `npm test -- --run && npm run check && npm run build && npx tsx scripts/check-html.ts && npx tsx scripts/validate-json-ld.ts` |

Phase 0 does NOT include extensive unit tests of the primitives themselves — they're trivial wrappers. Instead, the validation is end-to-end: build the scaffold, run the post-build audits, assert they pass. Synthetic violations (deliberate broken H1 / broken JSON-LD) verify the audits FAIL when they should.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| FND-01 | SvelteKit + Svelte 5 runes builds; adapter-vercel configured for `fra1` | smoke | `npm run build && grep -q "fra1" .svelte-kit/output/server/*.js` (or read adapter output manifest) | ❌ Wave 0 |
| FND-02 | Component styles auto-scoped; no shared CSS files beyond `static/global.css` | static check | `bash scripts/no-shared-css.sh` (greps for `src/styles/` or shared `.css` imports outside global) | ❌ Wave 0 |
| FND-03 | `mdsvex` processes `.svx` files in `src/content/`; Zod validates frontmatter | unit | `vitest src/lib/content/__tests__/faq-zod.test.ts` | ❌ Wave 0 |
| FND-04 | `static/global.css` defines required token groups | static check | `bash scripts/check-tokens.sh` (greps for required `--color-*`, `--space-*`, `--font-*`, `--motion-*` vars) | ❌ Wave 0 |
| FND-05 | Mobile-first reset present | static check | same as FND-04 | ❌ Wave 0 |
| FND-06 | `@font-face` declarations present with `font-display: swap` | static check | `grep -c "font-display: swap" static/global.css` ≥ 1 (or src/app.css if A15(b)) | ❌ Wave 0 |
| FND-07 | Build fails when `PUBLIC_SITE_URL` unset | integration | `unset PUBLIC_SITE_URL && ! npm run build` (deliberate failure check) | ❌ Wave 0 |
| FND-08 | All 14 stub routes return HTTP 200 + emit per-page meta + JSON-LD | integration | `npx tsx scripts/check-html.ts` walks all 15 prerendered HTML files | ❌ Wave 0 — script is the SEO-11 gate |
| FND-09 | Repository on GitHub, branch protection active, Vercel auto-deploys | manual-only | ops checklist (not automatable in CI) | manual |
| FND-10 | CI workflow runs all gates per PR | integration | `gh workflow run ci.yml` + verify gates fire | ❌ Wave 0 |
| SEO-01 | Per-page unique `<title>` (50–60) + meta description (150–160) in initial HTML | integration | `scripts/check-html.ts` audit (above) | ❌ Wave 0 |
| SEO-02 | One `<h1>` per page | integration | `scripts/check-html.ts` audit | ❌ Wave 0 |
| SEO-03 | Semantic landmarks present | integration | extend `scripts/check-html.ts` to assert `<main>`, `<nav>`, `<footer>` per file | ❌ Wave 0 |
| SEO-04 | Canonical present + absolute | integration | `scripts/check-html.ts` audit | ❌ Wave 0 |
| SEO-05 | `hreflang="nl"` + `x-default` present | integration | extend `scripts/check-html.ts` | ❌ Wave 0 |
| SEO-06 | OG + Twitter present | integration | extend `scripts/check-html.ts` | ❌ Wave 0 |
| SEO-07 | `/sitemap.xml` returns valid XML with all 15 entries | integration | `curl preview/sitemap.xml | xmllint --noout -` + count `<loc>` entries = 15 | ❌ Wave 0 |
| SEO-08 | `/robots.txt` has AI allows BEFORE wildcard | integration | `bash scripts/check-robots.sh` (asserts order) | ❌ Wave 0 |
| SEO-09 | `dateModified` visible on landing + in landing JSON-LD | integration | `grep "Bijgewerkt op" .svelte-kit/output/prerendered/pages/index.html` | ❌ Wave 0 |
| SEO-10 | Search Console verification file at `/google<hash>.html` | manual-only | Phase 5 step | manual |
| SEO-11 | CI fails on H1/meta/canonical violations | integration | synthetic violation test: deliberately break `+page.svelte` H1; CI must fail | ❌ Wave 0 |
| SCH-01 | One `<script type="application/ld+json">` per page | integration | `scripts/validate-json-ld.ts` | ❌ Wave 0 |
| SCH-02 | Organization + ProfessionalService nodes present in `@graph` | integration | parse JSON-LD, assert `'@type': 'Organization'` and `'@type': 'ProfessionalService'` present | ❌ Wave 0 |
| SCH-03 | Person node present | integration | same approach | ❌ Wave 0 |
| SCH-04 | All 4 Service nodes with `areaServed` + `provider` | integration | parse JSON-LD, assert 4 `'@type': 'Service'` with `areaServed` and `provider['@id']` matching `#organization` | ❌ Wave 0 |
| SCH-05 | WebSite node present | integration | parse JSON-LD | ❌ Wave 0 |
| SCH-06 | BreadcrumbList on all non-root pages | integration | walk all non-`/` HTML files, assert BreadcrumbList present | ❌ Wave 0 |
| SCH-07 | FAQPage source single-source — Phase 0 ships wiring only (zero entries) | unit | `vitest src/lib/schema/__tests__/faq.test.ts` — assert that `buildFaqPage(faqEntries)` produces consistent rendered + JSON-LD output | ❌ Wave 0 (entries land in Phase 1) |
| SCH-08 | `structured-data-testing-tool` CLI green | integration | `npx structured-data-testing-tool --url <preview>` | ❌ Wave 0 |
| PRF-01 | `<EnhancedImage>` enforces `alt`, `width`, `height` | unit | `vitest src/lib/components/__tests__/EnhancedImage.test.ts` — assert it errors without required props | ❌ Wave 0 |
| PRF-08 | Lighthouse CI budget gate fires on LCP/INP/CLS breach | integration | `lighthouserc.json` assert config; synthetic-failure test (deliberately add huge image to landing; CI must fail) | ❌ Wave 0 |
| A11Y-05 | pa11y-ci fails on WCAG 2.2 AA violation | integration | synthetic-failure test (add missing-alt image; CI must fail) | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run check && npm test -- --run` (TypeScript + Svelte check + unit tests; ~10s)
- **Per wave merge:** `npm run check && npm test -- --run && npm run build && npx tsx scripts/check-html.ts && npx tsx scripts/validate-json-ld.ts` (full local audit; ~30s)
- **Phase gate (before `/gsd:verify-work`):** full local audit + Vercel preview deploy + Lighthouse CI + pa11y-ci all green; manual `curl -A "OAI-SearchBot" <preview-url>/` smoke test confirms initial-HTML SEO output per success criteria #1 in ROADMAP.md.

### Wave 0 Gaps

- [ ] `vitest.config.ts` — test framework config
- [ ] `scripts/check-html.ts` — primary CI gate (HTML audit)
- [ ] `scripts/validate-json-ld.ts` — secondary CI gate (JSON-LD audit)
- [ ] `scripts/no-shared-css.sh` — FND-02 enforcement (no shared CSS beyond global)
- [ ] `scripts/check-tokens.sh` — FND-04 enforcement (required tokens present)
- [ ] `scripts/check-robots.sh` — SEO-08 enforcement (order check)
- [ ] `scripts/grep-placeholders.sh` — FND-10 + LGL-11 plumbing (non-blocking until Phase 4)
- [ ] `src/lib/components/__tests__/EnhancedImage.test.ts` — required-prop enforcement
- [ ] `src/lib/schema/__tests__/faq.test.ts` — single-source-of-truth verification
- [ ] `src/lib/content/__tests__/faq-zod.test.ts` — Zod frontmatter validation test
- [ ] `lighthouserc.json` — budget config
- [ ] `.pa11yci.json` — pa11y config
- [ ] `.github/workflows/ci.yml` — orchestration
- [ ] Synthetic-failure tests: deliberately broken H1, missing JSON-LD, oversized image, missing alt — each gate must FAIL on these before being trusted

*(Most of Phase 0 IS Wave 0 — there is no pre-existing test infrastructure. The above gaps are the test framework + gate scripts; they ship together as the foundation of every subsequent phase's validation.)*

## Security Domain

> `security_enforcement` defaults to enabled. Phase 0 has a small but real surface: env vars, robots.txt, the contact form is NOT in this phase (Phase 3), but the headers and CSP foundation could be.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V1 Architecture | yes | SvelteKit's prerender + adapter-vercel boundary is well-documented; document the trust boundary in code comments |
| V2 Authentication | no — no user accounts | N/A |
| V3 Session Management | no — no sessions in v1 | N/A |
| V4 Access Control | partial | `/api/contact` (Phase 3) needs rate-limit; Phase 0 plumbs robots.txt `Disallow: /api/` |
| V5 Input Validation | not yet — Phase 3 | Zod will validate `/api/contact` body in Phase 3 |
| V6 Cryptography | no | No tokens, no client crypto in Phase 0 |
| V7 Error Handling | yes | SvelteKit `+error.svelte` for 404/500 with `noindex` meta (not in Phase 0 reqs explicitly, but good hygiene to ship) |
| V8 Data Protection | not yet | Phase 3 form data flow |
| V9 Communication | yes | HTTPS-only — Vercel default. HSTS — set via `vercel.json` headers (optional Phase 0 add) or via SvelteKit response headers |
| V10 Malicious Code | yes | Package legitimacy gate (every install human-verified per protocol) |
| V11 Business Logic | no | N/A |
| V12 Files & Resources | yes | static/ files served by Vercel CDN; no upload in Phase 0 |
| V13 API & Web Services | no | API is Phase 3 |
| V14 Configuration | yes | `PUBLIC_SITE_URL` env discipline; no secrets in repo |

### Known Threat Patterns for SvelteKit + Vercel + plain CSS + Svelte 5

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `{@html}` injection in `<JsonLd>` component | Tampering | We use `{@html}` for the JSON-LD `<script>` tag because Svelte refuses to render `<script>` content otherwise. The JSON is `JSON.stringify`'d (no XSS vector since the closing `</script>` is the only attack surface). Mitigation: also `.replace(/<\/script>/gi, '<\\/script>')` on the serialized output as defense-in-depth — see updated `JsonLd.svelte` recommendation below. |
| Open redirect via canonical | Tampering | Canonical built from `SITE_URL` env (env-controlled) — no user input. |
| robots.txt wildcard shadow | Spoofing (of intent) | Pitfall #2 + Pitfall 10 — order locked in template; inline comment in robots.txt warns. |
| Slopsquat / hallucinated npm package | Malicious Code | Package Legitimacy Gate fallback — planner gates every install behind human-verify checkpoint. |
| `PUBLIC_SITE_URL` set to attacker domain on a preview | Tampering | Vercel project settings restrict who can change env vars (org admins). Document in ops runbook. |
| Vercel preview URLs indexed by search engines | Information Disclosure | Set `X-Robots-Tag: noindex` on Vercel preview deployments via Vercel project settings ("Deployment Protection" or env-conditional `<meta name="robots" noindex>` in `<Head>` when `PUBLIC_VERCEL_ENV !== 'production'`). **Recommend Phase 0 ships the env-conditional noindex.** |
| CSP not configured | XSS | Phase 0 optional add: `vercel.json` `headers` with a baseline CSP (script-src 'self', style-src 'self' 'unsafe-inline' (for Svelte scoped styles), font-src 'self', img-src 'self' data: https://). Phase 0 can ship report-only mode first. |
| HSTS not set | Communication | Vercel sets HTTPS by default; HSTS preload requires opt-in via `Strict-Transport-Security` response header. Phase 0 optional add: `vercel.json` `headers`. |

**Recommended `JsonLd.svelte` update** (defense in depth):
```svelte
<script lang="ts">
  let { graph }: { graph: object } = $props();
  const serialized = $derived(
    JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
      .replace(/<\/script/gi, '<\\/script'), // defense in depth against </script> in JSON content
  );
</script>

<svelte:head>
  {@html `<script type="application/ld+json">${serialized}</script>`}
</svelte:head>
```

## Sources

### Primary (HIGH confidence)

- `.planning/phases/00-foundation-seo-scaffolding/00-CONTEXT.md` (project root) — locks stack, robots, schema, structure, styling rules.
- `.planning/REQUIREMENTS.md` — 32 Phase 0 requirement IDs.
- `.planning/ROADMAP.md` — Phase 0 goal + 5 success criteria.
- `.planning/research/ARCHITECTURE.md` — hub-spoke topical model + SEO invariants + build order.
- `.planning/research/PITFALLS.md` — 20 pitfalls (9 Phase-0-preventable) + verification mappings.
- `seo-aeo-samenvatting-checklist.md` (project root) — authoritative Dutch SEO/AEO playbook (Princeton/KDD 2024 GEO, HubSpot 2025, 2026 crawler refs, Reclame Code, AVG).
- `~/.claude/skills/svelte-project/SKILL.md` — project's own SvelteKit scaffolding conventions.
- `~/.claude/skills/plain-css-system/SKILL.md` — project's own plain CSS token system.
- `.planning/phases/00-foundation-seo-scaffolding/UNKNOWNS.md` — locked design facts + open items.

### Secondary (MEDIUM confidence)

- SvelteKit official docs (knowledge through 2026-01 cutoff) — `prerender`, `+layout.ts/svelte`, `+server.ts`, `adapter-vercel`, `$env/dynamic/public`, `<svelte:head>`, `$props`, `$state`, `$derived`, `$effect`.
- Svelte 5 official docs — runes mode + snippets + `{@render children()}`.
- Vercel docs — adapter-vercel regions, preview URLs, GitHub integration, env vars per environment.
- Schema.org documentation — `Organization`, `ProfessionalService`, `Person`, `Service`, `BreadcrumbList`, `FAQPage`, `WebSite`, `@graph`, `@id`.
- `schema-dts` (Google) — typed Schema.org definitions.
- `mdsvex` documentation — `.svx` extension + frontmatter handling.
- `@sveltejs/enhanced-img` documentation — Vite plugin AVIF/WebP transform.
- `node-html-parser` documentation — `querySelector`-style API.
- `@lhci/cli` documentation — assert config schema.
- `pa11y-ci` documentation — sitemap-driven runs.
- `fontaine` documentation — font fallback metric computation.
- web.dev Core Web Vitals — LCP/INP/CLS thresholds.
- Google robots.txt specification — user-agent specificity rules.
- KDD 2024 GEO study (Aggarwal et al., arXiv:2311.09735) — citation-lift research.

### Tertiary (LOW confidence — flagged for verification)

- Specific package versions (all `[VERIFY at install]`).
- mdsvex + Svelte 5 runes mode compatibility (Pitfall 1 — explicit verification step in plan).
- `treosh/lighthouse-ci-action@v12` exact version pin.
- `amondnet/vercel-action` as preferred (workflow uses fallback `actions/github-script` — Vercel-action is alternative).
- Whether `vercel.json` is or isn't needed (assumed not — verify if anything pushes back).

## Metadata

**Confidence breakdown:**
- Standard stack (package choices, roles): HIGH — derived from CONTEXT.md locks + ecosystem standard practice.
- Standard stack (exact versions): MEDIUM — registry verification blocked; every entry `[ASSUMED]` + `[VERIFY at install]`.
- Architecture patterns: HIGH — derived from CONTEXT.md + ARCHITECTURE.md + Svelte 5 / SvelteKit idioms.
- Pitfalls: HIGH — cross-referenced against PITFALLS.md (9 of 20 pitfalls Phase 0 prevents) + Svelte 5 / SvelteKit specifics from training data through Jan 2026 cutoff.
- Code examples: HIGH on shape, MEDIUM on specific TS/Svelte syntax for runes (Svelte 5 GA but runes ergonomics still evolving slightly).
- Security domain: MEDIUM — Phase 0 has limited surface; Phase 3 (API endpoint) is where security work concentrates.
- Validation architecture: HIGH — gates are the deliverable; test scripts described directly correspond to phase requirements.

**Research date:** 2026-06-15
**Valid until:** 2026-07-15 (30 days for the architecture; 7 days for any specific version recommendation — re-verify packages weekly via `npm view` during the active phase).

**Research tools available this session:** Read, Write, Bash (limited), Glob, Grep, Edit. **NOT available:** WebSearch, WebFetch, Context7 MCP, ctx7 CLI, slopcheck CLI, firecrawl, Exa, Brave. The Package Legitimacy Gate fallback applies to every recommended dependency; the planner MUST insert `checkpoint:human-verify` before every `npm install` step.
