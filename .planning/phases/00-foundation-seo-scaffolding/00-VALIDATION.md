---
phase: 0
slug: foundation-seo-scaffolding
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-15
---

# Phase 0 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + Playwright (integration HTML/HTTP assertions) + custom CI scripts (HTML audit, `curl -A` initial-HTML, JSON-LD validate) |
| **Config file** | `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/ci.yml` — installed in Wave 0 |
| **Quick run command** | `pnpm test:unit -- --run` |
| **Full suite command** | `pnpm test && pnpm lint && pnpm check && pnpm build && pnpm test:html-audit` |
| **Estimated runtime** | ~90s quick / ~6 min full |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:unit -- --run`
- **After every plan wave:** Run full suite (lint + svelte-check + build + HTML audit)
- **Before `/gsd:verify-work`:** Full suite must be green AND `curl -A "OAI-SearchBot"` initial-HTML assertions pass against deployed Vercel preview
- **Max feedback latency:** 90 seconds (unit), 360 seconds (full)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 00-01-01 | 01 | 0 | FND-01 | — | n/a (infra) | shell | `pnpm install && pnpm check` | ❌ W0 | ⬜ pending |
| 00-01-02 | 01 | 0 | FND-02 | — | n/a | shell | `test -f svelte.config.js && grep -q '@sveltejs/adapter-vercel' svelte.config.js` | ❌ W0 | ⬜ pending |
| 00-02-01 | 02 | 1 | SEO-01, SEO-02 | T-00-meta | per-route `<title>` (50–60 char) and `<meta name=description>` (150–160 char) in initial HTML | integration | `pnpm test:html-audit` (curl preview + parse) | ❌ W0 | ⬜ pending |
| 00-02-02 | 02 | 1 | SEO-03, SEO-06 | T-00-meta | semantic HTML5 landmarks (`<main>`, `<nav>`, `<article>`, `<footer>`); OG + Twitter Card meta on every page | integration | `pnpm test:html-audit` | ❌ W0 | ⬜ pending |
| 00-03-01 | 03 | 2 | SCH-01, SCH-02 | T-00-jsonld | typed JSON-LD `@graph` emits without `schema-dts` errors; `</script>`-escaped serializer | unit | `pnpm test:unit -- jsonld` | ❌ W0 | ⬜ pending |
| 00-03-02 | 03 | 2 | SCH-03, SCH-04, SCH-05, SCH-06, SCH-07, SCH-08 | — | Organization/LocalBusiness/Service/Person/BreadcrumbList/WebSite/WebPage/FAQPage shapes valid | unit + integration | `pnpm test:schema` + Google Rich Results Test (CI fetch) | ❌ W0 | ⬜ pending |
| 00-04-01 | 04 | 3 | SEO-08 | T-00-crawl | robots.txt AI-bot Allow rules BEFORE `User-agent: *`; sitemap reference present | unit | `pnpm test:unit -- robots` | ❌ W0 | ⬜ pending |
| 00-04-02 | 04 | 3 | SEO-07 | — | sitemap.xml auto-generated from route manifest; referenced in robots.txt | integration | `pnpm test:html-audit -- --sitemap` | ❌ W0 | ⬜ pending |
| 00-04-03 | 04 | 3 | SEO-04, SEO-05 | — | canonical tag + hreflang (`nl`, `x-default`) scaffolding emit in initial HTML | unit | `pnpm test:unit -- canonical` | ❌ W0 | ⬜ pending |
| 00-05-01 | 05 | 4 | FND-03 (mdsvex collections), SEO-09 (visible dateModified on landing stub) | T-00-stub | 14 reserved stub routes return HTTP 200 with title/meta/canonical/JSON-LD; landing stub emits visible `<time datetime>` populated from build date | integration | `pnpm test:routes` (Playwright) + `pnpm test:html-audit -- --datemod` | ❌ W0 | ⬜ pending |
| 00-06-01 | 06 | 3 | FND-04, FND-05 | — | design-token CSS variables emit from `static/global.css` and pass typography/spacing token tests | unit | `pnpm test:unit -- tokens` | ❌ W0 | ⬜ pending |
| 00-07-01 | 07 | 1 | PRF-01 | — | `<EnhancedImage>` primitive renders with width/height + AVIF/WebP variants | unit | `pnpm test:unit -- image` | ❌ W0 | ⬜ pending |
| 00-08-01 | 08 | 5 | PRF-08 | — | Lighthouse CI budget gate skeleton wired; build fails on LCP > 2.5s / CLS > 0.1 / INP-proxy > 200ms | ci | `.github/workflows/ci.yml` runs `pnpm exec lhci autorun` | ❌ W0 | ⬜ pending |
| 00-08-02 | 08 | 5 | A11Y-05 | — | pa11y/axe CI gate runs on every preview deploy | ci | `pnpm exec pa11y-ci` | ❌ W0 | ⬜ pending |
| 00-08-03 | 08 | 5 | FND-07, FND-08, FND-09, FND-10, SEO-11 | T-00-htmlaudit | post-build HTML audit script catches: 0 or >1 `<h1>`, missing/dup meta, invalid canonical, unparseable JSON-LD, schema-dts type error, placeholder grep hit (Plan 06 owns FND-06 font delivery; not double-claimed here) | unit + ci | `pnpm test:html-audit` + `.github/workflows/ci.yml` | ❌ W0 | ⬜ pending |
| 00-09-01 | 09 | 6 | SEO-10 | T-00-deploy | GitHub repo + main-branch protection + Vercel auto-deploy + Search Console URL-prefix verification initiated (SEO-09 ownership: Plan 05; SEO-11 ownership: Plan 08; Plan 09 verifies CI gates run end-to-end against production) | manual + checklist | see Manual-Only Verifications | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` — `pnpm` workspace + scripts (`test`, `test:unit`, `test:html-audit`, `test:routes`, `test:schema`, `check`, `lint`, `build`)
- [ ] `vitest.config.ts` — unit test runner config (jsdom env for primitives, node env for emitters)
- [ ] `playwright.config.ts` — integration tests against `pnpm preview` + Vercel preview URL
- [ ] `tests/setup.ts` — shared fixtures (mock SITE_URL, sample route fixtures)
- [ ] `tests/unit/jsonld.test.ts` — stubs for SCH-01..08
- [ ] `tests/unit/canonical.test.ts` — stubs for SEO-07, SEO-08
- [ ] `tests/unit/robots.test.ts` — stubs for SEO-04
- [ ] `tests/unit/tokens.test.ts` — stubs for FND-04, FND-05
- [ ] `tests/unit/image.test.ts` — stubs for PRF-01
- [ ] `tests/integration/routes.spec.ts` — stubs for FND-03 (14 reserved routes)
- [ ] `tests/integration/html-audit.spec.ts` — stubs for SEO-01..03, SEO-05, SEO-06, FND-06..10
- [ ] `tests/scripts/html-audit.ts` — `curl -A`-based initial-HTML audit script for AI crawlers (OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended)
- [ ] `.github/workflows/ci.yml` — wire lhci + pa11y-ci + html-audit + schema-validate gates
- [ ] `lighthouserc.json` — LCP/CLS/INP budgets per route
- [ ] `.pa11yci` — WCAG 2.2 AA config

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GitHub repo `trinity-breath-healing` (private) exists with main-branch protection | FND-09 | One-time admin action against GitHub API/UI; no automated equivalent inside repo CI | (1) `gh repo view trinity-breath-healing --json visibility,defaultBranchRef` returns `private` + `main`. (2) Settings → Branches → `main` requires PR + 1 review + status checks. |
| Vercel project connected, auto-deploys `main` to `trinity-breath-healing.vercel.app`, preview URL per PR | FND-09 | Cross-vendor binding (GitHub ↔ Vercel) requires dashboard auth | (1) Push branch, open PR, observe preview URL in PR check. (2) Merge to main, observe production deploy at `trinity-breath-healing.vercel.app`. |
| Search Console URL-prefix verification (HTML-file method) initiated against Vercel-default URL | SEO-10 | Requires Google Account access for the practice; cannot be automated by CI | (1) Search Console → Add property → URL prefix → `https://trinity-breath-healing.vercel.app/`. (2) Download HTML verification file, drop into `static/`, commit, deploy. (3) Click Verify in Search Console UI. (4) Confirm "Ownership verified" green check. |
| `curl -A "OAI-SearchBot" https://trinity-breath-healing.vercel.app/` initial-HTML contains required tags | Phase 0 success criterion #1 | Requires live preview URL; CI script runs the curl + assertions but the final smoke is against the actual Vercel deployment | After preview deploy, run `pnpm test:html-audit -- --url https://<preview>.vercel.app --ua OAI-SearchBot` and inspect output. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 360s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
