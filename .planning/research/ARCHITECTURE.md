# Architecture Patterns — Trinity Breath & Healing

**Domain:** Dutch-language SEO/AEO-first marketing site for a breathwork/trauma-release practice (Holland)
**Researched:** 2026-06-14
**Scope:** v1 landing-only → v2 multi-page topical-authority hub
**Cross-reference:** `seo-aeo-samenvatting-checklist.md` (project root) — every section maps to a checklist item.

---

## 0. North Star

Every architectural decision answers one question: **"Does this make the site more findable AND more citeable by Google + AI engines, without breaking when we grow from 1 to ~50 pages?"**

Three invariants that never get violated:

1. **Content + meta in the initial HTML.** No JS-injected H1, no JS-injected JSON-LD, no JS-injected meta description. (Checklist §A, §5.)
2. **One H1 per page, semantic landmarks per page, deterministic heading hierarchy.** Enforced via shared layout primitives.
3. **URL = identity.** A URL chosen on day 1 either lives forever or gets a 301. No silent slug changes.

---

## 1. Content Architecture — Hub-Spoke Model

### 1.1 The model

```
                  ┌──────────────────────┐
                  │   /  (Landing Hub)   │  ← brand entry, broad framing,
                  │   Organization +     │    converts warm Instagram traffic
                  │   LocalBusiness root │    + cold "trinity breath" queries
                  └──────────┬───────────┘
                             │
        ┌────────────────────┼────────────────────┬─────────────────┐
        ▼                    ▼                    ▼                 ▼
  /breathwork          /trauma-release      /lichaamswerk       /over-ons
  (Topic Hub 1)        (Topic Hub 2)        (Topic Hub 3)       (E-E-A-T hub)
  Service schema       Service schema       Service schema      Person schema
        │                    │                    │
        ├── /blog/*          ├── /blog/*          ├── /blog/*
        │   (spokes:         │   (spokes:         │   (spokes:
        │    news, stories,  │    news, stories,  │    news, stories,
        │    long-tail)      │    long-tail)      │    long-tail)
        │                    │                    │
        └── /kennisbank/*    └── /kennisbank/*    └── /kennisbank/*
            (spokes:             (spokes:             (spokes:
             definitions,         definitions,         definitions,
             FAQ, evergreen)      FAQ, evergreen)      FAQ, evergreen)
```

**Three roles per topic** (mirrors checklist §2):

| Role | URL pattern | Purpose | Schema |
|------|-------------|---------|--------|
| Topic hub (landing) | `/{topic}` | Commercial authority — sells the modality, links to spokes | `Service` + `BreadcrumbList` + section-level `FAQPage` |
| Blog spoke | `/blog/{slug}` | Fresh signals, long-tail queries, news, client stories | `BlogPosting` + `Person` (author) + `BreadcrumbList` |
| Kennisbank spoke | `/kennisbank/{slug}` | Evergreen "source of truth": definitions, FAQ, how-it-works | `Article` + `FAQPage` (where applicable) + `BreadcrumbList` |

### 1.2 The 3 core topics (recommended for this practice)

Picked for: (a) search volume in NL breathwork niche, (b) practitioner expertise, (c) non-overlapping intent.

| # | Topic hub | Dutch slug | Why this topic |
|---|-----------|-----------|----------------|
| 1 | Breathwork | `/breathwork` | Modality name itself — cold-search anchor, AI-question anchor ("wat is breathwork"). Becomes the strongest commercial page. |
| 2 | Trauma release | `/trauma-release` | Outcome-oriented intent — people search the problem, not the method. Captures higher-funnel queries. |
| 3 | Lichaamswerk / somatisch | `/lichaamswerk` | Adjacent Dutch term — captures audience that knows somatic/lichaamsgericht vocabulary but not "breathwork". Topical breadth without dilution. |

Optional 4th topic for later growth (defer past v2): `/ademsessies-holland` — geographic + service-format hub for `LocalBusiness` SEO lift.

**`/over-ons`** is a 4th hub but architecturally different: it carries `Person` schema for the practitioner and is the E-E-A-T anchor every other page links into. Not a topic hub, but a **trust hub** — every spoke must link back to it.

### 1.3 What lives where (v1 landing — single page)

v1 has no topics, no spokes — it has **sections** that pre-stage the topics so v2 migration is additive, not destructive.

Landing sections, top-to-bottom (also the build order — see §11):

1. Hero (above-fold) — primary H1, value prop, primary CTA (boek 30-min kennismaking)
2. Intro / "wat is breathwork" — answer-first paragraph (becomes basis for `/breathwork` hub in v2)
3. Voor wie (audience) — recognition copy for trauma/burnout/disconnection
4. Aanpak / werkwijze — process explanation (the Frame 2 accordion)
5. Praktische info — duur, locatie, prijs (the Frame 4 active-state component)
6. Over de practitioner — E-E-A-T inline (becomes basis for `/over-ons` in v2)
7. FAQ — `FAQPage` JSON-LD, answer-first (the AEO money block)
8. Contact form (inline) + booking entrypoint
9. Footer — NAP, tel, mailto, socials, sitemap link

Each section is built as a **self-contained component** with its own h2, semantic wrapper, and (where relevant) JSON-LD contribution. v2 extraction = lift the component into a new route file with `<h2>` promoted to `<h1>`.

---

## 2. URL Structure

### 2.1 Convention: flat-ish, Dutch-slugged, no trailing slash

```
/                              landing hub
/breathwork                    topic hub
/trauma-release                topic hub
/lichaamswerk                  topic hub
/over-ons                      trust hub (practitioner)
/contact                       transactional page (form + NAP)
/boeken                        booking entrypoint
/blog                          blog index
/blog/{slug}                   blog post
/kennisbank                    knowledge base index
/kennisbank/{slug}             knowledge base entry
/sitemap.xml                   auto-generated
/robots.txt                    static
```

**Rules:**

- **Flat for hubs, one level of nesting for spokes.** `/blog/{slug}` not `/breathwork/blog/{slug}` — keeps slugs short, avoids URL churn if a post is re-categorized, lets one post link from multiple topic hubs.
- **Dutch slugs, lowercase, hyphen-separated, no diacritics, no stopwords.** `/kennisbank/wat-is-breathwork` not `/kennisbank/Wat-is-Breathwork.html`.
- **No trailing slash.** Canonical version is the no-slash form; the framework redirects `/foo/` → `/foo` with 301.
- **No file extensions** in URLs.
- **No date in URL.** `/blog/ademhaling-en-stress` not `/blog/2026/06/ademhaling-en-stress` — content stays evergreen-eligible.
- **Slug = topic, not marketing copy.** `/kennisbank/wat-is-trauma-release` not `/kennisbank/de-kracht-van-loslaten`.

Checklist §A: "Beschrijvende, korte URL's" — satisfied.

### 2.2 v1 → v2 migration: zero-regression strategy

v1 ships with a single page at `/`. v2 needs to add topic hubs without losing v1's accrued authority.

**Step 1 — At v1 launch, reserve the future URLs:**

Even on v1, the following routes exist and return **200** with stub content + canonical:

- `/over-ons` — full page (the E-E-A-T section from the landing, expanded by ~30%)
- `/contact` — minimal page (the contact form, NAP, opening hours, repeated from footer)
- Optional: `/breathwork` redirects (302, not 301) to `/#breathwork` during v1 so the URL is "live" but signals temporary state

Why: prevents the dreaded "we added /breathwork in v2 and Google indexed nothing for 6 weeks" cold-start.

**Step 2 — When v2 ships topic hubs:**

For each new hub `/breathwork`:
1. Page goes live with its own H1, meta, JSON-LD, and unique content.
2. The corresponding **anchor section on `/` stays**, but its `<h2>` headings now link **to the hub page** ("Lees meer over breathwork →").
3. **No redirects from `/` to `/breathwork`** — the landing keeps its broad framing; the hub deepens it.
4. Internal nav (header) gets the new hub link.
5. The hub is added to `sitemap.xml` and pinged in Search Console.

**Step 3 — If a URL ever does change** (e.g., `/blog/ademhaling-stress` → `/blog/ademhaling-en-stress`):
1. Old URL returns **301** to new URL.
2. Old URL is removed from sitemap.
3. Internal links updated (no 301 chains from our own site).
4. Wait one re-crawl cycle, verify in Search Console "Indexed" → "URL is on Google" for new URL before any further change.

Checklist §A: "Correcte 404-afhandeling en 301-redirects voor verplaatste URL's" — satisfied.

**Step 4 — Hreflang readiness without translation.**

Even though v1 is Dutch-only, the meta-tag layer emits:
```html
<link rel="alternate" hreflang="nl" href="https://trinity.../{path}">
<link rel="alternate" hreflang="x-default" href="https://trinity.../{path}">
```
When an EN translation ships in a future milestone, add `hreflang="en"` and bidirectional pairing — no infrastructure change required. Checklist §A.

---

## 3. Rendering Strategy

**Default: SSG. Exceptions: SSR for form/booking endpoints only.**

| Route | Strategy | Why |
|-------|----------|-----|
| `/` (landing) | **SSG** (pre-rendered at build time) | Content is static, max LCP wins, AI crawlers get full HTML. Checklist §5. |
| `/breathwork`, `/trauma-release`, `/lichaamswerk`, `/over-ons`, `/contact` | **SSG** | Same as landing. |
| `/blog`, `/blog/{slug}` | **SSG with rebuild-on-publish** (ISR-equivalent) | Blog content changes weekly; rebuild on CMS webhook trigger. Static at request time. |
| `/kennisbank`, `/kennisbank/{slug}` | **SSG with rebuild-on-publish** | Same as blog. |
| `/boeken` (booking submit) | **SSR endpoint / server function** | Posts to calendar API; needs server secret; cannot be static. Page shell SSG, action SSR. |
| `/api/contact` (form submit) | **SSR endpoint / server function** | Sends email via transactional provider; needs server secret. |
| `/sitemap.xml` | **SSG** generated from route manifest | Auto-rebuilt at deploy. |
| `/robots.txt` | **Static file** | Versioned in repo. |

**Why not SSR everywhere?** SSR adds origin RTT to every request → hurts LCP and TTFB. SSG + CDN means HTML is served from edge in ~30ms.

**Why not full SPA + prerender?** Prerender works but is an extra layer to maintain. Native SSG in SvelteKit/Astro/Next gives the same HTML output with fewer moving parts and better DX.

**Framework-specific notes:**
- **SvelteKit:** `export const prerender = true` per route; `+server.ts` for form/booking endpoints. Adapter: `adapter-static` for SSG routes won't work with SSR endpoints — use `adapter-vercel` / `adapter-node` / `adapter-cloudflare` in hybrid mode (prerender what you can, SSR what you must).
- **Astro:** `output: 'hybrid'` with `export const prerender = false` on the form/booking endpoint files. Default static otherwise.
- **Next.js:** App Router with `dynamic = 'force-static'` on content pages, route handlers (`route.ts`) for form/booking.

Checklist §5: "SSR, SSG of prerendering — zorg dat content + meta tags in de initiële HTML staan" — satisfied.

---

## 4. Component Boundaries

### 4.1 Shared (cross-page) primitives

These live in `src/lib/` (SvelteKit) / `src/components/` (Astro/Next) and are imported by every page. They are the contract that enforces invariants 2 + 3 from §0.

| Component | Responsibility | Talks to |
|-----------|---------------|----------|
| `<RootLayout>` | `<html lang="nl">`, `<head>` slot, semantic `<body>` skeleton with `<header>`, `<main>`, `<footer>` landmarks | All pages |
| `<Head>` | Centralized meta-tag injection: title, description, canonical, OG, Twitter, hreflang. Takes props per page; emits deterministic output. | `<RootLayout>` |
| `<JsonLd>` | JSON-LD injector. Composes `Organization` + `LocalBusiness` + per-page graph into one `<script type="application/ld+json">`. | `<RootLayout>`, page components |
| `<SiteHeader>` | Top nav, logo, primary CTA. Single `<nav>` landmark with `aria-label`. | `<RootLayout>` |
| `<SiteFooter>` | NAP, tel, mailto, socials, sitemap link, footer nav. Single `<footer>` landmark. | `<RootLayout>` |
| `<Breadcrumbs>` | Renders breadcrumb trail + emits `BreadcrumbList` JSON-LD fragment | All pages except `/` |
| `<RelatedContent>` | Renders ≥3 related links at end of spoke pages | Blog + kennisbank pages |
| `<FaqBlock>` | Renders Q/A pairs as `<h3>` + `<p>` AND emits `FAQPage` JSON-LD fragment from the same source | Any page with FAQs |
| `<CitationBlock>` | Wraps a stat/quote with `<cite>` + structured attribution (KDD 2024 GEO pattern) | Content pages |
| `<ImageHero>` | Eager-loaded, explicit width/height, fetchpriority=high, `<picture>` with AVIF/WebP/JPEG fallback | Page heroes |
| `<ImageLazy>` | `loading=lazy`, explicit width/height, `<picture>` with AVIF/WebP | Below-fold images |

**Per-page primitives** live in `src/routes/{route}/` and contain only what is unique to that page: H1, body content, the page-specific JSON-LD payload prop, and any one-off section components.

### 4.2 Enforcing "one H1 per page"

Two safety belts:

1. **Convention via `<PageTitle>` primitive.** Pages don't write `<h1>` directly — they use `<PageTitle>{title}</PageTitle>` which renders `<h1>`. Section components use `<SectionTitle level={2|3}>` which renders `<h2>` or `<h3>`. Compiler errors if you nest a `<PageTitle>` inside another `<PageTitle>`.
2. **CI gate.** A simple Playwright/Cheerio script visits every prerendered route and asserts `document.querySelectorAll('h1').length === 1` and `<h1>` appears before any `<h2>`. Fails the build if violated.

### 4.3 Enforcing semantic landmarks

`<RootLayout>` guarantees every page has exactly one `<header>`, one `<main>`, one `<footer>`. Pages cannot opt out. `<nav>` appears only inside `<header>` and `<footer>`. Long-form spoke pages may use `<article>` inside `<main>`. Checklist §A.

---

## 5. Internal Linking Architecture

### 5.1 v1 (single page)

No internal pages → no internal link graph. But we instrument **anchor links within the page** so behavior on v2 is identical:

- Header nav links to `#breathwork`, `#trauma-release`, `#aanpak`, `#over-ons`, `#faq`, `#contact`.
- The same nav primitive switches to real URLs on v2 with a config swap, not a refactor.
- Footer already links to `/over-ons` and `/contact` (which exist as real pages from day 1 — see §2.2).

### 5.2 v2 (multi-page) — the contract

**Every page must:**
- Link out to **≥3 relevant internal pages** (checklist §E)
- Be linked from **≥3 internal pages**
- Use **descriptive anchor text** ("Lees meer over breathwork bij trauma" — not "klik hier")

**Enforcement: an internal link graph generator** runs at build time.

1. Walks all prerendered HTML, extracts internal `<a href>`s.
2. Builds an adjacency matrix.
3. Reports per-page outbound count + inbound count.
4. CI fails if any page has <3 outbound or <3 inbound (excluding `/`, which is hub-only).

### 5.3 Default link patterns (codified)

- **Topic hub → its spokes.** Each topic hub has a "Verder lezen" block linking to 3-5 of its spokes.
- **Spoke → its topic hub.** Every spoke renders a breadcrumb (`Home > Breathwork > {slug}`) which is the hub backlink.
- **Spoke → related spokes (same topic).** `<RelatedContent>` at end of every spoke.
- **Every page → `/over-ons`.** Practitioner mention near credentials = links to `/over-ons`. E-E-A-T loop.
- **Every page → `/contact` or `/boeken`.** Footer CTA + inline CTA. Conversion loop.
- **`/over-ons` → all topic hubs.** Practitioner intro mentions each modality with a link.

This yields ~5-7 inbound links per spoke without any manual link insertion.

### 5.4 Breadcrumbs

`<Breadcrumbs>` primitive renders on every page except `/`. Two outputs from one data source:

```
Home › Breathwork › Wat is breathwork?
```
+
```json
{ "@type": "BreadcrumbList", "itemListElement": [...] }
```

Checklist §C: `BreadcrumbList` — satisfied. Checklist §E: Breadcrumbs — satisfied.

---

## 6. Structured Data Architecture

### 6.1 Composition model

JSON-LD lives in **one `<script type="application/ld+json">` per page**, composed from:

```
┌─────────────────────────────────────────────┐
│ @graph: [                                   │
│   Organization        ← shared, every page  │
│   LocalBusiness       ← shared, every page  │
│   WebSite             ← shared, every page  │
│   Person              ← shared on most;     │
│                         author on spokes    │
│   <page-specific>     ← Service / FAQPage / │
│                         Article / BlogPosting│
│                         BreadcrumbList      │
│ ]                                           │
└─────────────────────────────────────────────┘
```

Why `@graph`: avoids 5 separate `<script>` tags, lets entities cross-reference by `@id`, avoids duplication (Organization defined once, referenced by `@id` from Service.provider).

### 6.2 The `<JsonLd>` primitive

Single function: `buildGraph({ page, locale }) → JSON-LD string`.

- Shared entities (`Organization`, `LocalBusiness`, `WebSite`, `Person` for the practitioner) live in `src/lib/schema/shared.ts` and are referenced — not redefined — per page.
- Per-page payloads live in the route file: `export const schema = { ... }`.
- The primitive merges shared + per-page into one `@graph` array, deduplicates by `@id`, JSON-encodes with no whitespace, embeds in `<head>`.

### 6.3 Per-route schema map

| Route | Page-specific schema types |
|-------|---------------------------|
| `/` | `Service` (offered breathwork sessions), `FAQPage` (landing FAQ) |
| `/breathwork`, `/trauma-release`, `/lichaamswerk` | `Service` (specific to topic), `FAQPage`, `BreadcrumbList` |
| `/over-ons` | `Person` (full bio + credentials), `BreadcrumbList` |
| `/contact` | `ContactPage` (lightweight), `BreadcrumbList` |
| `/boeken` | `ReservationAction` reference, `BreadcrumbList` |
| `/blog/{slug}` | `BlogPosting` (author = Person), `BreadcrumbList`, optional `FAQPage` |
| `/kennisbank/{slug}` | `Article`, `FAQPage` (often), `BreadcrumbList` |

Checklist §C: all required types — satisfied.

### 6.4 Validation pipeline

Three gates, increasingly strict:

1. **Local: build-time JSON parse.** `JSON.parse(emittedSchema)` must succeed. Fails build.
2. **Local: schema-dts type check** (TypeScript). Catches `Organization.name` typed as `number`, missing `@type`, etc. Fails build.
3. **CI: Schema.org validator + Rich Results Test.**
   - For every prerendered route, fetch with a headless browser, extract the JSON-LD, POST to https://validator.schema.org/ API (or local equivalent). Surface warnings/errors to CI.
   - Run Google's Rich Results Test against staging URL pre-merge.
   - Hard fail on errors, soft warn on Google warnings.

Checklist §C: "Gevalideerd met Rich Results Test" — satisfied.

---

## 7. Form & Booking Architecture

### 7.1 Contact form

**Flow:**
```
Browser form submit (POST, fetch())
    ↓
/api/contact (server function, same origin)
    ↓ validate (Zod) + rate-limit (IP-based, 5/hour)
    ↓ honeypot + Turnstile/hCaptcha check
    ↓
Transactional email provider (Resend / Postmark, EU region)
    ↓
Practitioner inbox + auto-reply to user
```

**Why same-origin server function (not direct-from-browser to email API):**
- API keys stay server-side.
- Rate-limit + honeypot + bot-check before spending email credits.
- Single audit log point.
- No CORS theater.

**EU data residency:** pick **Resend (EU region)** or **Postmark (EU)** — both have EU-hosted endpoints. Avoid US-only providers (Mailgun US, SendGrid US-default). The form payload + email are processed in EU. Document this in a privacy section on `/contact`.

### 7.2 Booking form

Decision tree (resolve in STACK research):

```
Need: 30-min session, user picks date+time, generates Google Meet, EU data residency

Option A — Cal.com (self-host or EU cloud)
  + Open source, embeddable, generates Google Meet via Google Calendar integration
  + EU data residency available (self-host or cal.com EU)
  + Iframe embed OR redirect to /booking page on cal.com
  − Iframe = no SEO on /boeken (but /boeken is a transactional page, not a SEO target)

Option B — Calendly
  + Mature, reliable
  + EU residency unclear in default plan
  − US-default data residency

Option C — Custom (Google Calendar API + own UI)
  + Full control
  − Build time, OAuth complexity, calendar polling/webhooks
  − Out of scope for v1
```

**Recommendation: Cal.com embed on `/boeken`.** Page shell is SSG (with H1, meta, schema). Cal.com widget loads inline. CTA elsewhere on site (header, footer, hero) points to `/boeken`. The booking action itself happens on cal.com infra — we get HTML+meta benefits without building calendar plumbing.

**Lazy-load the Cal.com widget** below the page fold so it doesn't block LCP on `/boeken`.

### 7.3 Data flow summary

```
Contact form:    browser → /api/contact (our server) → Resend EU → practitioner email
Booking:         browser → /boeken (SSG shell) → Cal.com widget → Google Calendar → Meet link + emails
Footer mailto:   browser → mailto: → user's email client (no server involvement)
Footer tel:      browser → tel: → phone app (no server involvement)
```

---

## 8. Meta-Tag Architecture

### 8.1 The `<Head>` primitive contract

Every page calls `<Head>` with a typed prop:

```ts
type PageMeta = {
  title: string;            // 50-60 chars, no site suffix (added automatically)
  description: string;      // 150-160 chars
  path: string;             // absolute path, used to build canonical + hreflang
  og?: {
    image?: string;         // defaults to /og-default.jpg
    type?: 'website' | 'article';
  };
  article?: {               // only on blog/kennisbank
    publishedTime: string;
    modifiedTime: string;
    author: string;
  };
  noindex?: boolean;        // default false; only true for 404/staging
};
```

**`<Head>` emits, deterministically, in this order:**

```html
<title>{title} | Trinity Breath & Healing</title>
<meta name="description" content="{description}">
<link rel="canonical" href="https://trinity.../{path}">
<link rel="alternate" hreflang="nl" href="https://trinity.../{path}">
<link rel="alternate" hreflang="x-default" href="https://trinity.../{path}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="https://trinity.../{path}">
<meta property="og:image" content="{og.image | default}">
<meta property="og:type" content="{og.type | 'website'}">
<meta property="og:locale" content="nl_NL">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{description}">
<meta name="twitter:image" content="{og.image | default}">
{noindex && <meta name="robots" content="noindex,nofollow">}
{article && <meta property="article:published_time" content="{...}">}
```

### 8.2 Per-page override pattern

- **Defaults** live in `src/lib/meta/defaults.ts` (title suffix, OG image, locale).
- **Per-page values** live in the route file as `export const meta: PageMeta = { ... }`.
- The layout merges defaults + page meta and passes the result to `<Head>`.
- No JS runs to set meta — all emitted in initial HTML (SSG). Checklist §A.

### 8.3 CI gate

A meta-validation test:
- Every prerendered route has exactly one `<title>` 50-60 chars.
- Every route has `<meta name="description">` 150-160 chars.
- Every route has a `<link rel="canonical">` matching its served URL.
- No duplicate titles or descriptions across routes (fuzzy match — warns at >0.85 similarity).

Build fails if violated.

---

## 9. Asset Pipeline

### 9.1 Images

| Concern | Approach |
|---------|----------|
| Format | AVIF first, WebP fallback, JPEG/PNG last via `<picture>` |
| Sizes | `srcset` with 4 widths: 640w, 1024w, 1600w, 2400w. `sizes` attribute matches CSS breakpoints. |
| Hero | `<img fetchpriority="high" loading="eager" decoding="async">`. Preloaded via `<link rel="preload" as="image" imagesrcset>` for above-fold hero only. |
| Below-fold | `<img loading="lazy" decoding="async">` |
| Dimensions | Explicit `width` + `height` (or CSS `aspect-ratio`) — CLS guard. Checklist §B. |
| Alt text | Per-image, descriptive, Dutch, no keyword stuffing |
| Filenames | `ademhalingssessie-hero-1600.webp` (descriptive, kebab-case, Dutch) |
| Pipeline | Vite-imagetools / `@unpic/svelte` / `next/image` — pick per framework. Generates the size matrix at build time. |

**LCP target (< 2.5s):**
- Hero image is the LCP element → preloaded, eager, AVIF, ~80KB at 1600w.
- CDN-served from edge (Vercel/Netlify/Cloudflare).
- No render-blocking JS above the hero render.

### 9.2 Fonts

- **Self-host** woff2 files in `/static/fonts/`. No third-party font CDN (Google Fonts) — adds DNS + connect time and a privacy concern under GDPR.
- **Preload the one font weight used above-fold** with `<link rel="preload" as="font" crossorigin>`.
- **`font-display: swap`** on all `@font-face` declarations — text renders in fallback first, swaps when font loads, no invisible text.
- **Match fallback metrics** with `size-adjust`, `ascent-override`, `descent-override` — prevents font-swap CLS. Checklist §B (CLS).

### 9.3 Critical CSS

- SvelteKit/Astro/Next inline critical CSS per page by default — keep that on.
- Non-critical CSS deferred via `<link rel="stylesheet" media="print" onload="this.media='all'">` pattern, or framework's built-in async CSS.
- Aim for **< 14KB inlined critical CSS** (first TCP slow-start window).

### 9.4 JavaScript

- Landing page should ship **< 30KB compressed JS total** for v1. Heavy interactivity (form validation, accordion) is fine — they're small.
- **No JS for hero, intro, voor-wie sections** — pure HTML/CSS. Lazy-load JS for FAQ accordion, contact form (hydrate on visible/interaction).
- **Astro:** islands by default — zero JS unless a component opts in via `client:visible`.
- **SvelteKit/Next:** `csr = false` on routes that don't need interactivity (rare, but available); otherwise rely on small bundles.
- **No tracking scripts in v1.** When analytics ships, use **Plausible (EU)** or **Umami** — < 1KB, no cookies, no consent banner needed.

**INP target (< 200ms):**
- No JS = no INP issues for non-interactive content.
- Form validation runs on `input` event with debounce; submit handler uses `await` with a loading state to avoid main-thread blocking.

### 9.5 Performance budget (CI-enforced)

| Asset | Budget |
|-------|--------|
| Initial HTML | < 50KB compressed |
| Critical CSS (inline) | < 14KB |
| JS (initial, compressed) | < 30KB |
| Hero image (AVIF, 1600w) | < 120KB |
| Total above-fold transfer | < 250KB |
| LCP | < 2.5s on Moto G Power 4G (Lighthouse) |
| INP | < 200ms (lab estimate via Lighthouse) |
| CLS | < 0.1 |

Lighthouse CI runs on every PR. Hard-fails if LCP > 2.5s or CLS > 0.1.

---

## 10. Search Console, Sitemap, Robots

### 10.1 `robots.txt`

Static file at `/static/robots.txt`. Order matters — AI allow-rules before the wildcard.

```
# AI search/RAG crawlers — explicitly allowed
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

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

# Everything else
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://trinity-breath-healing.nl/sitemap.xml
```

Checklist §A, §F: AI-crawler allow + sitemap reference — satisfied.

### 10.2 Sitemap

- **`sitemap.xml`** auto-generated at build time from the route manifest.
- One entry per page, with `<lastmod>` from git history of the file (or CMS publish date).
- v1: single entry (`/`) + `/over-ons` + `/contact`.
- v2: dynamically adds every topic hub + every spoke.
- For >50 pages, split into `sitemap-index.xml` + per-section sitemaps (`sitemap-blog.xml`, `sitemap-kennisbank.xml`).

### 10.3 Search Console flow

1. Verify property via DNS TXT record (one-time, project setup).
2. Submit `https://trinity-breath-healing.nl/sitemap.xml` after first deploy.
3. CI hook: after each production deploy, ping `https://www.google.com/ping?sitemap=...` (deprecated for Google but Bing still uses; cheap belt-and-braces).
4. Monitor Coverage, Core Web Vitals (real-user), Enhancements (structured data errors) weekly.

Checklist §G.

---

## 11. Build Order (Per-Section, Hero-First, Mobile-First)

User constraint: build at fine granularity, section by section, hero first, mobile first. SEO/AEO priorities folded in.

### 11.1 Pre-section work (must happen before any section)

| # | Task | Why first |
|---|------|-----------|
| 0.1 | Framework + adapter (SSG-capable) scaffolded | Nothing else builds without it |
| 0.2 | `<RootLayout>` + `<Head>` + `<JsonLd>` primitives skeleton | Every section needs them |
| 0.3 | `robots.txt` + `sitemap.xml` stub | Right defaults from t=0 |
| 0.4 | Shared `Organization`, `LocalBusiness`, `WebSite` schema definitions | Every page references them |
| 0.5 | Tokens: colors, type scale, spacing from Figma | Sections render to spec on day 1 |
| 0.6 | Mobile-first CSS reset + container/grid primitive | Every section's first render is mobile |

### 11.2 Section-by-section build order (landing page)

Each section is one PR. Order respects: above-fold first (LCP wins), AEO-priority sections before nice-to-haves, trust signals before conversion asks.

| # | Section | Mobile first → desktop | SEO/AEO contribution | Checklist refs |
|---|---------|-------------------------|----------------------|----------------|
| 1 | **Hero** (H1, value prop, primary CTA) | Build mobile layout from Figma Frame 1 mobile; promote to desktop via media query | Carries the page H1, the LCP element (hero image), the first CTA. Highest-value real estate. | §A H1, §B LCP, §A initial-HTML title |
| 2 | **Site header + nav** | Mobile = hamburger from Figma; desktop = horizontal nav | Semantic `<nav>`, NAP entry point | §A semantic HTML |
| 3 | **Intro / wat is breathwork** | Mobile copy stack | Answer-first paragraph; first ~150 words contain core keywords. Becomes basis for `/breathwork` hub. | §D first-150-words, answer-first |
| 4 | **Voor wie / audience recognition** | Mobile copy stack | Recognition copy, addresses user intent (trauma, burnout) | §D search intent |
| 5 | **Aanpak / werkwijze (accordion)** | Mobile accordion (Frame 2 inferred from desktop) | Process clarity = E-E-A-T signal | §D scanability |
| 6 | **Praktische info (duur/locatie/prijs)** | Mobile tabs/active state (Frame 4 inferred) | NAP consistency contributor; LocalBusiness schema source | §C LocalBusiness |
| 7 | **Over de practitioner inline** | Mobile portrait + bio | E-E-A-T: credentials, photo, Person schema source. Links to future `/over-ons`. | §D E-E-A-T, §C Person |
| 8 | **FAQ** | Mobile accordion or stacked Q+A | The AEO money block: `FAQPage` JSON-LD + answer-first | §C FAQPage, §D answer-first |
| 9 | **Citation/proof blocks** | Mobile stacked quotes/stats | +30-41% AI-citation lift (KDD 2024) | §D statistics/quotes |
| 10 | **Contact form (inline)** | Mobile-first form layout | Conversion path; server function wiring | §7 |
| 11 | **Booking CTA → `/boeken`** | Mobile button block, links to `/boeken` page | Conversion path | §7 |
| 12 | **Footer** | Mobile stacked layout | NAP consistency, mailto, tel, socials, sitemap link | §F entity consistency |

### 11.3 Post-section work (before launch)

| # | Task |
|---|------|
| 13.1 | `/over-ons` standalone page (expanded from section 7) |
| 13.2 | `/contact` standalone page (expanded from section 10) |
| 13.3 | `/boeken` page with Cal.com embed |
| 13.4 | All JSON-LD validated via Rich Results Test |
| 13.5 | Lighthouse CI green on mobile (LCP, INP, CLS) |
| 13.6 | Meta-tag CI gate green |
| 13.7 | Internal link graph CI gate (relaxed for v1 — only enforces `/`, `/over-ons`, `/contact`) |
| 13.8 | Search Console verified, sitemap submitted |

### 13.4 Why this order beats other orders

- **Hero before nav** is unusual but right: the hero defines the H1, LCP, and OG image — these are the page's *identity*. Nav is structural plumbing that can land any time before the third section.
- **FAQ before contact form** because FAQ is the AEO citation driver; if the project gets cut short, FAQ is the highest-leverage section for AI visibility.
- **Practitioner inline before FAQ** because E-E-A-T signals (visible author) increase the citation weight of every block that follows.
- **Booking deferred to its own page** because embedding a third-party iframe inline on the landing would hurt LCP and CLS.

---

## 12. Migration Plan Summary (v1 → v2)

```
v1 (landing only)                    v2 (multi-page topical authority)
────────────────                     ────────────────────────────────
/                                    /                              (kept, sections now link out)
/over-ons      ← already live!       /over-ons                      (deepened)
/contact       ← already live!       /contact                       (deepened)
/boeken        ← already live!       /boeken                        (unchanged)
                                     /breathwork                    NEW topic hub
                                     /trauma-release                NEW topic hub
                                     /lichaamswerk                  NEW topic hub
                                     /blog                          NEW index
                                     /blog/{slug}                   NEW spokes
                                     /kennisbank                    NEW index
                                     /kennisbank/{slug}             NEW spokes
```

**Zero URLs change.** Only additions. Zero 301s required (the strongest possible migration).

**Internal-link CI gate**, relaxed in v1, tightens automatically in v2 — every new page must satisfy ≥3/≥3 before merge.

**Sitemap auto-grows** — no manual maintenance.

**JSON-LD `@id` references stay stable** — `Organization` defined once in shared schema, referenced from every new `Service` and `Article`.

---

## 13. Checklist Cross-Reference

Mapping every relevant item from `seo-aeo-samenvatting-checklist.md` to its architectural home.

| Checklist item | Lives in section |
|---|---|
| §A HTTPS | Hosting/deploy config (not architecture per se — outside scope but flagged) |
| §A unique title/description per page in initial HTML | §8 Meta-tag architecture |
| §A one H1 per page | §4.2 component primitives + CI gate |
| §A canonical | §8 Meta-tag architecture |
| §A robots.txt + sitemap ref + AI allows | §10.1 |
| §A XML sitemap | §10.2 |
| §A 301/404 handling | §2.2 migration |
| §A SSR/SSG for initial HTML | §3 Rendering strategy |
| §A hreflang | §8 Meta-tag architecture (NL + x-default in v1) |
| §A OG + Twitter | §8 |
| §A semantic HTML5 | §4.1 + §4.3 |
| §B alt text | §9.1 |
| §B WebP/compression | §9.1 (AVIF + WebP) |
| §B width/height/aspect-ratio | §9.1 + §9.2 (CLS) |
| §B lazy outside viewport | §9.1 |
| §B LCP/INP/CLS targets | §9.5 budget |
| §B preload critical | §9.1 + §9.2 |
| §C Organization | §6.1 shared graph |
| §C Article/BlogPosting | §6.3 per-route |
| §C FAQPage | §6.3 + §4.1 `<FaqBlock>` |
| §C Service | §6.3 |
| §C BreadcrumbList | §5.4 + §6.3 |
| §C LocalBusiness | §6.1 shared graph |
| §C Rich Results validation | §6.4 |
| §D answer-first / first-150-words | §11.2 section 3, 8 |
| §D core terms defined | §11.2 section 3 |
| §D FAQ standalone answers | §11.2 section 8 + §4.1 `<FaqBlock>` |
| §D statistics/quotes/citations | §11.2 section 9 + §4.1 `<CitationBlock>` |
| §D E-E-A-T author + credentials | §11.2 section 7 + `/over-ons` |
| §E 3-5 core topics | §1.2 |
| §E hub + blog + kennisbank | §1.1 |
| §E ≥3 internal links per page | §5.2 + CI gate |
| §E descriptive anchor text | §5.2 |
| §E breadcrumbs | §5.4 |
| §E related-content links | §4.1 `<RelatedContent>` |
| §F AI crawlers allowed | §10.1 |
| §F standalone extractable content blocks | §4.1 `<FaqBlock>` + `<CitationBlock>` |
| §F NAP consistency | §4.1 `<SiteFooter>` + §11.2 section 6 |
| §G Search Console | §10.3 |
| §G indexation + CWV + structured-data monitoring | §10.3 |

Every checklist item has an architectural home. Nothing is orphaned.

---

## 14. Sources

- `seo-aeo-samenvatting-checklist.md` (project root) — Dutch SEO/AEO playbook, verified 2026, primary reference.
- `.planning/PROJECT.md` — project scope, audience composition, framework constraints.
- KDD 2024 GEO study (Aggarwal et al., Princeton/Georgia Tech/Allen AI/IIT Delhi) — +30-41% AI citation lift from statistics/quotes/citations (cited via reference doc).
- HubSpot AI Search Trends 2025 — recency effect (cited via reference doc).
- AI-crawler list (OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, ClaudeBot, Claude-User, Google-Extended, Applebot-Extended) — cited via reference doc.
- Web Vitals (web.dev) — LCP < 2.5s, INP < 200ms, CLS < 0.1 thresholds.
- Schema.org documentation — Organization, LocalBusiness, Service, FAQPage, Article, BreadcrumbList, Person, WebSite types.

**Confidence assessment for this document: HIGH.**
- Content architecture (hub-spoke): HIGH — directly derived from checklist §2 + §E.
- Rendering strategy (SSG default + SSR endpoints): HIGH — derived from checklist §5.
- AI-crawler allowlist: HIGH — verbatim from reference doc.
- Component boundaries: MEDIUM-HIGH — derived from invariants; framework-specific details defer to STACK.md.
- Build order (per-section, hero-first, mobile-first): HIGH — directly aligned to user's stated constraint.
- Topic selection (breathwork / trauma-release / lichaamswerk): MEDIUM — based on practitioner-domain reasoning, should be validated with the practitioner before v2 build.
