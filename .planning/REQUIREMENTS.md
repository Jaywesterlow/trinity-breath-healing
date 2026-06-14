# Requirements: Trinity Breath & Healing

**Defined:** 2026-06-14
**Core Value:** SEO + AEO discoverability of trustworthy, citeable content — the site must be *found and cited* by Google, AI Overviews, ChatGPT, Perplexity, Claude on Dutch breathwork/trauma queries. Visual fidelity to Figma matters, but never at the expense of SEO/AEO.

## v1 Requirements

Landing-page-only release. Categories derived from research FEATURES.md + ARCHITECTURE.md + PITFALLS.md.

### Foundation (FND)

- [ ] **FND-01**: Astro 5 + TS strict scaffolded with `@astrojs/cloudflare` adapter
- [ ] **FND-02**: Tailwind v4 build-time atomic CSS configured (no runtime CSS-in-JS)
- [ ] **FND-03**: Astro Content Collections + MDX + Zod schemas configured for v1 (no headless CMS)
- [ ] **FND-04**: Design tokens (color, spacing, radius, type, motion) extracted from Figma into CSS variables
- [ ] **FND-05**: Mobile-first reset + responsive grid system
- [ ] **FND-06**: Self-hosted woff2 fonts with `font-display: swap` + metric-matched fallback (no CLS)
- [ ] **FND-07**: `SITE_URL` env strategy with no localhost default
- [ ] **FND-08**: Reserved 200-response stub pages exist at `/over-ons`, `/contact`, `/boeken` from day one (zero-301 v2 migration guarantee)

### SEO Primitives (SEO)

- [ ] **SEO-01**: `<RootLayout>` + `<Head>` primitives enforce per-page unique `<title>` (50–60 chars) and meta description (150–160 chars) in initial HTML
- [ ] **SEO-02**: `<PageTitle>` primitive enforces exactly one `<H1>` per page; logical H2/H3 hierarchy
- [ ] **SEO-03**: Semantic HTML5 landmarks (`<main>`, `<nav>`, `<article>`, `<section>`, `<footer>`) on every page
- [ ] **SEO-04**: Canonical tag on every page
- [ ] **SEO-05**: `hreflang="nl"` + `x-default` infrastructure ready (Dutch ships in v1; EN deferred)
- [ ] **SEO-06**: Open Graph + Twitter Card meta on every page
- [ ] **SEO-07**: XML sitemap auto-generated and referenced in robots.txt
- [ ] **SEO-08**: `robots.txt` with explicit `Allow` blocks for `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Claude-User`, `Google-Extended`, `Applebot-Extended` placed BEFORE any `User-agent: *` directive, plus sitemap reference
- [ ] **SEO-09**: Visible `dateModified` on the landing page (recency-citation signal)
- [ ] **SEO-10**: Search Console DNS-TXT verification kicked off in Phase 0 (propagation = up to 48h)
- [ ] **SEO-11**: CI gate fails the build if any page has zero or multiple H1s, missing or duplicate meta, or invalid canonical

### Structured Data / AEO (SCH)

- [ ] **SCH-01**: `<JsonLd>` primitive emits single `<script type="application/ld+json">` per page using `schema-dts` types
- [ ] **SCH-02**: `Organization` (or `LocalBusiness` if physical address) shared schema source-of-truth file
- [ ] **SCH-03**: `Person` schema for the practitioner (E-E-A-T identity)
- [ ] **SCH-04**: `Service` schema for breathwork/trauma-release service
- [ ] **SCH-05**: `WebSite` schema with site search action
- [ ] **SCH-06**: `BreadcrumbList` schema on `/over-ons`, `/contact`, `/boeken`
- [ ] **SCH-07**: `FAQPage` schema generated from the same source as the rendered FAQ accordion (single source of truth)
- [ ] **SCH-08**: CI gate validates JSON-LD parse + `schema-dts` types + Rich Results Test on every build

### Landing Sections (LND) — built hero-first, mobile-first, per section

- [ ] **LND-01**: Hero — definitive H1 (practice + modality + outcome), one-sentence value prop, primary CTA "Boek een kennismaking", real practitioner photo (no stock), preloaded `fetchpriority="high" loading="eager"`
- [ ] **LND-02**: Site header — logo, nav (anchor links v1; will become route links v2), mobile hamburger
- [ ] **LND-03**: Intro / "Wat is ademwerk?" answer-first definition block (answer in sentence 1, 50–150 words, within first ~150 page words)
- [ ] **LND-04**: "Voor wie / Niet voor wie" qualification block
- [ ] **LND-05**: "Aanpak" `<details>` accordion (Frame 2 mobile — content remains in DOM so AI crawlers see it; desktop frame is reference)
- [ ] **LND-06**: Praktische info section with `LocalBusiness` source data (Frame 4 — desktop has active state, mobile inferred from desktop)
- [ ] **LND-07**: "Over de practitioner" inline section — bio + credentials + lineage; mirrors Person schema (E-E-A-T)
- [ ] **LND-08**: FAQ section — 8–12 questions, each as H2/H3 with answer-first 50–150 word body; same source feeds FAQPage JSON-LD
- [ ] **LND-09**: Citation / proof blocks — at least one statistic, one quote, one outbound source citation (stacks KDD 2024 +30/+32/+41% AEO lift)
- [ ] **LND-10**: Inline contact section — name, email, optional phone, message, honeypot, AVG consent unchecked by default
- [ ] **LND-11**: Booking CTA — anchor button that routes to `/boeken` (does NOT mount Cal.com on `/`)
- [ ] **LND-12**: Footer — NAP, `mailto:`, `tel:`, WhatsApp, Instagram, KvK, privacy link, visible `dateModified`, all plain text in HTML
- [ ] **LND-13**: 3–5 named testimonials (first name + city, written consent on file, no diagnosis language)
- [ ] **LND-14**: Glossary/inline definition blocks for 5–8 core terms (ademwerk, trauma release, zenuwstelsel-regulatie, etc.)
- [ ] **LND-15**: All landing copy follows two-sentence pattern (definitive answer → nuance/safety) — no hedge language, no unsubstantiated claims

### Reserved Page Deepening (RES)

- [ ] **RES-01**: `/over-ons` — full practitioner story, credentials, lineage, photos; deepened `Person` schema
- [ ] **RES-02**: `/contact` — standalone contact form, NAP, opening hours, KvK, data-processor list, privacy link
- [ ] **RES-03**: `/boeken` — page shell (H1 + meta + JSON-LD) with lazy mount-point for Cal.com embed

### Integrations (INT)

- [ ] **INT-01**: `/api/contact` Cloudflare Worker — Zod-validated POST, honeypot, rate-limit 5/hour/IP, AVG consent required, server-side validation rejects missing consent
- [ ] **INT-02**: Resend EU (`eu-west-1`) configured; sending domain verified with SPF + DKIM + DMARC
- [ ] **INT-03**: Contact form submission delivers to practitioner inbox; auto-reply sent to submitter; end-to-end deliverability passes for Gmail, Outlook, iCloud
- [ ] **INT-04**: Cal.com event type configured — 30 minutes, `Europe/Amsterdam` timezone, Google Meet auto-create on, Dutch locale
- [ ] **INT-05**: Cal.com inline embed on `/boeken` only, `client:visible` below the fold (zero impact on landing LCP)
- [ ] **INT-06**: DST transition end-to-end booking test passes (October + March boundaries)
- [ ] **INT-07**: Plausible Cloud (EU) analytics script installed — cookieless, no banner
- [ ] **INT-08**: Privacy policy lists every data processor used (Resend, Cal.com, Plausible, Cloudflare)

### Performance (PRF)

- [ ] **PRF-01**: Hero images served as AVIF/WebP via Astro `<Image>` + Sharp, with explicit `width`/`height` (zero CLS)
- [ ] **PRF-02**: Hero image preloaded with `<link rel="preload" as="image" fetchpriority="high">`; never `loading="lazy"`
- [ ] **PRF-03**: All non-hero images lazy-loaded
- [ ] **PRF-04**: LCP < 2.5s on the landing page (verified via Lighthouse CI + CrUX after 28 days)
- [ ] **PRF-05**: INP < 200ms on the landing page (verified via Lighthouse CI)
- [ ] **PRF-06**: CLS < 0.1 on the landing page (verified via Lighthouse CI)
- [ ] **PRF-07**: No render-blocking third-party JS on landing page (Cal.com embed lives only on `/boeken`)
- [ ] **PRF-08**: CI gate fails the build if LCP/INP/CLS budgets are exceeded

### Accessibility (A11Y)

- [ ] **A11Y-01**: WCAG 2.2 AA compliance — focus states, contrast ratios, keyboard nav, ARIA labels where needed
- [ ] **A11Y-02**: All form inputs have programmatic labels
- [ ] **A11Y-03**: Tap targets minimum 44×44 px on mobile
- [ ] **A11Y-04**: Screen-reader walkthrough of landing page passes (no orphan headings, all images alt-tagged)
- [ ] **A11Y-05**: pa11y or axe CI gate fails the build on WCAG 2.2 AA violations

### Legal & Copy (LGL)

- [ ] **LGL-01**: Hedge-language grep pass — zero "misschien", "zou kunnen", "wellicht" in user-facing copy without a paired definitive sentence
- [ ] **LGL-02**: Two-sentence pattern enforced — definitive answer in sentence 1, nuance/safety in sentence 2 (where relevant)
- [ ] **LGL-03**: No unsubstantiated medical claims — experience framing only ("begeleidt bij…"), never therapeutic-cure language
- [ ] **LGL-04**: Disclaimer visible near the booking CTA + above the contact form
- [ ] **LGL-05**: Trauma trigger warning included where content references trauma symptoms or release
- [ ] **LGL-06**: Privacy policy published, linked from footer, reviewed by Dutch counsel
- [ ] **LGL-07**: AVG consent flow tested — unchecked by default, server rejects unchecked submissions, free-text-warning above the message field
- [ ] **LGL-08**: All testimonials have written consent files; no client diagnosis names appear
- [ ] **LGL-09**: Dutch counsel sign-off on all health-adjacent claims (Wet BIG + Reclame Code)
- [ ] **LGL-10**: NAP (name, address-or-city, phone) locked in PROJECT.md before any `Organization`/`LocalBusiness` JSON-LD ships; matches off-site listings (Instagram, GBP if claimed, KvK)
- [ ] **LGL-11**: Cookie banner explicitly NOT shipped (cookieless stack); decision documented in privacy policy

### Launch & Monitoring (LCH)

- [ ] **LCH-01**: Production deploy to Cloudflare Pages with `astro build` clean
- [ ] **LCH-02**: Sitemap submitted in Google Search Console
- [ ] **LCH-03**: URL Inspection in Search Console shows content + structured data on `/`, `/over-ons`, `/contact`, `/boeken`
- [ ] **LCH-04**: `curl -A "OAI-SearchBot" <url>` verification per route confirms H1 + meta + JSON-LD present
- [ ] **LCH-05**: 28-day CWV check via CrUX (LCP/INP/CLS field data within budgets)
- [ ] **LCH-06**: Server log review within 30 days confirms AI crawler hits (no silent block)
- [ ] **LCH-07**: Test queries on Perplexity, ChatGPT, Claude for target Dutch phrases over 60–90 days; tracking spreadsheet established

## v2 Requirements

Deferred — tracked but not in current roadmap.

### Topical Authority Expansion (TOP)

- **TOP-01**: `/breathwork` topic hub page
- **TOP-02**: `/trauma-release` topic hub page
- **TOP-03**: `/lichaamswerk` topic hub page
- **TOP-04**: `/blog/*` blog index + posts (topical authority)
- **TOP-05**: `/kennisbank/*` knowledge base entries (AEO citation hub)
- **TOP-06**: Internal-link graph CI gate (every page links to ≥3 relevant pages, linked from ≥3)
- **TOP-07**: Related-content blocks on every page

### Multi-Language (I18N)

- **I18N-01**: EN translation of landing page with full `hreflang` pair
- **I18N-02**: EN counterparts for `/over-ons`, `/contact`, `/boeken`

### CMS Migration (CMS)

- **CMS-01**: Sanity EU dataset configured (triggered when >50 pages or >2 editors)
- **CMS-02**: Content collection migration from MDX to Sanity
- **CMS-03**: Sveltia or similar git-based CMS as interim option if aunt needs WYSIWYG before Sanity

### Enhanced Trust (TRU)

- **TRU-01**: Aggregate review schema (only once >5 verified reviews exist)
- **TRU-02**: Professional association badges + outbound links (CAT, NFG, RBCZ — pending membership confirmation)
- **TRU-03**: Google Business Profile review badge

## Out of Scope

Explicit exclusions to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Client-side rendering / SPA | Blinds AI crawlers; violates Core Value (PITFALLS #1) |
| `llms.txt` / `llms-full.txt` | No proven retrieval effect per reference doc (2026 verified) |
| GA4 analytics | Requires cookie banner → CLS hit + US data residency |
| Vercel hosting | EU residency posture weaker; Cloudflare AMS POP closer to NL users |
| Calendly inline at top of landing | Heavy iframe → LCP regression (PITFALLS #8) |
| Formspree / Tally / Typeform | Black-box form relays, US data residency, opaque GDPR posture |
| reCAPTCHA | Heavy JS + privacy posture; honeypot + rate-limit sufficient |
| Pop-ups, intrusive cookie banner | UX + CWV hit, no business need with cookieless stack |
| Carousels / sliders | Hides content from cold visitors and AI extraction |
| Autoplay hero video | LCP killer + accessibility regression |
| JS-loaded testimonials | Invisible to AI crawlers (PITFALLS #1) |
| Embedded YouTube as primary content | Heavy iframe; alt-text-free for AI |
| Stock wellness photography | Trust killer for warm audience + visual cliché penalty |
| User accounts / login | Booking flow is anonymous form → calendar invite |
| E-commerce | Practice sells time (sessions), not products |
| Native mobile apps | Web-first; mobile web is the channel |
| Newsletter signup (v1) | Future v2 feature; not core to landing-page conversion |
| Live chat widgets | LCP/INP hit; no staffing model |
| Service workers (v1) | Premature complexity for single-page-plus-stubs |
| Client-side language switcher | Forces JS; breaks `hreflang` discipline |
| Aggregate review schema (v1) | Requires >5 real reviews to ship without spoofing |
| "Genezing" / therapeutic-cure language | Wet BIG legal risk |
| Before/after medical claims | Wet BIG + Reclame Code risk |
| Mock booking timezone | Real `Europe/Amsterdam` only; DST tests required |

## Traceability

Updated during roadmap creation (2026-06-14). Each requirement maps to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 0 | Pending |
| FND-02 | Phase 0 | Pending |
| FND-03 | Phase 0 | Pending |
| FND-04 | Phase 0 | Pending |
| FND-05 | Phase 0 | Pending |
| FND-06 | Phase 0 | Pending |
| FND-07 | Phase 0 | Pending |
| FND-08 | Phase 0 | Pending |
| SEO-01 | Phase 0 | Pending |
| SEO-02 | Phase 0 | Pending |
| SEO-03 | Phase 0 | Pending |
| SEO-04 | Phase 0 | Pending |
| SEO-05 | Phase 0 | Pending |
| SEO-06 | Phase 0 | Pending |
| SEO-07 | Phase 0 | Pending |
| SEO-08 | Phase 0 | Pending |
| SEO-09 | Phase 0 | Pending |
| SEO-10 | Phase 0 | Pending |
| SEO-11 | Phase 0 | Pending |
| SCH-01 | Phase 0 | Pending |
| SCH-02 | Phase 0 | Pending |
| SCH-03 | Phase 0 | Pending |
| SCH-04 | Phase 0 | Pending |
| SCH-05 | Phase 0 | Pending |
| SCH-06 | Phase 0 | Pending |
| SCH-07 | Phase 0 | Pending |
| SCH-08 | Phase 0 | Pending |
| LND-01 | Phase 1 (sub-unit 1 — Hero) | Pending |
| LND-02 | Phase 1 (sub-unit 2 — Header) | Pending |
| LND-03 | Phase 1 (sub-unit 3 — Intro) | Pending |
| LND-04 | Phase 1 (sub-unit 4 — Voor wie) | Pending |
| LND-05 | Phase 1 (sub-unit 5 — Aanpak accordion) | Pending |
| LND-06 | Phase 1 (sub-unit 6 — Praktische info) | Pending |
| LND-07 | Phase 1 (sub-unit 7 — Over de practitioner) | Pending |
| LND-08 | Phase 1 (sub-unit 8 — FAQ) | Pending |
| LND-09 | Phase 1 (sub-unit 9 — Citation blocks) | Pending |
| LND-10 | Phase 1 (sub-unit 10 — Inline contact) | Pending |
| LND-11 | Phase 1 (sub-unit 11 — Booking CTA) | Pending |
| LND-12 | Phase 1 (sub-unit 12 — Footer) | Pending |
| LND-13 | Phase 1 (sub-unit 7 — Testimonials seeded in Over) | Pending |
| LND-14 | Phase 1 (sub-unit 9 — Glossary with citations) | Pending |
| LND-15 | Phase 1 (cross-section copy gate) | Pending |
| RES-01 | Phase 2 | Pending |
| RES-02 | Phase 2 | Pending |
| RES-03 | Phase 2 | Pending |
| INT-01 | Phase 3 | Pending |
| INT-02 | Phase 3 | Pending |
| INT-03 | Phase 3 | Pending |
| INT-04 | Phase 3 | Pending |
| INT-05 | Phase 3 | Pending |
| INT-06 | Phase 3 | Pending |
| INT-07 | Phase 3 | Pending |
| INT-08 | Phase 3 | Pending |
| PRF-01 | Phase 0 (image primitive configured) | Pending |
| PRF-02 | Phase 1 (sub-unit 1 — Hero preload) | Pending |
| PRF-03 | Phase 1 (per-section enforcement) | Pending |
| PRF-04 | Phase 1 (sub-unit DoD) | Pending |
| PRF-05 | Phase 1 (sub-unit DoD) | Pending |
| PRF-06 | Phase 1 (sub-unit DoD) | Pending |
| PRF-07 | Phase 1 (no 3p JS on `/`) | Pending |
| PRF-08 | Phase 0 (CI budget gate skeleton) | Pending |
| A11Y-01 | Phase 1 (per-section WCAG 2.2 AA) | Pending |
| A11Y-02 | Phase 1 (sub-unit 10 — contact form labels) | Pending |
| A11Y-03 | Phase 1 (per-section tap targets) | Pending |
| A11Y-04 | Phase 1 (screen-reader walkthrough at end) | Pending |
| A11Y-05 | Phase 0 (pa11y/axe CI skeleton) | Pending |
| LGL-01 | Phase 4 | Pending |
| LGL-02 | Phase 4 | Pending |
| LGL-03 | Phase 4 | Pending |
| LGL-04 | Phase 4 | Pending |
| LGL-05 | Phase 4 | Pending |
| LGL-06 | Phase 4 | Pending |
| LGL-07 | Phase 4 | Pending |
| LGL-08 | Phase 4 | Pending |
| LGL-09 | Phase 4 | Pending |
| LGL-10 | Phase 4 | Pending |
| LGL-11 | Phase 4 | Pending |
| LCH-01 | Phase 5 | Pending |
| LCH-02 | Phase 5 | Pending |
| LCH-03 | Phase 5 | Pending |
| LCH-04 | Phase 5 | Pending |
| LCH-05 | Phase 5 | Pending |
| LCH-06 | Phase 5 | Pending |
| LCH-07 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 84 total (FND 8 + SEO 11 + SCH 8 + LND 15 + RES 3 + INT 8 + PRF 8 + A11Y 5 + LGL 11 + LCH 7 = 84 unique IDs)
- Mapped to phases: 84
- Unmapped: 0
- Each requirement maps to exactly one phase (no duplicates, no orphans)

**Per-phase counts:**
- Phase 0 (Foundation & SEO Scaffolding): 30 (FND 8 + SEO 11 + SCH 8 + PRF-01 + PRF-08 + A11Y-05)
- Phase 1 (Landing Sections, 12 sub-units): 25 (LND 15 + PRF-02 → PRF-07 = 6 + A11Y-01 → A11Y-04 = 4)
- Phase 2 (Reserved-Page Deepening): 3 (RES)
- Phase 3 (Integrations): 8 (INT)
- Phase 4 (Legal & Copy Gate): 11 (LGL)
- Phase 5 (Launch & Monitoring): 7 (LCH)
- Total: 30 + 25 + 3 + 8 + 11 + 7 = 84 ✓

---
*Requirements defined: 2026-06-14*
*Last updated: 2026-06-14 after roadmap creation*
