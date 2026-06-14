# Roadmap: Trinity Breath & Healing

**Created:** 2026-06-14
**Granularity:** fine
**Mode:** yolo
**Coverage:** 70/70 v1 requirements mapped (100%)

## Core Value Reminder

**SEO + AEO discoverability of trustworthy, citeable content** — every phase is judged first on SEO/AEO impact, then conversion, then aesthetics. Visual fidelity to Figma matters, but never at the expense of discoverability.

## Phases

- [ ] **Phase 0: Foundation & SEO Scaffolding** — Astro 5 + Cloudflare + primitives + robots.txt + sitemap + shared schema + design tokens + CI gates skeleton + reserved stub URLs (lock-in BEFORE any visible section)
- [ ] **Phase 1: Landing Sections (Hero-First, Mobile-First, 12 sub-units)** — Build the landing page section by section in the order: hero → header → intro → voor-wie → aanpak → praktische info → over-de-practitioner → FAQ → citation blocks → contact → booking CTA → footer
- [ ] **Phase 2: Reserved-Page Deepening** — Expand `/over-ons`, `/contact`, `/boeken` stubs into real pages (Person schema deepened, standalone contact, booking shell with lazy mount-point)
- [ ] **Phase 3: Integrations (Form Worker + Resend + Cal.com + Plausible)** — `/api/contact` Worker → Resend EU dispatch; Cal.com 30-min Meet event type embedded `client:visible` on `/boeken`; Plausible cookieless analytics; DST end-to-end booking test
- [ ] **Phase 4: Legal & Copy Gate (Pre-Launch)** — Hedge-language grep, two-sentence-pattern enforcement, Dutch counsel sign-off on health claims, testimonial consent files, privacy policy review, NAP off-site consistency
- [ ] **Phase 5: Launch & Monitoring** — Production deploy, Search Console submission, AI-crawler curl verification per route, 28-day CrUX CWV check, 60–90-day Perplexity/ChatGPT/Claude citation tracking

## Phase Details

### Phase 0: Foundation & SEO Scaffolding

**Goal**: A deployable Astro 5 scaffold whose default output for any route is content + meta + JSON-LD in initial HTML — primitives, robots.txt, sitemap, shared schema, design tokens, reserved stub URLs, and CI gates are all in place BEFORE any visible landing section is built.

**Depends on**: Nothing (foundation phase)

**Requirements**:
- FND-01, FND-02, FND-03, FND-04, FND-05, FND-06, FND-07, FND-08
- SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07, SEO-08, SEO-09, SEO-10, SEO-11
- SCH-01, SCH-02, SCH-03, SCH-04, SCH-05, SCH-06, SCH-07, SCH-08
- PRF-01 (Astro `<Image>` + Sharp primitive configured), PRF-08 (CI budget gate skeleton wired)
- A11Y-05 (pa11y/axe CI gate skeleton wired)

**Success Criteria** (what must be TRUE):
  1. `astro build` produces a clean Cloudflare Pages bundle and `curl -A "OAI-SearchBot" https://<staging>/` returns initial HTML containing exactly one `<h1>`, a 50–60-char `<title>`, a 150–160-char meta description, a canonical, and one `<script type="application/ld+json">`.
  2. `/robots.txt` is served at the edge with explicit `Allow: /` blocks for `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Claude-User`, `Google-Extended`, and `Applebot-Extended` placed BEFORE any `User-agent: *` directive, and `/sitemap.xml` is auto-generated and referenced from robots.txt.
  3. `/over-ons`, `/contact`, and `/boeken` each return HTTP 200 with a stub page that already emits per-page title + meta + canonical + JSON-LD (zero-301 migration guarantee for v2).
  4. CI fails the build if any rendered route has zero or multiple `<h1>`, missing/duplicate meta description, an invalid canonical, an unparseable JSON-LD `@graph`, or a schema-dts type error.
  5. Search Console DNS-TXT verification has been kicked off (acknowledging up-to-48h propagation) and `SITE_URL` env strategy has no localhost default in the build.

**Plans**: TBD
**UI hint**: no (primitives + design tokens only; no visible sections yet)

### Phase 1: Landing Sections (Hero-First, Mobile-First, 12 sub-units)

**Goal**: A complete, Figma-faithful Dutch landing page where every section is server-rendered in initial HTML, the hero is the LCP element preloaded eagerly, FAQ and citation blocks drive AEO citation lift, and per-section DoD gates (Lighthouse SEO=100, A11y=100, CWV budgets, JSON-LD valid, hedge-language scan) pass at the boundary of every sub-unit PR.

**Depends on**: Phase 0 (primitives, design tokens, reserved URLs, CI gates)

**Requirements**:
- LND-01, LND-02, LND-03, LND-04, LND-05, LND-06, LND-07, LND-08, LND-09, LND-10, LND-11, LND-12, LND-13, LND-14, LND-15
- PRF-02, PRF-03, PRF-04, PRF-05, PRF-06, PRF-07 (per-section enforcement: hero preload, lazy below fold, no render-blocking 3p JS on `/`, CWV budgets met)
- A11Y-01, A11Y-02, A11Y-03, A11Y-04 (per-section WCAG 2.2 AA, form labels, 44×44 tap targets, screen-reader walkthrough)

**Sub-units (each = one PR/plan, built in order):**
  1. Hero (LND-01, PRF-02, PRF-04) — H1 + value prop + primary CTA + preloaded practitioner photo
  2. Site header (LND-02) — logo, nav anchor links, mobile hamburger
  3. Intro / "Wat is ademwerk?" (LND-03, LND-15) — answer-first definition in first ~150 words
  4. Voor wie / Niet voor wie (LND-04)
  5. Aanpak `<details>` accordion (LND-05) — Frame 2 mobile, content stays in DOM
  6. Praktische info (LND-06) — Frame 4, LocalBusiness source data
  7. Over de practitioner inline (LND-07, LND-13 testimonials seeded here) — Person schema mirror
  8. FAQ (LND-08) — 8–12 Q's, same source as FAQPage JSON-LD
  9. Citation / proof blocks (LND-09, LND-14 glossary) — stat + quote + outbound source
  10. Inline contact section (LND-10) — UI only; Worker wiring happens in Phase 3
  11. Booking CTA → `/boeken` (LND-11) — anchor button, NO Cal.com mount on `/`
  12. Footer (LND-12) — NAP, mailto, tel, WhatsApp, Instagram, KvK, privacy link, `dateModified`

**Success Criteria** (what must be TRUE):
  1. Every sub-unit PR's Lighthouse mobile run reports SEO=100, Accessibility=100, LCP<2.5s, INP<200ms, CLS<0.1 on the rendered landing page, and pa11y/axe CI reports zero WCAG 2.2 AA violations.
  2. `curl -A "OAI-SearchBot" https://<staging>/` returns initial HTML containing the section's headings, body text, and (where applicable) FAQPage JSON-LD entries — no client-rendered content.
  3. The hero image is the LCP element with `<link rel="preload" as="image" fetchpriority="high">` and `loading="eager"`, and no non-hero image renders without explicit `width`/`height` and `loading="lazy"`.
  4. The FAQ accordion and `FAQPage` JSON-LD are generated from a single source so the rendered Q/A list and the structured data are guaranteed to match.
  5. The landing page contains at least one statistic, one attributed quote, and one outbound citation link rendered in initial HTML (stacks KDD 2024 +30/+32/+41 % AEO lift).

**Plans**: TBD
**UI hint**: yes

### Phase 2: Reserved-Page Deepening

**Goal**: Turn the `/over-ons`, `/contact`, and `/boeken` Phase-0 stubs into full pages with their own H1, meta, JSON-LD, semantic landmarks, and breadcrumbs — so the v1 ships with three real-but-thin reserved URLs and v2 topical-hub expansion adds URLs without a single 301.

**Depends on**: Phase 1 (reuses landing primitives: header, footer, Person/LocalBusiness schema, contact-form UI block)

**Requirements**:
- RES-01, RES-02, RES-03

**Success Criteria** (what must be TRUE):
  1. `/over-ons` renders a full practitioner story with credentials, lineage, and photos; emits a deepened `Person` JSON-LD that cross-references the shared `Organization`/`LocalBusiness` `@id`s, and includes a `BreadcrumbList`.
  2. `/contact` renders a standalone contact form (same Worker contract as the inline landing form), visible NAP, opening hours, KvK, data-processor list, and a footer privacy link.
  3. `/boeken` renders an SSG shell with H1 + meta + JSON-LD + BreadcrumbList + a clearly marked lazy mount-point reserved for the Cal.com embed (no embed mounted yet — that happens in Phase 3).
  4. Lighthouse mobile on all three pages reports SEO=100, Accessibility=100, CWV budgets met, and `curl -A "OAI-SearchBot"` shows H1 + meta + JSON-LD in initial HTML on each.

**Plans**: TBD
**UI hint**: yes

### Phase 3: Integrations (Form Worker + Resend + Cal.com + Plausible)

**Goal**: All third-party plumbing wired end-to-end without regressing the landing-page CWV budget — `/api/contact` accepts validated, consented submissions and delivers them via Resend EU; `/boeken` mounts the Cal.com 30-min Google Meet event lazily below the fold; Plausible records cookieless analytics; DST end-to-end booking and Gmail/Outlook/iCloud deliverability tests pass.

**Depends on**: Phase 2 (form needs `/contact` shell, Cal.com needs `/boeken` shell)

**Requirements**:
- INT-01, INT-02, INT-03, INT-04, INT-05, INT-06, INT-07, INT-08

**Success Criteria** (what must be TRUE):
  1. POSTing the contact form (from the landing inline section and from `/contact`) succeeds only when AVG consent is checked, the honeypot is empty, and the IP is below 5 submissions/hour; a server-side Zod failure or missing consent returns 4xx and no email is sent.
  2. End-to-end deliverability test from the form lands in the practitioner inbox (and auto-reply lands in the submitter inbox) without spam-folder placement for Gmail, Outlook, and iCloud, with valid SPF + DKIM + DMARC on the sending domain.
  3. A test booking on `/boeken` creates a Cal.com event in `Europe/Amsterdam`, auto-generates a Google Meet link in the confirmation email, and re-runs cleanly across the October-end and March-start DST boundaries.
  4. Lighthouse mobile on `/` (no embed) still reports LCP<2.5s and INP<200ms after `/boeken` has the Cal.com embed mounted `client:visible` below the fold — the embed has zero impact on landing CWV.
  5. Plausible script is loaded site-wide cookielessly (no consent banner shipped) and the privacy policy explicitly lists Resend, Cal.com, Plausible, and Cloudflare as data processors.

**Plans**: TBD
**UI hint**: partial (mostly integration glue; thin UI work on the `/boeken` embed shell and form success/error states)

### Phase 4: Legal & Copy Gate (Pre-Launch)

**Goal**: The site is technically ship-ready but does not deploy to production until every health-adjacent claim, testimonial, disclaimer, AVG flow, and NAP entry has been reviewed and explicitly cleared — hedge language is replaced with the two-sentence pattern, Wet BIG / Reclame Code risk is signed off by Dutch counsel, AVG consent is verified end-to-end, and off-site NAP matches the locked source-of-truth.

**Depends on**: Phase 3 (privacy policy must list real, configured processors; AVG consent flow must be testable)

**Requirements**:
- LGL-01, LGL-02, LGL-03, LGL-04, LGL-05, LGL-06, LGL-07, LGL-08, LGL-09, LGL-10, LGL-11

**Success Criteria** (what must be TRUE):
  1. A hedge-language grep (`misschien`, `zou kunnen`, `wellicht`, etc.) over all rendered Dutch copy returns zero unsafe matches — every flagged instance has either been rewritten in the two-sentence pattern (definitive answer → nuance/safety) or paired with a definitive sentence.
  2. Every health-adjacent claim, testimonial, and disclaimer has been reviewed and signed off by Dutch counsel against Wet BIG and the Nederlandse Reclame Code; experience framing ("begeleidt bij…") replaces any therapeutic-cure language; trauma trigger warnings are visible above trauma-discussion sections; the booking-CTA disclaimer and above-contact-form disclaimer are visible.
  3. The AVG consent checkbox on `/api/contact` is unchecked by default, the server rejects submissions when unchecked (verified via integration test), and a free-text-warning is rendered above the message field.
  4. All displayed testimonials have written consent files on record, contain no diagnosis names, and the privacy policy (linked from every page footer) is counsel-reviewed, lists every data processor, and documents the cookieless-no-banner decision.
  5. The locked NAP source-of-truth in `.planning/PROJECT.md` matches the footer, the `Organization`/`LocalBusiness` JSON-LD, the Instagram bio, the KvK record, and (if claimed) the Google Business Profile character-for-character.

**Plans**: TBD
**UI hint**: no (content/legal/ops; no new UI shipped)

### Phase 5: Launch & Monitoring

**Goal**: The site is live in production on Cloudflare Pages, indexed via Search Console, verified-visible to AI crawlers per route, and instrumented for a 28-day Core Web Vitals stabilization window plus a 60–90-day AI-citation tracking program — so success against the SEO/AEO core value is observable, not assumed.

**Depends on**: Phase 4 (no production deploy before legal/copy sign-off)

**Requirements**:
- LCH-01, LCH-02, LCH-03, LCH-04, LCH-05, LCH-06, LCH-07

**Success Criteria** (what must be TRUE):
  1. `astro build` completes cleanly and Cloudflare Pages serves `/`, `/over-ons`, `/contact`, `/boeken`, `/robots.txt`, and `/sitemap.xml` on the production domain with HTTPS + HSTS.
  2. Sitemap is submitted in Google Search Console; URL Inspection on each of the four pages shows rendered content and structured data with no "blocked by robots.txt" or "Crawled - currently not indexed" errors.
  3. `curl -A "OAI-SearchBot" <prod-url>` on each route returns initial HTML containing the route's H1, meta description, canonical, and JSON-LD `@graph` — verified per route, recorded in a launch checklist.
  4. After 28 days in production, CrUX field data for the landing page reports LCP<2.5s, INP<200ms, CLS<0.1 on the mobile cohort; the server-log review within 30 days confirms at least one hit each from `OAI-SearchBot`, `PerplexityBot`, and `ClaudeBot` (no silent block).
  5. A tracking spreadsheet records Perplexity, ChatGPT, and Claude test-query results for the target Dutch breathwork/trauma phrases at 0, 30, 60, and 90 days post-launch, with the first 30-day cohort recorded.

**Plans**: TBD
**UI hint**: no (deploy, verification, monitoring)

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Foundation & SEO Scaffolding | 0/? | Not started | - |
| 1. Landing Sections (12 sub-units) | 0/12 | Not started | - |
| 2. Reserved-Page Deepening | 0/? | Not started | - |
| 3. Integrations | 0/? | Not started | - |
| 4. Legal & Copy Gate | 0/? | Not started | - |
| 5. Launch & Monitoring | 0/? | Not started | - |

## Coverage Audit

70 of 70 v1 requirements mapped to exactly one phase. Cross-cutting categories (PRF, A11Y) split between Phase 0 (gate setup: build configuration, CI skeleton, image primitive) and Phase 1 (per-section enforcement: hero preload, lazy below fold, WCAG 2.2 AA per section, screen-reader walkthrough).

| Category | Count | Phase Mapping |
|----------|-------|---------------|
| FND (Foundation) | 8 | Phase 0 |
| SEO (SEO Primitives) | 11 | Phase 0 |
| SCH (Structured Data / AEO) | 8 | Phase 0 |
| LND (Landing Sections) | 15 | Phase 1 (12 sub-units) |
| RES (Reserved-Page Deepening) | 3 | Phase 2 |
| INT (Integrations) | 8 | Phase 3 |
| PRF (Performance) | 8 | Phase 0 (PRF-01, PRF-08) + Phase 1 (PRF-02–07) |
| A11Y (Accessibility) | 5 | Phase 0 (A11Y-05) + Phase 1 (A11Y-01–04) |
| LGL (Legal & Copy) | 11 | Phase 4 |
| LCH (Launch & Monitoring) | 7 | Phase 5 |
| **Total** | **70** | **100% mapped** |

## Dependencies Summary

```
Phase 0 (Foundation)
   ↓
Phase 1 (Landing — 12 sub-units, hero first, mobile first)
   ↓
Phase 2 (Reserved pages deepened)
   ↓
Phase 3 (Form + Cal.com + Plausible integrations)
   ↓
Phase 4 (Legal & copy gate — Dutch counsel sign-off)
   ↓
Phase 5 (Production launch + 28-day CWV + 60–90-day AI-citation monitoring)
```

No parallel branches in v1: each phase strictly depends on its predecessor (Phase 1 needs the primitives, Phase 2 reuses landing components, Phase 3 needs the page shells, Phase 4 needs real processors configured, Phase 5 cannot deploy without legal sign-off).

## Research Flags

Carried over from `research/SUMMARY.md`:

- **Phase 0 (light)**: confirm Astro 5 + Tailwind v4 + `@astrojs/cloudflare` patch versions at `npm install` (STACK `[VERIFY]`).
- **Phase 3 (medium)**: confirm Cal.com Cloud EU plan + `nl` locale, Resend `eu-west-1` posture, Plausible EU pricing, Cloudflare Workers free-tier limits at contract time.
- **Phase 4 (strong)**: Dutch counsel review of Wet BIG protected-title scope for non-BIG breathwork, Reclame Code Stichting current guidance, AVG/ePrivacy 2026 interpretation of cookieless-no-banner. Counsel sign-off is non-negotiable for launch.

## Open Questions (Block Specific Phases)

From `research/SUMMARY.md` "Gaps to Address":

- **Blocks Phase 0**: Address situation (physical / online / hybrid) → drives `LocalBusiness` vs `Organization`+`Service` choice; NAP final lock; training-crawler decision (`Google-Extended`, `Applebot-Extended` allow/disallow).
- **Blocks Phase 1**: Real practitioner photo for hero (stock is rejected); brand-voice samples from the practitioner; testimonial inventory + written consent.
- **Blocks Phase 3**: CMS need for the practitioner (Sveltia overlay vs PR-based editing); pricing transparency decision.
- **Blocks Phase 4**: BIG / non-BIG status; professional association membership (CAT / NFG / RBCZ); existing Google Business Profile claim status.
- **Blocks Phase 5**: Domain DNS access for Search Console verification, Resend SPF/DKIM/DMARC, Cloudflare Pages binding, DMARC reporting.

These are tracked as open questions during planning, not roadmap blockers.

---
*Roadmap created: 2026-06-14*
*Last updated: 2026-06-14 after initialization*
