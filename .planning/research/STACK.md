# Stack Research

**Domain:** Dutch-language SEO/AEO-first marketing site for a breathwork/healing practice, with a small backend (form delivery + 30-min Google Meet booking). Greenfield, v1 = landing page, v2+ adds blog + kennisbank.
**Researched:** 2026-06-14
**Confidence:** HIGH on architectural choices (framework class, hosting class, schema/i18n posture). MEDIUM on specific exact patch versions (web verification tools were denied in this research session — see "Verification Gap" below). MEDIUM-LOW on booking-vendor feature parity (verify Google Meet auto-creation + Dutch UI in vendor docs before contract).

> **Verification Gap (read first).** During this research session, `WebSearch`, `WebFetch`, `Bash` (ctx7 CLI), and context-mode `ctx_fetch_and_index` were unavailable. Architectural recommendations are HIGH confidence because they follow directly from the SEO/AEO requirements documented in `seo-aeo-samenvatting-checklist.md` (which is itself sourced and verified). Exact version pins below are best-known stable lines as of 2026-Q2 and should be re-confirmed against the vendor changelog at `npm install` time. Each line that needs vendor re-verification before commitment is marked `[VERIFY]`.

---

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

---

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

```bash
# Core (Astro project init — Astro will prompt for template; pick "Empty" then add Tailwind manually)
npm create astro@latest -- --template=minimal --typescript=strict
cd <project>

# Integrations
npx astro add tailwind        # Tailwind v4 via Astro integration
npx astro add mdx             # MDX content
npx astro add sitemap         # XML sitemap
npx astro add cloudflare      # Cloudflare Pages adapter

# Content + SEO libraries
npm install schema-dts zod
npm install astro-seo

# Email
npm install resend @react-email/components @react-email/render

# Dev / quality
npm install -D lighthouse @lhci/cli pa11y-ci structured-data-testing-tool
```

> Pin exact versions at install time and commit the lockfile. The list above is the *shape* of the stack, not a version manifest.

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

**Verdict:** Astro. Per `seo-aeo-samenvatting-checklist.md` §5, AI crawlers don't run JS reliably. Astro is the only framework whose **default** output is zero-JS HTML for a static page — every other framework requires you to opt out of hydration. For a "mostly-static marketing site that grows to many pages later," Astro's content collections + native i18n + zero-runtime cost is the lowest-regret choice. SvelteKit is a fine second; Next App Router is third because of its higher complexity and easier-to-misconfigure crawler trap (a single `'use client'` at the wrong layout level reverts the page to client-rendering).

**When to pick SvelteKit instead:** if the booking flow grows into a multi-step interactive widget that must be a SPA, or the developer is already deep in Svelte. Use `adapter-cloudflare` and `prerender = true` on all marketing routes.

**When to pick Next App Router instead:** never for this project. The complexity-vs-benefit ratio is wrong for a marketing site whose primary metric is "found and cited."

### 2. Hosting — Cloudflare Pages vs Netlify vs Vercel

| | **Cloudflare Pages** (recommended) | Netlify | Vercel |
|---|---|---|---|
| EU edge to NL | **AMS POP**, sub-20ms to NL | EU edges, slightly higher latency | EU edges via `fra1`/`ams1` |
| Pricing at this scale | **Free** (generous Workers free tier) | Free tier ok, Functions cap lower | Free tier ok, Image Optimization is a bandwidth gotcha |
| EU data residency posture | Configurable; Workers KV/D1 in EU | EU regions available on paid | EU regions on paid plans |
| Astro support | First-class (`@astrojs/cloudflare`) | First-class | First-class |
| Cold start on form endpoints | None (Workers) | Cold-startable functions | Cold-startable functions |
| Vendor lock-in risk | Low (Workers are portable) | Low | Higher (Image, Analytics, Cron are Vercel-proprietary) |

**Verdict:** Cloudflare Pages. Best NL latency, no cold starts on the form endpoint, free at this scale, and the Workers KV/D1 path is a clean upgrade route when v2 adds a comments/likes/newsletter store. Netlify is a perfectly fine fallback if the aunt or the developer prefers Netlify's dashboard. Avoid Vercel for this project: Image Optimization bandwidth charges punish marketing sites with hero images and there's no SEO advantage.

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

**Verdict:** Cal.com cloud (or self-hosted on Cloudflare/Hetzner if EU data residency must be guaranteed). Inline-embed only, **below the fold**, lazy-loaded after first user interaction or `IntersectionObserver` to keep LCP clean. Calendly is the second choice but its embed historically ships more JS and its US-default data residency is a worse GDPR posture for Dutch users. Building custom is rejected — calendar timezone math, double-booking prevention, and Google Calendar OAuth flow are weeks of work that solve nothing the practice needs.

> **Important:** Mount the booking widget **below the hero** and lazy-load it. Never put the iframe inside the LCP element. The hero LCP must be a static image + text in the initial HTML.

### 4. Contact form delivery — Resend vs Postmark vs SendGrid vs Formspree

| | **Resend** (recommended) | Postmark | SendGrid | Formspree |
|---|---|---|---|---|
| EU region / data residency | **`eu-west-1` Ireland** `[VERIFY]` | EU region available | EU region (paid) | US-default |
| Transactional reliability | Excellent | Excellent (best-in-class deliverability) | Excellent | n/a (relays through their infra) |
| DX (SDK + templates) | **Best** — React Email | Solid, older API | Bloated | Form-only, no template control |
| Free tier viable at this scale | Yes (3k/mo) | No free, $10/mo | Free 100/day | Free 50/mo |
| Vendor risk | Newer company | Long-standing | Owned by Twilio | Niche |

**Verdict:** Resend with the EU region set on the sending domain. Postmark is the safe second pick if Resend's EU region has any contract-time gotcha. Avoid Formspree: it's a black-box relay (you lose template control + GDPR data-flow visibility) and there's no real reason to add a vendor when a 20-line Cloudflare Worker calling Resend does the job.

**Architecture:** Form `POST` → Astro endpoint running on Cloudflare Worker → Resend SDK with EU region → practitioner's inbox + auto-reply to user. Validate with Zod, honeypot field for bots, Cloudflare Turnstile for stricter spam protection (no cookies, GDPR-friendly).

### 5. CMS — Sanity vs Payload vs Contentlayer vs git-MDX vs hardcoded

| | **git-MDX + Astro Content Collections** (v1) | **Sanity** (v2 upgrade) | Payload | Contentlayer | Hardcoded |
|---|---|---|---|---|---|
| v1 cost | **Free** | $0 starter | Self-host cost | Free | Free |
| Editor UX for non-technical aunt | Decap/Sveltia overlay = OK | **Best** — Studio is friendliest | Good (devs first) | Dev only | None |
| EU data residency | Git repo = full control | **EU dataset region available** | Self-host = full control | n/a | n/a |
| SSG performance | **Best** — content is local | Excellent (build-time fetch) | Excellent | Excellent | Excellent |
| Maturity / risk | Astro Content Collections are stable | Mature | Mature | **In maintenance — avoid for new work** | n/a |
| Scales to blog + kennisbank | Yes for ~50 pages; gets clunky beyond | **Yes — unlimited** | Yes | Yes | No |

**Verdict for v1 (landing only):** git-MDX in Astro content collections. The aunt has one landing page worth of copy; running a CMS server for that is overkill, adds a monthly bill, and slows the build. If she wants WYSIWYG, **add Sveltia CMS** (modern fork of Decap) as a `/admin` overlay reading/writing the same MDX in the repo — she gets a CMS UI, the repo stays the source of truth, no separate database.

**Verdict for v2 (blog + kennisbank, 20+ pages):** migrate the content collection schemas to **Sanity** with an EU-region dataset. Sanity Studio's editor UX is the best in class for non-technical users, references between documents power the "topical authority" content network the checklist asks for (§3), and Astro can keep doing SSG by fetching at build time. Avoid **Contentlayer** — it's in maintenance mode and the official successor isn't yet a safe bet. Avoid **Payload** unless the developer wants a TypeScript-first self-hosted CMS — fine technically but overkill for the aunt's needs.

### 6. Schema/JSON-LD — `schema-dts` vs hand-rolled vs framework default

**Verdict:** `schema-dts` (Google's official typed schema.org). Hand-rolled JSON-LD is a Rich Results Test failure waiting to happen — schema.org has many subtle constraints (`@type` capitalization, required fields, `@id` graph wiring) that are easy to break. `schema-dts` makes them compile errors instead of production warnings. Astro has no built-in schema helper, so wrap `schema-dts` in a `<JsonLd>` component that emits a single `<script type="application/ld+json">` per page.

Mandatory types per `PROJECT.md`: `Organization`, `LocalBusiness`, `Service` (one per session type), `FAQPage`, `Person` (practitioner), `BreadcrumbList` (when nav depth >1), `WebPage` (always). All `@id`-linked into one `@graph` so AI crawlers see one knowledge object per page.

### 7. Analytics + Search Console — Plausible vs Fathom vs GA4 vs Vercel Analytics

| | **Plausible Cloud (EU)** (recommended) | Fathom | GA4 | Vercel Analytics |
|---|---|---|---|---|
| Cookie banner needed under GDPR | **No** | No | Yes | Depends |
| EU data residency | **Yes (Germany)** | EU regions | US-default | US-default |
| Script weight | ~1 KB | ~1.6 KB | ~70 KB | small |
| INP / LCP impact | Negligible | Negligible | **Notable** | Negligible |
| AEO benefit | Doesn't hurt | Doesn't hurt | Adds cookie-banner CLS hit | Doesn't hurt |

**Verdict:** Plausible Cloud (EU) + Google Search Console. Plausible avoids the cookie banner (which itself causes CLS and dropped conversions), is hosted in Germany, and adds about 1 KB to the page. **Search Console is non-negotiable** regardless of which analytics is used — it's the only source for indexation status, Core Web Vitals from real Chrome users (CrUX), and structured-data errors. Avoid GA4 for this project: the cookie consent banner adds a CLS hit and conversion drop, and GA4's data lives in the US.

### 8. Image optimization — framework-native vs Cloudinary vs Imgix

**Verdict:** Astro `<Image>` + Sharp at build time for v1. The hero is a known asset, Sharp produces AVIF + WebP + JPEG fallback, and explicit width/height attributes are emitted automatically (CLS = 0). Free, no vendor.

**Upgrade trigger:** when v2 brings editor-uploaded blog images (50+ assets, dynamic sizes), move to **Cloudflare Images** ($5/mo for 100k images, EU edge, signed URLs). Cloudinary and Imgix are excellent but overkill for a healing-practice marketing site and add per-image bandwidth bills.

**Always emit:** explicit `width` + `height` on every `<img>`, `loading="eager"` + `fetchpriority="high"` on the hero, `loading="lazy"` on everything else, descriptive alt text (Dutch, not keyword-stuffed), WebP/AVIF served via `<picture>`.

### 9. i18n posture — Dutch-only v1, multilingual-ready

**Verdict:** Astro built-in i18n routing with `nl` as the default locale, routes mounted at `/` (no `/nl` prefix on default per Astro's `prefixDefaultLocale: false`) so the v1 URLs stay clean. Configure `i18n.locales: ['nl', 'en']` from day one even though `/en/*` returns 404 until v2 — this makes `hreflang` infrastructure trivial when the EN translation lands.

```js
// astro.config.mjs (sketch)
i18n: {
  defaultLocale: 'nl',
  locales: ['nl'],          // expand to ['nl', 'en'] in v2
  routing: { prefixDefaultLocale: false }
}
```

`hreflang` tags emitted in the `<head>` from day one (`<link rel="alternate" hreflang="nl" href="...">` and `<link rel="alternate" hreflang="x-default" href="...">`). When EN is added, `/en/over-ons` etc. get their counterpart `hreflang` automatically.

**Do not** ship a JS-based language switcher that swaps strings client-side — AI crawlers will only see one locale's content. Each locale must be its own URL with content in the initial HTML.

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

**If the aunt insists on a full WYSIWYG CMS from day one:**
- Use Astro + **Sveltia CMS** (Decap fork) overlay on git, OR
- Skip git-MDX and go straight to Sanity (EU dataset) with build-time fetch.
- Trade: monthly cost (Sanity free tier may suffice) + build-time fetch latency. Win: aunt edits copy with no PRs.

**If we need to self-host for absolute GDPR control (no third-party data processors):**
- Cal.com self-hosted on Hetzner (Falkenstein, DE) + Postgres + Redis.
- Resend swapped for **self-hosted SMTP via Mailcow on Hetzner**, or use **Postmark EU**.
- Plausible Community Edition self-hosted.
- Trade: ~4–6 hours/month maintenance. Win: zero third-party data processors.
- For this project (aunt is a solo practitioner, not handling PHI on the site), this is overkill — the recommended stack's posture is already GDPR-defensible.

**If v2 grows to >100 content pages with 3+ editors:**
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

Each major stack choice mapped to the checklist clause it satisfies:

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

**Verification gap notice (repeat for downstream consumer):** This session could not run live web fetches. Before `npm install` and contract signature, the developer must reconfirm: (1) Astro current stable minor and Tailwind v4 integration; (2) Cal.com Cloud EU region + nl-locale coverage; (3) Resend `eu-west-1` availability on the chosen plan; (4) Cloudflare Pages free-tier Worker limits for the form endpoint volume; (5) Plausible Cloud EU pricing. These are all expected to verify cleanly based on 2025/early-2026 vendor posture but should not be assumed.

---
*Stack research for: Dutch SEO/AEO-first marketing site (Trinity Breath & Healing)*
*Researched: 2026-06-14*
