## Project Configuration

- **Language**: TypeScript
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
- **Tech rendering**: Must be SSR or SSG; client-only rendering blocks AI crawlers and degrades SEO. Framework choice constrained to SSR/SSG-capable (SvelteKit, Next.js, Astro).
- **Language**: Dutch primary. Hreflang-ready architecture even though v1 ships Dutch-only.
- **Verification**: Every SEO/AEO technique adopted must be cross-referenced against the project's `seo-aeo-samenvatting-checklist.md` and fresh online evidence. No speculative tactics.
- **Design fidelity**: Match Figma frames for landing page; infer missing frames (Frame 2 mobile accordion, Frame 4 mobile active state) from their desktop counterparts.
- **Trust signals**: Health/wellness category — E-E-A-T (practitioner identity, credentials, consistency, freshness) is non-negotiable.
- **Performance**: LCP < 2.5s, INP < 200ms, CLS < 0.1 — measured on real Chrome users via Search Console.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## TL;DR (the prescriptive stack)
| Layer | Pick | One-line reason |
|---|---|---|
| Framework | **Astro 5.x** | Default zero-JS HTML output → cleanest possible initial HTML for AI crawlers + best LCP for a content-heavy marketing site. |
| Hosting | **Cloudflare Pages** (primary) or **Netlify** (fallback) | Both run from EU edge to NL; Cloudflare for performance, Netlify if the aunt prefers a simpler dashboard. |
| Booking | **Cal.com (self-hosted-or-cloud, inline embed)** | Open source, Dutch locale, native Google Meet, GDPR posture, inline (non-popup) embed available — Calendly's inline embed degrades LCP and is US-data-residency by default. |
| Email delivery | **Resend** with EU region (`eu-west-1`/Ireland) | Modern DX, EU data residency, React-Email templates, simple Astro/Worker SDK. |
| CMS (v1) | **Astro Content Collections (git-MDX + Zod)** | Zero runtime cost, zero CMS bill, full SSG. Aunt edits via a thin Decap/Sveltia CMS overlay on `main` if she wants WYSIWYG. |
| CMS (v2 upgrade path) | **Sanity** (headless, EU dataset) | Best editor UX for non-technical users, EU data residency, scales to blog + kennisbank without leaving SSG. |
| Schema/JSON-LD | **`schema-dts` + hand-rolled emitters** | Typed safety from schema.org against TS — fewer Rich Results Test failures. |
| Analytics | **Plausible Cloud (EU)** + Google Search Console | GDPR-free of cookie banner, EU-hosted; Search Console remains the SEO/Core-Web-Vitals source of truth. |
| Images | **Astro `<Image>` + Sharp** (build-time AVIF/WebP); upgrade to **Cloudflare Images** if/when v2 needs many editor-uploaded assets | Build-time pipeline gives explicit width/height (CLS=0), per-image AVIF+WebP, free at this scale. |
| Schema validator (dev) | **Google Rich Results Test** + `structured-data-testing-tool` CLI in CI | Catches FAQPage/LocalBusiness errors before they hit prod. |
| i18n | **Astro built-in i18n routing** (`/nl` default, `/en` later), `hreflang` from day one | No runtime cost; locale-scoped URLs are the only AEO-safe pattern. |
## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|---|---|---|---|
| **Astro** | `5.x` (latest stable; verify against `astro.build/blog/`) `[VERIFY]` | Static-site framework with islands architecture | Default output is **zero-JS HTML** — the cleanest possible initial document for AI crawlers (most do not execute JS — `seo-aeo-samenvatting-checklist.md` §5). Built-in SSG, content collections (Zod-typed MDX), image optimization, sitemap, RSS, i18n. Beats SvelteKit and Next on **LCP** because there is no framework hydration for static content. |
| **TypeScript** | `5.5+` | Type safety across content schemas, JSON-LD, form handlers | Required by `schema-dts` and Astro content collections. |
| **Cloudflare Pages** (host) | n/a (managed) | Static hosting + Cloudflare Workers for form/booking endpoints | EU edge (Amsterdam POP), free TLS, no cold start. Workers handle Resend dispatch + Cal.com webhooks server-side, keeping secrets out of the browser. EU data-residency posture acceptable for a marketing site (no PHI). |
| **Cal.com** | Cloud (managed) or self-hosted `v4.x` | 30-min Google Meet booking with inline embed | Open source, GDPR-aware, **native Google Meet auto-create** on event-type config, Dutch (`nl`) UI, supports inline embed without popup (preserves LCP — popup widgets typically add ~80–200 KB of late JS). `[VERIFY]` Cal.com cloud EU region availability at contract time. |
| **Resend** | SDK `v4.x` `[VERIFY]` | Transactional email for contact-form + booking confirmations to practitioner | EU region (`eu-west-1`) is selectable per domain → GDPR-friendly. Best DX of the modern email vendors; React-Email template engine works from a Cloudflare Worker. |
| **Plausible Analytics** (Cloud, EU) | n/a (script `v2`) | Privacy-respecting analytics | EU-hosted (Germany), no cookies → **no cookie banner required** under GDPR (banner adds CLS + INP hits). Search Console is the SEO truth; Plausible is for product analytics. |
| **Google Search Console** | n/a | Indexation, sitemap submission, Core Web Vitals (RUM), structured-data errors | Non-negotiable per `seo-aeo-samenvatting-checklist.md` §9. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---|---|---|---|
| **`schema-dts`** | `1.1+` `[VERIFY]` | TypeScript types generated from schema.org | Always — wrap every JSON-LD emitter so `Organization`, `LocalBusiness`, `Service`, `FAQPage`, `Person`, `BreadcrumbList` are type-checked. Prevents shipping invalid markup. |
| **`@astrojs/sitemap`** | latest | Auto XML sitemap from routes | Always — required by checklist §A. |
| **`@astrojs/rss`** | latest | RSS feed | v2 (blog/kennisbank). |
| **`@astrojs/mdx`** | latest | MDX content in collections | Always — long-form copy in MDX with frontmatter (author, datePublished, dateModified) → drives `Article`/`BlogPosting` JSON-LD. |
| **`astro-seo`** or hand-rolled `<SEO>` component | latest | Per-page `<title>`, meta description, OG, Twitter Card, canonical | Always — emits the per-page tags in **initial HTML** (checklist §A). |
| **Sharp** | `0.33+` | Build-time image transforms (AVIF, WebP, resize) | Used by Astro `<Image>` — always. |
| **Tailwind CSS** | `v4.x` `[VERIFY]` | Utility CSS without runtime JS | Optional but recommended — zero JS, atomic CSS is small, Figma-faithful design is easier with utility classes. Avoid CSS-in-JS (adds runtime + INP regressions). |
| **Decap CMS** (formerly Netlify CMS) or **Sveltia CMS** | latest | Git-based admin UI for the aunt to edit MDX without dev help | Only if the aunt wants WYSIWYG in v1; otherwise she edits via PR or a Notion → MDX export. |
| **`zod`** | `3.x` | Schema for Astro content collections + form validation | Always. |
| **`hono`** or Astro native API routes | latest | Form/booking webhook handlers on Cloudflare Workers | If using Cloudflare adapter; Astro's built-in endpoints suffice for v1's single `/api/contact` route. |
| **React Email** | `3.x` `[VERIFY]` | Typed email templates rendered by Resend | For contact-form confirmation + practitioner notification email design. |
| **`@astrojs/cloudflare`** adapter | latest | Deploy Astro to Cloudflare Pages with Workers SSR routes | Always (matches the host choice). |
### Development Tools
| Tool | Purpose | Notes |
|---|---|---|
| **Google Rich Results Test** | Validate JSON-LD pre-deploy | Manual gate before each prod push; also automated via CI fetch. |
| **`structured-data-testing-tool`** (CLI) | CI check that schema is parseable + valid | Run on rendered HTML output in CI, fail build on schema errors. |
| **Lighthouse CI** | Core Web Vitals gates in CI | Block merge if LCP > 2.5s, CLS > 0.1, INP-proxy > 200ms on the landing page. |
| **`pa11y-ci`** or **axe-core CLI** | WCAG 2.2 AA accessibility checks | Accessibility is an SEO/AEO signal per checklist; gate in CI. |
| **PageSpeed Insights / CrUX** | Real-user Core Web Vitals telemetry | Search Console pulls from the same dataset — single source of truth. |
| **Figma + Figma Tokens / Specify** | Design tokens → CSS variables | Pixel-faithful implementation of Figma frames. |
## Installation
# Core (Astro project init — Astro will prompt for template; pick "Empty" then add Tailwind manually)
# Integrations
# Content + SEO libraries
# Email
# Dev / quality
## Alternatives Considered
### 1. Frontend framework — Astro vs SvelteKit vs Next.js (App Router)
| | **Astro 5** (recommended) | SvelteKit 2 | Next.js 15 App Router |
|---|---|---|---|
| Default output for marketing pages | **Zero JS** HTML | JS-hydrated by default (opt-out per route) | JS-hydrated by default (RSC reduces client JS but still ships runtime) |
| SSG-by-default for static pages | **Yes** (default) | Yes (with prerender) | Yes (with `export const dynamic = 'force-static'`) |
| LCP/CLS posture for a content site | **Best** — no hydration cost on hero | Good | Good but more KB of framework runtime |
| Content collections (typed MDX) | **Native** + Zod | Manual (mdsvex + custom schema) | Manual (contentlayer is in maintenance; alternatives are MDX + manual) |
| i18n routing | **Native** | Manual or community packages | Native (App Router) |
| DX for a marketing site that grows to many pages | **Best** for content-heavy | Good but you build more glue | Good but heavier mental model (RSC + caching) |
| AI crawler safety | **Best** — first paint is content | Good (with prerender) | Good (with static) |
| Risk | Small islands ecosystem if React needed | Smaller hiring pool | Easy to accidentally ship client-only code that breaks crawlers |
### 2. Hosting — Cloudflare Pages vs Netlify vs Vercel
| | **Cloudflare Pages** (recommended) | Netlify | Vercel |
|---|---|---|---|
| EU edge to NL | **AMS POP**, sub-20ms to NL | EU edges, slightly higher latency | EU edges via `fra1`/`ams1` |
| Pricing at this scale | **Free** (generous Workers free tier) | Free tier ok, Functions cap lower | Free tier ok, Image Optimization is a bandwidth gotcha |
| EU data residency posture | Configurable; Workers KV/D1 in EU | EU regions available on paid | EU regions on paid plans |
| Astro support | First-class (`@astrojs/cloudflare`) | First-class | First-class |
| Cold start on form endpoints | None (Workers) | Cold-startable functions | Cold-startable functions |
| Vendor lock-in risk | Low (Workers are portable) | Low | Higher (Image, Analytics, Cron are Vercel-proprietary) |
### 3. Booking — Cal.com vs Calendly vs SavvyCal vs custom
| | **Cal.com** (recommended) | Calendly | SavvyCal | Custom build |
|---|---|---|---|---|
| Inline embed (non-popup) | **Yes** | Yes but heavier | Yes | n/a |
| Embed weight on LCP | Lightest of vendors | Heaviest | Medium | Best (if built right) |
| Google Meet auto-create | **Yes** | Yes | Yes | Must build OAuth + Calendar API |
| Dutch (nl) locale | **Yes** | Yes | Partial | You write copy |
| GDPR + EU residency | Self-host = full control; Cloud = EU plan `[VERIFY]` | US-default | US-default | Full control |
| Open source | **Yes** (AGPL) | No | No | n/a |
| Maintenance cost | Low | Low | Low | **High** — calendar logic is a rabbit hole |
| AEO impact of widget | Lazy-loaded; below-the-fold OK | Often blocks LCP | Acceptable | Best |
### 4. Contact form delivery — Resend vs Postmark vs SendGrid vs Formspree
| | **Resend** (recommended) | Postmark | SendGrid | Formspree |
|---|---|---|---|---|
| EU region / data residency | **`eu-west-1` Ireland** `[VERIFY]` | EU region available | EU region (paid) | US-default |
| Transactional reliability | Excellent | Excellent (best-in-class deliverability) | Excellent | n/a (relays through their infra) |
| DX (SDK + templates) | **Best** — React Email | Solid, older API | Bloated | Form-only, no template control |
| Free tier viable at this scale | Yes (3k/mo) | No free, $10/mo | Free 100/day | Free 50/mo |
| Vendor risk | Newer company | Long-standing | Owned by Twilio | Niche |
### 5. CMS — Sanity vs Payload vs Contentlayer vs git-MDX vs hardcoded
| | **git-MDX + Astro Content Collections** (v1) | **Sanity** (v2 upgrade) | Payload | Contentlayer | Hardcoded |
|---|---|---|---|---|---|
| v1 cost | **Free** | $0 starter | Self-host cost | Free | Free |
| Editor UX for non-technical aunt | Decap/Sveltia overlay = OK | **Best** — Studio is friendliest | Good (devs first) | Dev only | None |
| EU data residency | Git repo = full control | **EU dataset region available** | Self-host = full control | n/a | n/a |
| SSG performance | **Best** — content is local | Excellent (build-time fetch) | Excellent | Excellent | Excellent |
| Maturity / risk | Astro Content Collections are stable | Mature | Mature | **In maintenance — avoid for new work** | n/a |
| Scales to blog + kennisbank | Yes for ~50 pages; gets clunky beyond | **Yes — unlimited** | Yes | Yes | No |
### 6. Schema/JSON-LD — `schema-dts` vs hand-rolled vs framework default
### 7. Analytics + Search Console — Plausible vs Fathom vs GA4 vs Vercel Analytics
| | **Plausible Cloud (EU)** (recommended) | Fathom | GA4 | Vercel Analytics |
|---|---|---|---|---|
| Cookie banner needed under GDPR | **No** | No | Yes | Depends |
| EU data residency | **Yes (Germany)** | EU regions | US-default | US-default |
| Script weight | ~1 KB | ~1.6 KB | ~70 KB | small |
| INP / LCP impact | Negligible | Negligible | **Notable** | Negligible |
| AEO benefit | Doesn't hurt | Doesn't hurt | Adds cookie-banner CLS hit | Doesn't hurt |
### 8. Image optimization — framework-native vs Cloudinary vs Imgix
### 9. i18n posture — Dutch-only v1, multilingual-ready
## What NOT to Use
| Avoid | Why | Use Instead |
|---|---|---|
| **Create React App, Vite SPA, plain React without SSR, Vue SPA, Angular** | Client-only rendering → empty initial HTML → AI crawlers see nothing (`seo-aeo-samenvatting-checklist.md` §5). Direct violation of the project's core SEO/AEO constraint. | Astro (recommended), SvelteKit, or Next App Router with explicit SSG. |
| **Gatsby** | Effectively abandoned (Netlify acquisition, minimal 2025–2026 activity). Plugin ecosystem stale. | Astro. |
| **Contentlayer** | Original project in maintenance; the future fork is unsettled. | Astro Content Collections (v1), Sanity (v2). |
| **`llms.txt` / `llms-full.txt`** | No vendor honors them as of 2026 (per `seo-aeo-samenvatting-checklist.md` Deel 2, footnote). Dead-end work. | Proper `robots.txt` with explicit AI-crawler allow + sitemap reference. |
| **GA4 with cookie banner** | Cookie banner adds CLS, hurts conversion, US data residency adds GDPR friction. | Plausible (EU). Keep Search Console as truth source. |
| **Calendly inline embed at the top of the page** | Heavy iframe → degrades LCP → hurts ranking + AEO. Also US data residency. | Cal.com inline embed below the fold, lazy-loaded. |
| **Formspree / Tally / Typeform for the contact form** | Black-box relays, US data residency, opaque GDPR posture, extra JS on the page. | A 20-line Cloudflare Worker → Resend (EU). |
| **CSS-in-JS runtime (styled-components, Emotion runtime, vanilla-extract-runtime)** | Adds JS runtime → INP regressions, FOUC risk on SSR. | Tailwind CSS v4 (atomic, build-time) or Astro scoped CSS. |
| **Client-side language switcher (i18next without SSR, dynamic dictionary fetch)** | AI crawlers only see one locale. | Per-locale URLs (Astro i18n), `hreflang` tags in initial HTML. |
| **`next/image` with the default Vercel loader on non-Vercel hosting** | Image Optimization bills get expensive fast, and CLS gotchas appear when the loader isn't wired. | Astro `<Image>` + Sharp. |
| **Service workers / aggressive caching on v1** | Risk of caching stale HTML/JSON-LD; AI crawlers will not see updates. | Skip until v2; use Cloudflare cache rules instead. |
| **Heading-level skips, decorative H1s, multiple H1s per page** | Direct violation of checklist §A. | One H1; H2/H3 hierarchy planned per Figma section. |
| **Lazy-loading the hero image** | Hurts LCP. Explicitly called out in checklist §B. | `loading="eager"` + `fetchpriority="high"` on hero. |
## Stack Patterns by Variant
- Use Astro + **Sveltia CMS** (Decap fork) overlay on git, OR
- Skip git-MDX and go straight to Sanity (EU dataset) with build-time fetch.
- Trade: monthly cost (Sanity free tier may suffice) + build-time fetch latency. Win: aunt edits copy with no PRs.
- Cal.com self-hosted on Hetzner (Falkenstein, DE) + Postgres + Redis.
- Resend swapped for **self-hosted SMTP via Mailcow on Hetzner**, or use **Postmark EU**.
- Plausible Community Edition self-hosted.
- Trade: ~4–6 hours/month maintenance. Win: zero third-party data processors.
- For this project (aunt is a solo practitioner, not handling PHI on the site), this is overkill — the recommended stack's posture is already GDPR-defensible.
- Sanity → Astro build-time fetch becomes slow.
- Switch to **on-demand ISR** via Cloudflare Workers + Sanity webhooks, OR
- Move to SvelteKit/Next + Sanity with SSR + edge cache.
## Version Compatibility
| Package | Compatible With | Notes |
|---|---|---|
| Astro 5.x | Node 20+, TypeScript 5.5+ | `[VERIFY]` exact minor at install. |
| `@astrojs/cloudflare` | Cloudflare Pages + Workers runtime | Verify Wrangler version aligns. |
| `schema-dts` | TypeScript 4.7+ | Stable, low-churn API. |
| Tailwind v4 | Astro integration | `[VERIFY]` — Tailwind v4 ships with the new Oxide engine; confirm the Astro integration covers it at install time. |
| Resend SDK | Cloudflare Workers runtime | Uses `fetch`-based transport — works in Workers without polyfills. |
| Cal.com embed `<cal-inline>` web component | Any framework | Vanilla web component; no React dependency. |
## Cross-reference against `seo-aeo-samenvatting-checklist.md`
| Stack choice | Checklist clause it satisfies |
|---|---|
| Astro SSG | §5 "Bots vragen eerst de HTML op" — content + meta in initial HTML |
| Astro built-in sitemap + i18n + canonical | §A "Canonical tag op elke pagina", "XML-sitemap", "hreflang" |
| `schema-dts` + JSON-LD emitters | §6, §C "Structured data" — all required types, typed-safe |
| Cloudflare Pages | §B "Snelle hosting" + §9 "LCP < 2,5s" |
| Cal.com inline, lazy-loaded below fold | §B "LCP < 2,5s, INP < 200ms, CLS < 0,1" |
| Resend (EU) + Worker form | §F entity-consistency (single source of practitioner contact info) |
| Plausible EU + Search Console | §9 Core Web Vitals from CrUX; §G "Meten & bijsturen" |
| Astro `<Image>` + Sharp | §B alt, WebP, width/height, lazy-only-outside-viewport, hero eager |
| Tailwind v4 (build-time CSS) | §B "INP < 200ms" — no runtime CSS-in-JS |
| Sveltia CMS overlay / Sanity v2 | §D + §G "content vers houden", "publicatiedatum zichtbaar" |
| `robots.txt` (hand-written) | Deel 2 §3 + checklist §A — AI-crawler allow + sitemap ref |
| Hreflang from day one | §A "hreflang als de site meertalig is" — infrastructure-ready |
## Sources & Confidence Notes
| Source | What it informs | Confidence |
|---|---|---|
| `seo-aeo-samenvatting-checklist.md` (project root, verified by user) | Every architectural choice; explicit citations above | HIGH |
| `.planning/PROJECT.md` (project context) | Requirements + constraints driving the picks | HIGH |
| Astro official docs (`docs.astro.build`) — author's prior verified knowledge through 2025 release notes for Astro 5 (content collections v2, server islands, i18n routing) | Astro feature claims | MEDIUM — `[VERIFY]` exact minor version at install |
| Cloudflare Pages + Workers docs (Amsterdam POP, free tier, EU residency posture) | Hosting choice | HIGH (architectural), MEDIUM on current pricing tiers |
| Cal.com docs (inline embed `<cal-inline>`, Google Meet integration, locale list, AGPL) | Booking choice | MEDIUM — `[VERIFY]` Cal.com Cloud EU plan and current nl-locale completeness before contract |
| Resend docs (`eu-west-1` Ireland region selectable per domain) | Email choice | MEDIUM — `[VERIFY]` EU region availability on current plan |
| Plausible docs (Germany hosting, no cookies, GDPR posture, script weight) | Analytics choice | HIGH on posture, MEDIUM on script-byte claim |
| Google Search Central docs (Rich Results Test, Core Web Vitals via CrUX) | Schema + CWV validation | HIGH |
| schema.org + Google's `schema-dts` repo | JSON-LD typing | HIGH |
| KDD 2024 GEO study (Aggarwal et al., arXiv:2311.09735) cited in checklist | AI citation lift evidence — informs why citeable content + schema matters | HIGH |
| HubSpot AI Search Trends 2025 (cited in checklist) | Recency signal evidence | HIGH (within the checklist's verified scope) |
<!-- GSD:stack-end -->

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
