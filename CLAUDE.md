## Project Configuration

- **Language**: TypeScript (`^6.0`)
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, vitest

---

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Trinity Breath & Healing**

Marketing website for Trinity Breath & Healing — a Holland-based breathwork and healing practice run by the user's aunt. The practice helps clients release trauma and trauma-rooted physical barriers through breathwork sessions. The site is the digital storefront: it must welcome both existing followers (Instagram audience seeking treatment) and people who have never heard of the modality, and convert them into a 30-minute Google Meet booking, an email contact, or a phone call.

**Core Value:** **SEO + AEO discoverability of trustworthy, citeable content** — the site must be found and *cited* by Google, AI Overviews, ChatGPT, Perplexity, and Dutch-language search. Visual fidelity to the Figma design matters, but if SEO/AEO underperforms the project has failed. Every implementation choice is judged first on its SEO/AEO impact, then on aesthetics.

### Constraints

- **Discoverability**: SEO + AEO are primary success metrics — overrides aesthetic preferences when in conflict.
- **Tech rendering**: SSG via SvelteKit prerender; client-only rendering blocks AI crawlers and degrades SEO.
- **Language**: Dutch primary. Hreflang-ready architecture even though v1 ships Dutch-only.
- **Verification**: Every SEO/AEO technique adopted must be cross-referenced against `Insights/seo-aeo-samenvatting-checklist.md` and fresh online evidence. No speculative tactics.
- **Design fidelity**: Match Figma frames for landing page; infer missing frames (Frame 2 mobile accordion, Frame 4 mobile active state) from their desktop counterparts.
- **Trust signals**: Health/wellness category — E-E-A-T (practitioner identity, credentials, consistency, freshness) is non-negotiable.
- **Performance**: LCP < 2.5s, INP < 200ms, CLS < 0.1 — measured on real Chrome users via Search Console.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:actual package.json + svelte.config.js -->
## Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **SvelteKit 2 + Svelte 5** (runes mode) | `@sveltejs/kit ^2.63`, fully prerendered SSG |
| Hosting | **Vercel** | `@sveltejs/adapter-vercel`, `regions: ['fra1']` (EU), Node 20.x runtime |
| Images | **`@sveltejs/enhanced-img`** | Build-time AVIF/WebP + responsive srcset; must come before `sveltekit()` in vite plugins |
| CSS | **Tailwind v4 + shadcn-svelte** | Design tokens live in `src/app.css` `@theme` block, processed via Vite. Was "Plain CSS, locked per CONTEXT.md D-09" — **D-09 superseded 2026-07-12** by the Tailwind v4 + shadcn migration (Slice 1): the plain-CSS-only lock was reversed to adopt shadcn's component model without hand-rolling equivalents; historical rationale for the original lock remains in `.planning/STATE.md` and `.planning/REQUIREMENTS.md` (FND-02) unedited. |
| Content | **mdsvex** | `.svx` files; `mdsvex ^0.12` |
| Schema/JSON-LD | **`schema-dts`** | TypeScript types from schema.org; wrap all JSON-LD emitters |
| Validation | **`zod`** | Form + content schema validation |
| Analytics | **Plausible (EU)** + Google Search Console | No cookie banner (GDPR); Search Console is CWV source of truth |
| Booking | **Cal.com** (inline embed) | Below fold, lazy-loaded; Dutch locale; native Google Meet |
| Email | **Resend** (EU region) | `eu-west-1`; contact form + booking confirmations |

### Dev / CI Tools

| Tool | Purpose |
|---|---|
| `pa11y-ci` | WCAG 2.2 AA accessibility gate |
| `structured-data-testing-tool` | JSON-LD parse + validity in CI |
| `@lhci/cli` | Lighthouse CI — LCP/CLS/INP gates on landing page |
| Playwright | Integration / route tests |
| Vitest | Unit tests |
| Google Rich Results Test | Manual JSON-LD validation pre-deploy |

### Audit Scripts (`package.json`)

- `npm run audit:html` — HTML structure checks
- `npm run audit:json-ld` — JSON-LD validation
- `npm run audit:initial-html-ai` — AI crawler initial HTML check
- `npm run audit:placeholders` — find placeholder content
- `npm run test:schema` — structured data testing tool
<!-- GSD:stack-end -->

## What NOT to Use

| Avoid | Why |
|---|---|
| **Client-only SPA (React, Vue, Angular without SSR)** | Empty initial HTML → AI crawlers see nothing. Core SEO/AEO violation. |
| **CSS-in-JS runtime** | INP regressions, FOUC risk. Use plain CSS (SvelteKit scoped CSS). |
| **GA4 with cookie banner** | Cookie banner adds CLS, hurts conversion, US data residency. Use Plausible EU. |
| **Calendly embed at top of page** | Heavy iframe degrades LCP. Use Cal.com inline below fold. |
| **Formspree / Tally / Typeform** | US data residency, opaque GDPR posture, extra JS. Use a server endpoint → Resend EU. |
| **Client-side i18n (dynamic dictionary fetch)** | AI crawlers only see one locale. Use per-locale URLs + `hreflang` in initial HTML. |
| **Service workers / aggressive caching (v1)** | Risk of caching stale HTML/JSON-LD; AI crawlers miss updates. Skip until v2. |
| **Lazy-loading the hero image** | Hurts LCP. Use `loading="eager"` + `fetchpriority="high"` on hero. |
| **Heading-level skips, multiple H1s** | Direct checklist §A violation. One H1; H2/H3 hierarchy per section. |
| **`llms.txt` / `llms-full.txt`** | No vendor honors them (2026). Use proper `robots.txt` + sitemap instead. |

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
