# Project Research Summary

**Project:** Trinity Breath & Healing
**Domain:** Dutch-language SEO/AEO-first marketing website for a Holland-based breathwork & trauma-release practice (v1 = landing page only; v2+ adds topic hubs + blog + kennisbank)
**Researched:** 2026-06-14
**Confidence:** HIGH on architecture/SEO/AEO/pitfalls (grounded in `seo-aeo-samenvatting-checklist.md`, itself sourced to Princeton/KDD 2024 GEO, HubSpot AI Search Trends 2025, and 2026 crawler refs). MEDIUM on stack patch versions (no live web verify this round) and Dutch advertising-law specifics (flagged for legal review pre-launch).

## Executive Summary

This is a **trust-driven Dutch wellness marketing site** whose only real success metric is *being found AND cited* by Google, AI Overviews, ChatGPT, Perplexity, and Claude on Dutch breathwork/trauma queries. Expert practice in this category is well-documented and surprisingly opinionated: AI crawlers do not run JavaScript, so the site MUST emit content + meta + JSON-LD in the initial HTML; AI engines cite definitive, attributed, answer-first content (+30–41% citation lift from stats/quotes/sources per KDD 2024 GEO); and the Dutch market layers in NAP-entity consistency, AVG/GDPR, and Wet BIG / Reclame Code advertising constraints. Everything follows from those three facts.

The recommended approach is an **Astro 5 SSG site on Cloudflare Pages**, with `schema-dts`-typed JSON-LD, Cal.com inline embed (lazy, below fold) for the 30-min Google Meet booking, Resend EU for transactional email, Plausible EU for cookieless analytics, and git-MDX content collections in v1 (Sanity EU upgrade path for v2). Architecture is a **hub-spoke topical model** (`/breathwork`, `/trauma-release`, `/lichaamswerk`, `/over-ons`), but v1 ships only `/` plus three real-but-thin reserved pages (`/over-ons`, `/contact`, `/boeken`) so v2 expansion adds URLs without any 301s. Default rendering is SSG; SSR is limited to `/api/contact` and `/boeken`. Build sequence is per-section, hero-first, mobile-first per user preference, gated by three CI checks (one-H1-per-page, meta-validation, JSON-LD validity) and a CWV budget (LCP<2.5s / INP<200ms / CLS<0.1).

The dominant risks are **invisibility risks**, not bug risks: a wildcard `Disallow` above AI-crawler allows in `robots.txt`; client-side rendering or JS-injected meta blinding bots; the Cal.com embed wrecking LCP; hedge-language wellness copy yielding nothing for AI to extract; and unsubstantiated medical claims triggering Dutch advertising-law complaints. Each maps to a phase gate. The biggest cross-cutting risk is the user's "hero first, per section" granularity bias — visible progress masking SEO/AEO debt — which is why **Phase 0 must lock the meta/schema/landmark primitives + robots.txt + sitemap + base schema before any visual section is built**.

## Key Findings

### Recommended Stack

A zero-runtime, EU-hosted, SSG-first stack chosen so the AI-crawler initial-HTML constraint is the *default* rather than an opt-in. Astro is the only mainstream framework whose default output for a static page is zero-JS HTML, which directly maximizes LCP and crawler visibility; every other choice cascades from "EU data residency + low CWV impact + low operational cost." See `.planning/research/STACK.md` for full rationale, version-pin caveats (`[VERIFY]` markers), and alternatives considered.

**Core technologies:**
- **Astro 5** (framework, TS strict): SSG-by-default + content collections + native i18n — cleanest possible initial HTML for AI crawlers, best LCP for a content-heavy marketing site
- **Cloudflare Pages** + `@astrojs/cloudflare`: AMS POP, no cold start on Workers form/booking endpoints, free at this scale, EU posture
- **Cal.com** (booking, cloud or self-hosted): open source, native Google Meet auto-create, Dutch locale, inline-embed below the fold lazy
- **Resend (EU `eu-west-1`)** + React Email: EU data residency, best DX, Worker-compatible for `/api/contact`
- **Plausible Cloud (EU)** + Google Search Console: cookieless (no banner → no CLS/INP hit), ~1KB; Search Console is non-negotiable source of truth
- **`schema-dts`** + hand-rolled `<JsonLd>` emitter: TS-typed schema.org → typos become compile errors
- **Astro Content Collections (git-MDX + Zod)** v1; **Sanity EU dataset** v2 upgrade path
- **Tailwind v4** (build-time atomic CSS), **Sharp** (build-time AVIF/WebP, explicit dimensions → CLS=0), self-hosted woff2 fonts with `font-display: swap`

**Verification gaps** (`[VERIFY]` in STACK.md): Astro 5 current stable minor + Tailwind v4 integration; Cal.com Cloud EU plan + `nl` locale coverage; Resend `eu-west-1` plan availability; Cloudflare Pages free-tier Worker limits; Plausible EU pricing.

### Expected Features

Landing-page-only v1 with a ruthless cut: every feature judged first on SEO/AEO impact, then conversion, then aesthetics. Full landscape (20 table stakes, 15 differentiators, 20 anti-features) lives in `.planning/research/FEATURES.md`.

**Must have (table stakes — v1 fails without):**
- **Above-the-fold hero**: definitive H1 (practice + modality + outcome), one-sentence value prop, primary CTA "Boek een kennismaking", real practitioner photo (no stock)
- **Answer-first "Wat is ademwerk?" definition block** within first ~150 words
- **Practitioner bio with credentials + lineage** (E-E-A-T core; Person schema source)
- **FAQ section** (8–12 Q's, question as H2/H3, 50–150 word answer, answer in sentence 1) + `FAQPage` JSON-LD — the AEO money block
- **Service walkthrough** ("Wat gebeurt er in een sessie?") + "Voor wie / Niet voor wie" qualification block
- **3–5 named testimonials** (first name + city, written consent on file, no diagnosis language)
- **Inline contact form** → Worker → Resend (name/email/message, optional phone, honeypot, rate-limit, AVG consent unchecked by default)
- **30-min Google Meet booking** via Cal.com inline embed below fold on `/boeken`
- **Footer NAP** + `mailto:` + `tel:` + WhatsApp + Instagram, all plain text in HTML
- **`robots.txt`** with explicit `Allow: /` blocks for `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Claude-User`, `Google-Extended`, `Applebot-Extended` placed BEFORE any `User-agent: *`, + sitemap reference
- **Initial-HTML SEO baseline**: unique `<title>` (50–60), meta description (150–160), canonical, OG, Twitter, `hreflang="nl"` + `x-default`, one H1, semantic landmarks, XML sitemap, visible `dateModified`
- **JSON-LD `@graph`**: `Organization` + `LocalBusiness` (or `Organization`+`Service` if address-private) + `Person` + `Service` + `FAQPage` + `WebSite` + `BreadcrumbList` (on `/over-ons`, `/contact`, `/boeken`)
- **CWV + a11y baseline**: LCP<2.5s / INP<200ms / CLS<0.1, WCAG 2.2 AA
- **AVG / Dutch legal baseline**: privacy policy linked from footer, KvK in footer, AVG-compliant form consent, Wet BIG-safe copy (experience framing), disclaimer near booking CTA, trauma trigger warning where relevant

**Should have (competitive — high leverage at low cost):**
- **3 citeable stat/research blocks with outbound attribution** (+32% stats, +30% citations, +41% quotes per KDD 2024 — stack all three)
- **Glossary / inline definition blocks** for 5–8 core terms (ademwerk, trauma release, zenuwstelsel-regulatie, somatisch/lichaamsgericht werken)
- **Professional association badges** (CAT/NFG/RBCZ if applicable — outbound link strengthens entity graph)
- **Google Business Profile link / review badge** (NL local-pack signal)
- **WhatsApp `wa.me/` link** (NL-native 1-to-1 channel)
- **`<details>` accordion** for Frame 2 mobile (content stays in DOM → crawler-visible)
- **Sticky/near-bottom mobile booking CTA** in thumb zone

**Defer (v2+):**
- Blog (`/blog/*`) and kennisbank (`/kennisbank/*`) — topical-authority expansion, primary AEO play
- EN translation with full hreflang (infrastructure ready, content not)
- Aggregate review schema (only once >5 real reviews)
- Sanity CMS migration (>50 pages or 3+ editors)
- Newsletter signup, video testimonials, press strip, multi-language beyond NL/EN

**Anti-features explicitly NOT built** (FEATURES.md §Anti-Features + STACK.md "What NOT to Use"): autoplay hero video, JS-loaded testimonials/carousel, vague marketing speak, hedge language, before/after medical claims, "genezing/therapie" language without BIG, live chat widgets, pop-ups, intrusive cookie banner, reCAPTCHA, carousels/sliders, splash pages, embedded YouTube as primary content, "klik hier" anchors, stock wellness photography, `llms.txt`/`llms-full.txt` (no proven retrieval effect 2026), CSR/SPA frameworks, Calendly inline at top of page, Formspree-class form relays, GA4 with cookie banner, CSS-in-JS runtimes, client-side language switcher, lazy-loaded hero, service workers in v1, Vercel hosting.

### Architecture Approach

A **hub-spoke topical model** with three invariants — content+meta in initial HTML, one H1 + semantic landmarks per page, URL=identity — and a v1→v2 migration plan that adds URLs without any 301s. v1 ships `/` plus three real-but-thin reserved pages (`/over-ons`, `/contact`, `/boeken`) so v2 deepening + addition of `/breathwork`, `/trauma-release`, `/lichaamswerk` is purely additive. Default rendering SSG; SSR limited to `/api/contact` and `/boeken` action. Full detail in `.planning/research/ARCHITECTURE.md`.

**Major components:**
1. **Layout primitives** (`<RootLayout>`, `<Head>`, `<JsonLd>`, `<PageTitle>`, `<SectionTitle>`, `<SiteHeader>`, `<SiteFooter>`, `<Breadcrumbs>`, `<RelatedContent>`, `<FaqBlock>`, `<CitationBlock>`, `<ImageHero>`, `<ImageLazy>`) — enforce SEO invariants by construction
2. **Hub-spoke topical model** — three topic hubs + one trust hub; v1 prefigures these as named sections on `/` so v2 extraction is a lift-and-rename
3. **Per-section landing build** (12 sections: hero → header/nav → intro → voor-wie → aanpak (accordion) → praktische info → over-de-practitioner → FAQ → citation blocks → contact → booking CTA → footer); mobile-first per Figma, each section = one PR
4. **JSON-LD composition pipeline** — single `<script type="application/ld+json">` per page composed from `src/lib/schema/shared.ts` (`Organization`, `LocalBusiness`, `WebSite`, `Person`) + per-route payload, deduped by `@id`, three-gate validation
5. **Meta-tag pipeline** — typed `PageMeta` prop driving deterministic `<Head>` emitter; CI gate enforces length + uniqueness
6. **Form + booking architecture** — same-origin Worker `/api/contact` with Zod + honeypot + rate-limit → Resend EU; Cal.com inline embed on `/boeken` lazy below fold, `Europe/Amsterdam` timezone explicit
7. **Crawler/sitemap layer** — static `robots.txt` with AI-allow blocks above wildcard; auto-generated `sitemap.xml`; Search Console DNS-TXT verified
8. **Asset pipeline** — Astro `<Image>` + Sharp (AVIF/WebP, explicit width/height), hero preloaded `fetchpriority="high" loading="eager"`, all else lazy; self-hosted woff2 + `font-display: swap` + metric-matched fallback
9. **CI gate suite** — one-H1-per-page, meta-validation, JSON-LD validity (parse + schema-dts + Rich Results), Lighthouse CI (LCP/INP/CLS), pa11y/axe (WCAG 2.2 AA), internal-link graph (v2-tightened)

### Critical Pitfalls

Full 20-pitfall catalogue with prevention/recovery in `.planning/research/PITFALLS.md`. The five the roadmap must structurally prevent:

1. **`robots.txt` wildcard `Disallow` above AI-crawler allows** (Pitfall #2) — silent invisibility to OAI-SearchBot/PerplexityBot/ClaudeBot. *Avoid:* hand-written `robots.txt` in Phase 0 with explicit per-crawler `Allow` blocks BEFORE `User-agent: *`; resolve training-crawler decision (`Google-Extended`, `Applebot-Extended`) and document in PROJECT.md.
2. **CSR / JS-injected meta / lazy-loaded hero blinds AI crawlers** (Pitfalls #1 + #6) — empty initial HTML = zero indexable content. *Avoid:* Astro SSG default; H1 + meta + JSON-LD enforced via primitives in Phase 0; hero gets `<link rel="preload" as="image" fetchpriority="high">`, never `loading="lazy"`; verified per route with `curl -A "OAI-SearchBot" <url> | grep '<h1\|<meta name="description"'`.
3. **Cal.com booking embed wrecks LCP/INP** (Pitfall #8) — third-party widget on initial load can push LCP past 5s. *Avoid:* widget loads only on `/boeken` (separate SSG-shell page), `client:visible` below fold; landing CTA links to `/boeken`; CWV budget enforced in CI; DST-transition end-to-end test.
4. **Hedge language collides with wellness tone AND with Wet BIG legal pressure** (Pitfalls #3 + #4 + #11) — vague "misschien werkt het" yields zero AI citations; unsubstantiated "geneest trauma" triggers Reclame Code complaints. *Avoid:* enforced two-sentence pattern (definitive answer + nuance/safety); experience framing only ("begeleidt bij...", never "geneest"); disclaimer + trauma warning visible; testimonials with consent on file + no diagnosis names; Phase 4 Dutch-counsel gate.
5. **Per-section granularity bias drops cross-cutting concerns** (Pitfall #20) — visible-progress reward biases against invisible SEO scaffolding. *Avoid:* Phase 0 lock-in BEFORE any visual section; per-section DoD includes Lighthouse SEO=100, A11y=100, JSON-LD valid, unique meta, CWV met, hedge-language scan passed, claims reviewed.

Honorable mentions: SPF/DKIM/DMARC on sending domain (#9); Google Meet auto-create + `Europe/Amsterdam` end-to-end DST test (#10); NAP entity consistency locked before off-site listing (#12); FAQPage JSON-LD wired from same source as accordion (#13); canonical/hreflang correct from day one (#15 + #17).

## Implications for Roadmap

Landing-page-only v1 scope means phases are smaller and more sequential than a typical multi-page rollout — the per-section build IS the bulk of the roadmap, not a sub-phase.

### Phase 0: Architectural Lock-in (before any visible section)

**Rationale:** PITFALLS #1, #2, #5, #6, #15, #16, #20 are preventable only if scaffolding ships first.
**Delivers:** Astro 5 + TS strict + `@astrojs/cloudflare` + Tailwind v4 + MDX + sitemap scaffolded; `<RootLayout>`, `<Head>`, `<JsonLd>`, `<PageTitle>`, `<SectionTitle>`, `<SiteHeader>`, `<SiteFooter>` primitives; `robots.txt` with AI-allow blocks + sitemap ref; sitemap stub; canonical + hreflang infra; shared schema (`Organization`, `LocalBusiness` or `Organization`+`Service`, `WebSite`, `Person`); design tokens from Figma; mobile-first reset + grid; CI gates skeleton; self-hosted woff2 + preloaded primary weight; reserved 200-response URLs `/over-ons`, `/contact`, `/boeken` with stub + canonical; Search Console DNS TXT kicked off; Cloudflare Pages + Wrangler config; `SITE_URL` env strategy (no localhost default).
**Avoids:** Pitfalls #1, #2, #5, #6, #14, #15, #16, #17, #20.

### Phase 1: Landing Sections (Hero-First, Mobile-First, 12 PRs in order)

**Rationale:** ARCHITECTURE §11.2 codifies build order. Hero first carries page identity (H1, LCP, OG image); FAQ before contact because FAQ is AEO citation driver; practitioner inline before FAQ so E-E-A-T precedes cited content. Each section = one PR with section-level DoD.
**Delivers (in order, each = one PR):** 1) Hero · 2) Site header + mobile hamburger · 3) Intro / "Wat is ademwerk?" answer-first · 4) Voor wie · 5) Aanpak `<details>` accordion (Frame 2) · 6) Praktische info (LocalBusiness source; Frame 4 active state) · 7) Over de practitioner inline · 8) FAQ + FAQPage JSON-LD from same source · 9) Citation/proof blocks (stat + quote + outbound) · 10) Inline contact section (Worker wired Phase 3) · 11) Booking CTA → `/boeken` · 12) Footer (NAP + mailto + tel + WhatsApp + Instagram + KvK + privacy link + `dateModified`).
**Addresses:** Table-stakes #1–9, #11–14, #19–20; differentiators #21–#26, #30.
**Avoids:** Pitfalls #3, #4, #6, #11, #13, #18, #19, #20.

### Phase 2: Reserved-Page Expansion (`/over-ons`, `/contact`, `/boeken`)

**Rationale:** ARCHITECTURE §2.2 — already exist as 200-stubs from Phase 0; this deepens them so v2 has no 301s.
**Delivers:** Full `/over-ons` (Person schema deepened); full `/contact` (form repeated standalone + NAP + opening hours + KvK + processor list); `/boeken` page shell (H1 + meta + schema + lazy mount-point).
**Avoids:** Pitfalls #14, #17.

### Phase 3: Integrations (Form Worker + Resend; Cal.com Embed; Plausible)

**Rationale:** Forms and booking depend on Phase 0's adapter and Phase 2's page shells. DNS/SPF/DKIM/DMARC takes up to 48h — schedule early. Cal.com is highest CWV-risk integration.
**Delivers:** `/api/contact` Worker (Zod + honeypot + rate-limit 5/hour + Resend EU dispatch + auto-reply + AVG consent); Resend domain verified (SPF + DKIM + DMARC); end-to-end deliverability test (Gmail/Outlook/iCloud); Cal.com event type (30-min, `Europe/Amsterdam`, Meet on, `nl` locale); `/boeken` embeds widget `client:visible` below fold; Plausible script; DST end-to-end booking test; privacy policy listing all processors.
**Avoids:** Pitfalls #7, #8, #9, #10.
**Research flag:** vendor `[VERIFY]` items at contract time.

### Phase 4: Legal & Copy Gate (Pre-Launch)

**Rationale:** PITFALLS #3, #7, #11 + FEATURES open-question #3 (BIG status). Technically ship-ready but not legally without this.
**Delivers:** Hedge-language grep pass + two-sentence-pattern enforcement; every health claim reviewed by Dutch counsel (Wet BIG + Reclame Code); disclaimer near booking CTA + trauma trigger warnings; testimonial consent files; privacy policy counsel-reviewed; AVG consent flows verified (unchecked default, rejects unchecked submission, free-text-warning above message); NAP locked in PROJECT.md and matched off-site (GBP claimed, Instagram bio, KvK, directories); `sameAs` filled.
**Avoids:** Pitfalls #3, #7, #11, #12.
**Research flag:** Dutch counsel review mandatory; BIG status determines vocabulary scope; address-private decision finalized.

### Phase 5: Launch & Monitoring

**Rationale:** Cheap to plan, expensive to skip — CrUX and AI-citation surface take 28–90 days to stabilize.
**Delivers:** Prod deploy to Cloudflare Pages; Search Console sitemap submitted; URL Inspection on all four pages shows content + structured data; `curl -A "OAI-SearchBot" <url>` verification per route; 28-day CWV check via CrUX; weekly Search Console review; Perplexity/ChatGPT/Claude test queries on target Dutch phrases over 60–90 days; server-log review for AI-crawler hits within 30 days.
**Avoids:** Pitfalls #2 (silent block — caught by log review), #14, #16, #18.

### Phase Ordering Rationale

- **Phase 0 before any visible section** is the dominant pattern across all 4 research files — STACK assumes adapter in place; ARCHITECTURE assumes primitives exist; PITFALLS treats Phase 0 lock-in as prevention for 9 of 20 pitfalls; FEATURES treats SSR/SSG as the gateway dependency.
- **Section-by-section landing in Phase 1** because user explicitly asked for hero-first, mobile-first, per-section granularity; ARCHITECTURE §11.2 codifies the 12-section order.
- **Reserved URLs (Phase 2) before integrations (Phase 3)** because form Worker needs `/contact` shell and Cal.com needs `/boeken` shell.
- **Integrations (Phase 3) before legal/copy gate (Phase 4)** because privacy policy must list actual processors with confirmed configurations.
- **Legal gate (Phase 4) before launch (Phase 5)** is not negotiable for health-adjacent content under Wet BIG + Reclame Code + AVG.
- **Launch verification (Phase 5)** is its own phase, not a final-PR afterthought, because CrUX field data and AI-citation surface take 28–90 days to stabilize.

### Research Flags

Needs deeper research during planning:
- **Phase 0** — *light flag*: confirm Astro 5 + Tailwind v4 + `@astrojs/cloudflare` patch versions at `npm install` (STACK.md `[VERIFY]`).
- **Phase 3** — *medium flag*: Cal.com Cloud EU plan + `nl` locale; Resend `eu-west-1` plan + DMARC posture; Plausible EU pricing; Cloudflare Workers free-tier limits. Contract-time checks.
- **Phase 4** — *strong flag*: Wet BIG protected-title scope for non-BIG breathwork; Reclame Code Stichting current guidance; AVG/ePrivacy 2026 interpretation on cookieless-no-banner. Dutch counsel review mandatory.

Standard patterns (skip research-phase):
- **Phase 1** — well-documented; ARCHITECTURE §11.2 + FEATURES catalogue cover everything.
- **Phase 2** — pure derivation from Phase 1 components.
- **Phase 5** — standard Search Console / CrUX / log-review patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Architectural picks (Astro / Cloudflare / `schema-dts` / Plausible / Resend posture) HIGH from verified source doc; patch versions + vendor plans MEDIUM with `[VERIFY]` flags; Cal.com Cloud EU + `nl` + Meet auto-create MEDIUM-LOW until dashboard-confirmed |
| Features | MEDIUM-HIGH | SEO/AEO cross-verified against checklist (HIGH); conversion patterns from 2024–2026 UX research (MEDIUM); Dutch legal items MEDIUM and flagged for legal review |
| Architecture | HIGH | Hub-spoke + SSG default + SSR endpoints + primitives + JSON-LD `@graph` + per-section build order all derive directly from checklist §A, §5, §C, §E; topic selection (breathwork/trauma-release/lichaamswerk) MEDIUM — validate with practitioner before v2 |
| Pitfalls | HIGH on SEO/AEO/CWV/integration | Cross-referenced against checklist, KDD 2024 GEO, HubSpot 2025, 2026 crawler refs, Gmail Sender Guidelines, Cal.com docs. Dutch advertising-law + AVG MEDIUM — general principles HIGH, product-specific needs counsel |

**Overall confidence:** MEDIUM-HIGH. Architecture + SEO/AEO layer are ship-ready to plan. The two MEDIUM gates blocking launch: (a) vendor-posture verification at install/contract (Phase 0 + Phase 3); (b) Dutch counsel sign-off on claims + AVG flows (Phase 4).

### Gaps to Address

Open questions consolidated across all 4 files, deduped and ranked by what blocks each phase:

**Blocks Phase 0 (lock before any code):**
- **Address situation**: physical / online-only / hybrid? Determines `LocalBusiness` vs `Organization`+`Service` schema and whether to publish a street address.
- **NAP final lock**: exact business name, address-or-city, phone (E.164), email, website URL — single source of truth in PROJECT.md before robots.txt and Organization JSON-LD ship.
- **Training-crawler decision**: allow `Google-Extended` + `Applebot-Extended` (= content trains AI = larger long-term citation surface) or disallow. Document in PROJECT.md and `robots.txt`.

**Blocks Phase 1 (landing sections):**
- **Photography availability**: real practitioner photo for hero? Critical-path dependency for sections 1 + 7. Stock is rejected (anti-feature A15).
- **Brand voice samples**: 1–2 paragraphs of the aunt's actual voice before copy drafting.
- **Testimonial inventory + consent**: 3–5 real testimonials with written consent on file, no diagnosis language?

**Blocks Phase 3 (integrations):**
- **CMS need for the aunt**: Sveltia CMS overlay on git v1 or PR-based editing acceptable? Affects scaffolding marginally.
- **Pricing transparency**: price on page (FAQ #6)? Affects copy + booking tone.

**Blocks Phase 4 (legal/copy):**
- **BIG / non-BIG status**: determines available vocabulary scope.
- **Professional association membership**: CAT, NFG, RBCZ — affects badges + outbound links + `memberOf`.
- **Existing Google Business Profile**: claimed/verified? Affects review strategy and NAP audit scope.

**Blocks Phase 5 (launch monitoring):**
- **Domain DNS access**: required for Search Console, Resend SPF/DKIM/DMARC, Cloudflare Pages, DMARC reporting. Confirm who holds DNS.

**Tooling caveats:** WebSearch / WebFetch / Context7 / `ctx_fetch_and_index` denied this round (and in upstream researcher runs). Architectural recommendations HIGH-confidence because they derive from the verified reference doc which is itself sourced. Patch versions + current vendor pricing + Dutch legal interpretation + 2026 vendor-plan posture must be re-verified before commitment per `[VERIFY]` flags.

## Sources

### Primary (HIGH confidence)
- `seo-aeo-samenvatting-checklist.md` (project root) — Dutch SEO/AEO playbook, verified 2026
- `.planning/PROJECT.md` — scope, audience (W/C/L), constraints, Out of Scope
- Aggarwal et al., *GEO: Generative Engine Optimization* — Princeton/Georgia Tech/Allen AI/IIT Delhi, ACM KDD 2024 (arXiv:2311.09735) — +41% quotes, +32% stats, +30% citations, +28% language
- HubSpot AI Search Trends 2025 — recency-citation correlation (~3× lift)
- AI-crawler/robots.txt refs 2026 (Anagram, CapstonAI, Citevera, No Hacks) — search/RAG vs training crawlers; `llms.txt` confirmed not honored
- Google Search Central docs — Rich Results Test, CrUX Core Web Vitals, E-E-A-T / YMYL guidelines
- web.dev Core Web Vitals — LCP/INP/CLS thresholds
- Schema.org + Google `schema-dts` — typed schema.org
- Google robots.txt specification — user-agent specificity
- Gmail Sender Guidelines (Feb 2024) — SPF + DKIM + DMARC

### Secondary (MEDIUM confidence)
- Astro / Cloudflare Pages / Cal.com / Resend / Plausible / Tailwind v4 official docs — prior verified knowledge through 2025/early-2026; flagged `[VERIFY]` at install/contract time
- Conversion patterns for service-based wellness sites — 2024–2026 UX research synthesis; validate with live competitor audit
- Cal.com + Calendly integration docs; Google Calendar API conferenceData v2

### Tertiary (LOW confidence — flagged for legal counsel pre-launch)
- Nederlandse Reclame Code (reclamecode.nl) + NVWA — Dutch advertising regulation; Wet BIG context
- AVG + Autoriteit Persoonsgegevens — Dutch GDPR; Art. 9 special-category for free-text intake
- ePrivacy Directive — cookie consent; cookieless-no-banner pattern
