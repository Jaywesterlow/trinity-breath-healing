# GSD Process Log — Trinity Breath & Healing

> Obsidian-ready log of every session, decision, and artifact produced.
> Reuse the process structure for future projects; swap in project-specific content.

---

## Project Summary

**Client:** Trinity Breath & Healing — aunt's solo breathwork/healing practice, Holland.
**Goal:** Dutch marketing website. Converts Instagram followers + cold searchers into a 30-min Google Meet booking, email, or phone call.
**Primary metric:** SEO + AEO discoverability — site must be *cited* by Google AI Overviews, ChatGPT, Perplexity, Claude, Dutch search.
**Secondary metric:** Conversion (booking CTA).
**Stack decided:** SvelteKit + Svelte 5 (runes) + Vercel + plain CSS + Resend EU + Cal.com + Plausible EU.

---

## Why It Took This Long (Honest Breakdown)

| Cost Driver | Why It Happened | Future Mitigation |
|-------------|-----------------|-------------------|
| Research phase (~3 sessions) | SEO/AEO research was done from scratch — what works for AI crawlers, Dutch search, wellness E-E-A-T, schema types | **This doc + seo-aeo.md eliminates this forever** |
| Stack decisions (~1 session) | Astro → SvelteKit pivot + Cloudflare → Vercel pivot, both discovered mid-session | Lock stack early via Obsidian template |
| TDD discipline | Every plan requires RED commit (failing test) before GREEN (implementation) — doubles commits | Still worth it; speeds debugging later |
| 14-route stub plan (Plan 05) | 28 files + Playwright tests + SEO-09 wiring = genuinely large | Can't compress much; real work |
| Worktree overhead | Parallel execution isolation setup/teardown adds ~15 min per wave | Use `--no-worktree` config for solo plans |
| Context limit collisions | Sessions hit 60–75% before plan completes, causing re-reads next session | Now enforced: wrap at 60%, stop at 75% |

**Bottom line:** ~40% of total cost was one-time research that now lives in `seo-aeo.md`. Future SEO projects start at Phase 0 execution, not research.

---

## Phase 0 — Foundation & SEO Scaffolding

**Status:** 7/9 plans done. Plan 05 (stub routes) in progress. Plans 08–09 pending.

### What "Foundation" means for an SEO/AEO site

AI crawlers and Google do NOT execute JavaScript by default. Every piece of content — H1, meta description, canonical, JSON-LD, nav, footer — must exist in the **raw HTML served on first request**. This is why Phase 0 exists before any visible UI: the scaffolding ensures that when Phase 1 adds the hero section, it slots into an already-correct HTML structure. Skip Phase 0 and you build the visible site on a broken SEO foundation.

### Plans Completed

#### Plan 01 — Repo Scaffold (Wave 0) ✓
**Commit prefix:** `feat(00-01)`
**What:** SvelteKit 5 (runes) project init, `@sveltejs/adapter-vercel`, TypeScript strict, Vitest 4 + jsdom, Playwright, GitHub Actions CI skeleton, `pnpm` workspace.
**Key decisions locked here:**
- `kit.alias` only (not `tsconfig.json` paths — they override SvelteKit's auto-generated `$lib`)
- `jsdom` installed explicitly (Vitest 4 no longer bundles it)
- `lang="nl"` on `<html>` — Dutch primary, hreflang-ready

#### Plan 02 — SEO Primitives (Wave 1) ✓
**Commit prefix:** `feat(00-02)`
**What:** `<PageTitle>` component (sets `<title>` in `<svelte:head>`), `<PageMeta>` (meta description + OG + Twitter Card + canonical + hreflang), `SITE_URL` constant, `BRAND` constants, `defaults.ts` (fallback title/description).
**Why matters for SEO:** Every page must have a unique 50–60 char title and unique 150–160 char meta description in initial HTML. These components enforce that at the component level.

#### Plan 07 — EnhancedImage Primitive (Wave 1) ✓
**Commit prefix:** `feat(00-07)`
**What:** `<EnhancedImage>` wrapper around `@sveltejs/enhanced-img`. Enforces required `alt`, `width`, `height` props at compile time. Prevents CLS (Cumulative Layout Shift) from missing dimensions.
**Why matters for SEO:** CLS > 0.1 tanks Core Web Vitals → tanks ranking. Image dimensions = zero CLS.

#### Plan 03 — JSON-LD / Schema Primitives (Wave 2) ✓
**Commit prefix:** `feat(00-03)`
**What:** `<JsonLd>` Svelte component, `buildGraph()` composer, `buildWebPage()`, `buildBreadcrumb()`, `makeServiceNode()`. Typed via `schema-dts` (TypeScript types from schema.org).
**Schema types shipped:** `Organization`, `LocalBusiness`, `ProfessionalService`, `WebPage`, `BreadcrumbList`, `Service`.
**Why matters for AEO:** Structured data is the primary mechanism by which AI engines (Google AI Overviews, Perplexity, ChatGPT plugins) extract and cite facts. No JSON-LD = no citations.

#### Plan 04 — robots.txt + sitemap.xml + Route Manifest (Wave 3) ✓
**Commit prefix:** `feat(00-04)`
**What:** `robots.txt` with explicit `Allow:` blocks for 8 AI crawlers before the wildcard `User-agent: *`. `sitemap.xml` prerendered endpoint (auto-generated from 15-route manifest). `check-robots.sh` CI gate.
**AI crawlers explicitly allowed:**
- `OAI-SearchBot`, `ChatGPT-User` (OpenAI)
- `PerplexityBot`, `Perplexity-User`
- `ClaudeBot`, `Claude-User` (Anthropic)
- `Google-Extended`, `Applebot-Extended`

#### Plan 06 — CSS Design Token System (Wave 3) ✓
**Commit prefix:** `feat(00-06)`
**What:** `static/global.css` with 25 CSS custom property tokens (colors, spacing, typography, radius). Self-hosted woff2 font stubs (DM Sans + Cormorant Garamond). `check-tokens.sh` + `no-shared-css.sh` enforcement scripts.
**Why matters for SEO:** No CSS-in-JS runtime = no JavaScript overhead = better INP (Interaction to Next Paint). Build-time CSS = zero runtime penalty.

### Plans In Progress

#### Plan 05 — 14 Reserved Stub Routes + SEO-09 (Wave 4) — INCOMPLETE
**Status:** RED commit done (`test(00-05)`). Implementation uncommitted in worktree `worktree-agent-af6422c664bad6c56`.
**What:** 28 files (14 × `+page.ts` + `+page.svelte`). Shared `<StubLayout>`. `STUB_META` map (14 distinct title/description pairs). Vite `__BUILD_DATE__` define for visible `dateModified` on landing page.
**Why matters:** All 14 reserved URLs must return HTTP 200 from day one (zero-301 migration guarantee — when Phase 2 deepens `/contact`, only body changes; URL + schema persist). Also closes SEO-09 (visible recency signal AI engines weight heavily).

### Plans Pending

| Plan | Wave | What |
|------|------|------|
| 08 | 5 | Full CI gates: `check-html.ts`, `validate-json-ld`, `check-initial-html-ai`, Lighthouse CI budgets, pa11y/axe |
| 09 | 6 | GitHub repo + branch protection + Vercel bind + Search Console verification + production smoke test (human checkpoints) |

---

## Phases 1–5 (Not Started)

| Phase | What | Visible? |
|-------|------|----------|
| 1 | Landing page — 8 sections in Figma frame order (hero, nav, Werkwijze, About, Behandelingen, Contact+booking, FAQ, footer) | **Yes — first visible UI** |
| 2 | Real content for `/privacyverklaring`, `/algemene-voorwaarden`, `/contact` | Yes |
| 3 | Vercel Function `/api/contact` → Resend EU; Cal.com inline embed; Plausible analytics | Partial |
| 4 | Dutch counsel review, hedge-language grep, AVG flow, NAP audit | No |
| 5 | Production deploy, Search Console, AI-crawler verification, 28-day CWV monitoring | No |

---

## Test Count History

| After Plan | Tests Passing |
|------------|--------------|
| 01 | 2/2 |
| 02+07 | ~20 |
| 03 | ~60 |
| 04 | ~100 |
| 06 | 127/127 |
| 05 (pending) | ~140+ (adds stub-meta + landing-date + Playwright integration) |

---

## Key Locked Decisions (Quick Reference)

| Decision | Why Locked |
|----------|-----------|
| SvelteKit not Astro | Vercel-native, Svelte 5 runes reactivity, simpler hydration model |
| Vercel not Cloudflare Pages | EU regions, native SvelteKit adapter, preview deploys per PR |
| Plain CSS not Tailwind | Zero build-tool churn; Svelte scoped styles sufficient |
| Cal.com not Calendly | Open source, Dutch locale, Google Meet auto-create, GDPR posture |
| Resend EU (`eu-west-1`) | EU data residency, React Email DX |
| Plausible EU (cookieless) | No cookie banner = no CLS/conversion hit |
| `schema-dts` typed JSON-LD | TypeScript types from schema.org → typos = compile errors |
| Per-route static `+page.ts` stubs | NOT dynamic `[stub]` routes — AI crawlers see distinct schema per URL |
| Skip `llms.txt` | No proven retrieval effect with any major AI crawler (2026-verified) |

---

## For Future Projects — Reusable GSD Pattern

```
Session 1: Lock stack from Obsidian template (no research needed if SEO/AEO)
Session 2: Plan 01 — scaffold + CI
Session 3: Plans 02+07 — SEO primitives + image primitive  
Session 4: Plans 03+04 — JSON-LD + robots/sitemap
Session 5: Plan 05 — stub routes (if multi-page)
Session 6: Plan 06 — CSS tokens
Session 7: Plan 08 — CI gates
Session 8: Plan 09 — deploy bind
→ Phase 1 begins (visible UI)
```

Enforce: one wave per session, wrap at 60% context, stop at 75%.
