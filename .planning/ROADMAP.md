# Roadmap: Trinity Breath & Healing

**Created:** 2026-06-14
**Last revised:** 2026-06-15 (Vercel swap + Figma-driven overrides from Phase 0 CONTEXT.md)
**Granularity:** fine
**Mode:** yolo
**Coverage:** 81/81 v1 requirements mapped (100%)

## Core Value Reminder

**SEO + AEO discoverability of trustworthy, citeable content** — every phase is judged first on SEO/AEO impact, then conversion, then aesthetics. Visual fidelity to Figma matters, but never at the expense of discoverability.

## Phases

- [ ] **Phase 0: Foundation & SEO Scaffolding** — SvelteKit + Svelte 5 (runes) + Vercel + GitHub Actions CI + primitives + robots.txt + sitemap + shared schema + design-token placeholders + CI gates skeleton + 14 reserved stub URLs (lock-in BEFORE any visible section)
- [ ] **Phase 1: Landing Sections (Mobile-First, 8 sub-units in Figma frame order)** — Build the landing page section by section: hero → header + mobile menu → Werkwijze 3 cards → About + stats → Behandelingen selector → Contact + booking toggle → inline FAQ → footer
- [ ] **Phase 2: Reserved-Page v1 Content** — Real content for the 3 routes that MUST be real before launch: `/privacyverklaring`, `/algemene-voorwaarden`, `/contact` (standalone form + booking). Other 11 routes stay as Phase 0 stubs through v1.
- [ ] **Phase 3: Integrations (Vercel Function + Resend + Cal.com inline + Plausible)** — `/api/contact` Vercel Function → Resend EU dispatch; Cal.com 30-min Google Meet inline embed wired inside landing contact-section toggle; Plausible cookieless analytics; DST end-to-end booking test
- [ ] **Phase 4: Legal & Copy Gate (Pre-Launch)** — Hedge-language grep, two-sentence-pattern enforcement, Dutch counsel sign-off on health claims, AVG flow verification, NAP off-site consistency, placeholder-grep CI gate must pass
- [ ] **Phase 5: Launch & Monitoring** — Production deploy to Vercel `fra1`, Search Console submission, AI-crawler curl verification per route, 28-day CrUX CWV check, 60–90-day Perplexity/ChatGPT/Claude/Apple Intelligence citation tracking

## Phase Details

### Phase 0: Foundation & SEO Scaffolding

**Goal**: A deployable SvelteKit (Svelte 5 runes) scaffold on Vercel whose default output for any route is content + meta + JSON-LD in initial HTML. Primitives, robots.txt, sitemap, shared schema, design-token placeholders, GitHub Actions CI gates, and 14 reserved stub URLs ship BEFORE any visible landing section is built.

**Depends on**: Nothing (foundation phase)

**Requirements**:
- FND-01, FND-02, FND-03, FND-04, FND-05, FND-06, FND-07, FND-08, FND-09, FND-10
- SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07, SEO-08, SEO-09, SEO-10, SEO-11
- SCH-01, SCH-02, SCH-03, SCH-04, SCH-05, SCH-06, SCH-07, SCH-08
- PRF-01 (Astro `<Image>` + Sharp primitive configured), PRF-08 (Lighthouse CI budget gate skeleton wired)
- A11Y-05 (pa11y/axe CI gate skeleton wired)

**Success Criteria** (what must be TRUE):
  1. `vite build` (SvelteKit) produces a clean Vercel bundle deployable to `fra1`; `curl -A "OAI-SearchBot" https://trinity-breath-healing.vercel.app/` returns initial HTML containing exactly one `<h1>`, a 50–60-char `<title>`, a 150–160-char meta description, a canonical, and one `<script type="application/ld+json">`.
  2. `/robots.txt` is served with explicit `Allow: /` blocks for `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Claude-User`, `Google-Extended`, `Applebot-Extended` placed BEFORE the wildcard `User-agent: *`; `/sitemap.xml` is auto-generated and referenced from robots.txt.
  3. All 14 reserved routes (`/werkwijze`, `/over-mij`, `/behandelingen`, `/contact`, 4× `/diensten/<slug>`, `/diensten`, `/blog`, `/artikelen`, `/faq`, `/privacyverklaring`, `/algemene-voorwaarden`) return HTTP 200 with stub pages emitting per-page title + meta + canonical + JSON-LD.
  4. GitHub Actions CI fails the build if any rendered route has zero or multiple `<h1>`, missing/duplicate meta description, an invalid canonical, an unparseable JSON-LD `@graph`, a `schema-dts` type error, or any new placeholder string (grep gate inactive until LGL-11 — but the grep target is plumbed in Phase 0).
  5. Repository `trinity-breath-healing` (private) exists on GitHub with main-branch protection; Vercel project is connected and auto-deploys `main` to `trinity-breath-healing.vercel.app` plus preview URLs per PR; Search Console URL-prefix verification via HTML-file method against the Vercel-default URL has been initiated.

**Plans**: TBD
**UI hint**: no (primitives + placeholder tokens only; no visible sections yet)

### Phase 1: Landing Sections (Mobile-First, 8 sub-units in Figma frame order)

**Goal**: A complete, Figma-faithful Dutch landing page built mobile-first then layered with CSS to match desktop. Every section is server-rendered in initial HTML, the hero illustration is the LCP element preloaded eagerly, the inline FAQ (added under contact per user override) drives AEO citation lift, and per-section DoD gates (Lighthouse SEO=100, A11y=100, CWV budgets, JSON-LD valid, hedge-language scan, copy-preservation check) pass at the boundary of every sub-unit PR.

**Depends on**: Phase 0 (primitives, design-token placeholders, reserved URLs, CI gates)

**Requirements**:
- LND-01, LND-02, LND-03, LND-04, LND-05, LND-06, LND-07, LND-08, LND-09, LND-10
- PRF-02, PRF-03, PRF-04, PRF-05, PRF-06, PRF-07 (per-section enforcement: hero preload, lazy below fold, no third-party JS on `/` until toggle activates Cal.com, CWV budgets met)
- A11Y-01, A11Y-02, A11Y-03, A11Y-04 (per-section WCAG 2.2 AA, form labels, 44×44 tap targets, screen-reader walkthrough)

**Sub-units (each = one PR/plan, built mobile-first in Figma frame order):**
  1. Hero (LND-01, PRF-02, PRF-04) — Frame 1 — H1 "Rust in je hoofd. Ontspanning in je lichaam.", body verbatim, CTA "Maak een afspraak", hero illustration (tree + river) preloaded eager; service-card tiles for Goldhealing + Spinal Touch + "Meer klachten"
  2. Site header + mobile menu overlay (LND-02) — logo wordmark + nav (Home · Werkwijze · Over mij · Behandelingen · Contact) + CTA + social icons; mobile = hamburger → full-screen green overlay menu
  3. Werkwijze 3-card section (LND-03) — Frame 2 — eyebrow "Werkwijze", heading "Rustig, persoonlijk en op jouw tempo.", 3 cards (Kennismaking · De sessie · Verdieping) with copy verbatim; **mobile = `<details>` accordion** (content stays in DOM)
  4. About + stats (LND-04) — Frame 3 — eyebrow "Over mij", heading + body verbatim, 2 bullet blocks, "Lees meer over mij →", stats blocks (8+ / 65+ / ∞) — these ARE the citation/proof blocks
  5. Behandelingen service selector (LND-05) — Frame 4 — eyebrow **"Behandelingen"** (renamed from "Werkwijze"), horizontal 5-card carousel/scroll (Mahatma Healing · Goldhealing · Raster Energie · Spinal Touch · Meer diensten); active state per Mahatma example, inactive style inferred
  6. Contact + booking section with toggle (LND-06) — Frame 5 — eyebrow **"Contact"** (renamed from "Over mij"), heading + body verbatim, radio toggle (Email formulier / Online meeting); Email view = form (Voornaam, Achternaam, Email, Telefoon +31, Bericht, "Verstuur email"); Online meeting view = Cal.com mount-point (wiring in Phase 3)
  7. **Inline FAQ** (LND-07) — NEW per user direction; sits under contact section; 8–12 questions answer-first, 50–150 word answers; same source feeds FAQPage JSON-LD (SCH-07)
  8. Footer (LND-08) — Frame 6 — logo + wordmark + NAP + KvK placeholder + BIG placeholder slots + social + 3 link columns (DIENSTEN · MENU · LEZEN) + bottom links + copyright

**Cross-section gates** (LND-09, LND-10): all landing copy preserved verbatim from Figma; new copy (FAQ, glossary) follows two-sentence pattern.

**Success Criteria** (what must be TRUE):
  1. Every sub-unit PR's Lighthouse mobile run reports SEO=100, Accessibility=100, LCP<2.5s, INP<200ms, CLS<0.1 on the rendered landing page; pa11y/axe CI reports zero WCAG 2.2 AA violations.
  2. `curl -A "OAI-SearchBot" https://<preview-url>/` returns initial HTML containing the section's headings, body text, and (where applicable) FAQPage JSON-LD entries — no client-rendered content.
  3. The hero illustration is the LCP element with `<link rel="preload" as="image" fetchpriority="high">` and `loading="eager"`; no non-hero image renders without explicit `width`/`height` and `loading="lazy"`.
  4. The inline FAQ section and `FAQPage` JSON-LD are generated from a single source so the rendered Q/A list and the structured data are guaranteed to match.
  5. All Figma-verbatim copy (hero H1+body, Werkwijze 3 cards, About + stats, Contact section, footer NAP) appears unchanged in the rendered HTML; any copy that was inferred or added (mobile body variant choice, FAQ questions, glossary) is recorded in the sub-unit PR description.

**Plans**: TBD
**UI hint**: yes

### Phase 2: Reserved-Page v1 Content

**Goal**: The 3 routes that MUST be real before launch (`/privacyverklaring`, `/algemene-voorwaarden`, `/contact`) ship with full content; the other 11 stub routes from Phase 0 (`/werkwijze`, `/over-mij`, `/behandelingen`, 4× `/diensten/<slug>`, `/diensten`, `/blog`, `/artikelen`, `/faq`) remain stubs through v1 and are deepened in v2 milestones.

**Depends on**: Phase 1 (reuses landing primitives: header, footer, contact form block) AND Phase 3's processor configurations for the privacy-policy data-processor list (so Phase 3 must complete BEFORE Phase 2 privacy-policy content lands). Phase 2 plans may begin in parallel with Phase 3 and merge once processors are confirmed.

**Requirements**:
- RES-01 (`/privacyverklaring`)
- RES-02 (`/algemene-voorwaarden`)
- RES-03 (`/contact`)

**Success Criteria** (what must be TRUE):
  1. `/privacyverklaring` renders a counsel-reviewed privacy policy listing every confirmed data processor (Resend EU, Cal.com, Plausible EU, Vercel) with their regions, AVG/GDPR posture, and the cookieless-no-banner decision documented.
  2. `/algemene-voorwaarden` renders counsel-reviewed terms & conditions covering session cancellation, no-show policy, payment, and disclaimer scope.
  3. `/contact` renders a standalone version of the landing contact section (form + booking toggle) with its own H1, meta, canonical, JSON-LD, and BreadcrumbList; the form POSTs to the same `/api/contact` Vercel Function as the landing form.
  4. Lighthouse mobile on all three pages reports SEO=100, Accessibility=100, CWV budgets met; `curl -A "OAI-SearchBot"` shows H1 + meta + JSON-LD in initial HTML on each.

**Plans**: TBD
**UI hint**: yes (legal-page typography + standalone /contact form)

### Phase 3: Integrations (Vercel Function + Resend EU + Cal.com inline + Plausible)

**Goal**: All third-party plumbing wired end-to-end without regressing the landing-page CWV budget. `/api/contact` Vercel Function (region `fra1`) accepts validated, AVG-consented submissions and delivers them via Resend EU; Cal.com 30-min Google Meet event is embedded INSIDE the landing contact-section toggle (`client:visible` activates only when user picks "Online meeting"); Plausible records cookieless analytics; DST end-to-end booking and Gmail/Outlook/iCloud deliverability tests pass.

**Depends on**: Phase 1 (booking toggle + form UI shipped) — Phase 2 privacy-policy content depends on Phase 3 processor confirmation, so this phase may run in parallel with Phase 2 plans

**Requirements**:
- INT-01, INT-02, INT-03, INT-04, INT-05, INT-06, INT-07, INT-08

**Success Criteria** (what must be TRUE):
  1. POSTing the contact form (from landing inline and from `/contact`) succeeds only when AVG consent is checked, the honeypot is empty, and the IP is below 5 submissions/hour; a server-side Zod failure or missing consent returns 4xx and no email is sent.
  2. End-to-end deliverability test from the form lands in the practitioner inbox (and auto-reply lands in the submitter inbox) without spam-folder placement for Gmail, Outlook, and iCloud, with valid SPF + DKIM + DMARC on the sending domain (note: in v1, sender domain is Resend's own verified domain until custom `trinitybnh.nl` is connected — DMARC migration is a DOM-* v2 task).
  3. A test booking via the landing "Online meeting" toggle creates a Cal.com event in `Europe/Amsterdam`, auto-generates a Google Meet link in the confirmation email, and re-runs cleanly across the October-end and March-start DST boundaries.
  4. Lighthouse mobile on `/` (before the user clicks the booking toggle) still reports LCP<2.5s and INP<200ms — Cal.com loads zero JS until the toggle is activated.
  5. Plausible script is loaded site-wide cookielessly (no consent banner shipped) and the privacy policy (`/privacyverklaring` shipped via Phase 2) lists Resend, Cal.com, Plausible, and Vercel as data processors.

**Plans**: TBD
**UI hint**: partial (mostly integration glue; thin UI work on form success/error states and Cal.com embed loading skeleton)

### Phase 4: Legal & Copy Gate (Pre-Launch)

**Goal**: The site is technically ship-ready but does not deploy to production until every health-adjacent claim, disclaimer, AVG flow, and NAP entry has been reviewed and explicitly cleared. Hedge language replaced with two-sentence pattern. Wet BIG / Reclame Code risk signed off by Dutch counsel. AVG consent verified end-to-end. Off-site NAP matches locked source-of-truth. Pre-launch placeholder grep returns zero matches.

**Depends on**: Phase 3 (processors must be configured), Phase 2 (legal pages live)

**Requirements**:
- LGL-01, LGL-02, LGL-03, LGL-04, LGL-05, LGL-06, LGL-07, LGL-08, LGL-09, LGL-10, LGL-11

**Success Criteria** (what must be TRUE):
  1. A hedge-language grep (`misschien`, `zou kunnen`, `wellicht`, etc.) over all rendered Dutch copy returns zero unsafe matches — every flagged instance has been rewritten in the two-sentence pattern or paired with a definitive sentence.
  2. Every health-adjacent claim and disclaimer has been reviewed and signed off by Dutch counsel against Wet BIG and the Nederlandse Reclame Code; experience framing ("begeleidt bij…") replaces any therapeutic-cure language; trauma trigger warnings are visible above trauma-discussion sections; the booking-toggle and above-contact-form disclaimers are visible.
  3. The AVG consent checkbox on `/api/contact` is unchecked by default, the server rejects submissions when unchecked (integration test), and a free-text-warning is rendered above the message field.
  4. The privacy policy (`/privacyverklaring`) and terms (`/algemene-voorwaarden`) are counsel-reviewed; the privacy policy lists every data processor and documents the cookieless-no-banner decision.
  5. The locked NAP source-of-truth in `src/lib/constants/brand.ts` matches the footer, the `Organization`/`ProfessionalService` JSON-LD, the Instagram bio, and the KvK record character-for-character; `grep -rE "TODO|PLACEHOLDER" src/` returns zero matches (LGL-11 launch gate).

**Plans**: TBD
**UI hint**: no (content + legal + ops only)

### Phase 5: Launch & Monitoring

**Goal**: The site is live in production on Vercel `fra1`, indexed via Search Console, verified-visible to AI crawlers per route, and instrumented for a 28-day CWV stabilization window plus a 60–90-day AI-citation tracking program — so success against the SEO/AEO core value is observable, not assumed.

**Depends on**: Phase 4 (no production deploy before legal/copy sign-off + placeholder-grep pass)

**Requirements**:
- LCH-01, LCH-02, LCH-03, LCH-04, LCH-05, LCH-06, LCH-07

**Success Criteria** (what must be TRUE):
  1. `vite build` (SvelteKit) completes cleanly and Vercel `fra1` serves `/`, `/contact`, `/privacyverklaring`, `/algemene-voorwaarden`, `/robots.txt`, and `/sitemap.xml` on the production URL (`trinity-breath-healing.vercel.app` until custom domain is connected) with HTTPS + HSTS.
  2. Sitemap is submitted in Google Search Console; URL Inspection on each priority page shows rendered content and structured data with no "blocked by robots.txt" or "Crawled - currently not indexed" errors.
  3. `curl -A "OAI-SearchBot" <prod-url>` on each priority route returns initial HTML containing the route's H1, meta description, canonical, and JSON-LD `@graph` — verified per route, recorded in a launch checklist.
  4. After 28 days in production, CrUX field data for the landing page reports LCP<2.5s, INP<200ms, CLS<0.1 on the mobile cohort; the server-log review within 30 days confirms at least one hit each from `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, and ideally `Google-Extended` / `Applebot-Extended` (no silent block).
  5. A tracking spreadsheet records Perplexity, ChatGPT, Claude, and Apple Intelligence test-query results for the target Dutch breathwork / trauma-release / energetic-healing phrases at 0, 30, 60, and 90 days post-launch.

**Plans**: TBD
**UI hint**: no (deploy, verification, monitoring)

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Foundation & SEO Scaffolding | 0/? | Not started | - |
| 1. Landing Sections (8 sub-units) | 0/8 | Not started | - |
| 2. Reserved-Page v1 Content | 0/3 | Not started | - |
| 3. Integrations | 0/? | Not started | - |
| 4. Legal & Copy Gate | 0/? | Not started | - |
| 5. Launch & Monitoring | 0/? | Not started | - |

## Coverage Audit

81 of 81 v1 requirements mapped to exactly one phase. Cross-cutting categories (PRF, A11Y) split between Phase 0 (gate setup: CI skeleton, image primitive) and Phase 1 (per-section enforcement).

| Category | Count | Phase Mapping |
|----------|-------|---------------|
| FND (Foundation) | 10 | Phase 0 |
| SEO (SEO Primitives) | 11 | Phase 0 |
| SCH (Structured Data / AEO) | 8 | Phase 0 |
| LND (Landing Sections) | 10 | Phase 1 (8 sub-units + 2 cross-section gates) |
| RES (Reserved-Page v1 Content) | 3 | Phase 2 |
| INT (Integrations) | 8 | Phase 3 |
| PRF (Performance) | 8 | Phase 0 (PRF-01, PRF-08) + Phase 1 (PRF-02–07) |
| A11Y (Accessibility) | 5 | Phase 0 (A11Y-05) + Phase 1 (A11Y-01–04) |
| LGL (Legal & Copy) | 11 | Phase 4 |
| LCH (Launch & Monitoring) | 7 | Phase 5 |
| **Total** | **81** | **100% mapped** |

## Dependencies Summary

```
Phase 0 (Foundation)
   ↓
Phase 1 (Landing — 8 sub-units, mobile-first, Figma frame order)
   ↓
   ├──→ Phase 2 (Legal pages + /contact)
   └──→ Phase 3 (Form Function + Cal.com inline + Plausible)
        └──→ Phase 2 privacy-policy lands once processors confirmed
   ↓
Phase 4 (Legal & copy gate — Dutch counsel sign-off + placeholder grep)
   ↓
Phase 5 (Production launch + 28-day CWV + 60–90-day AI-citation monitoring)
```

Phase 2 + Phase 3 can run in parallel; Phase 2 privacy-policy merges only after Phase 3 confirms data-processor list.

## Research Flags

Carried over from `research/SUMMARY.md`, updated for stack swap:

- **Phase 0 (light)**: confirm SvelteKit + Svelte 5 (runes stable) + `@sveltejs/adapter-vercel` + `mdsvex` + `@sveltejs/enhanced-img` patch versions at `npm install`. No Tailwind — plain CSS only.
- **Phase 3 (medium)**: confirm Cal.com Cloud EU plan + `nl` locale + Google Meet auto-create, Resend `eu-west-1` posture, Plausible EU pricing, Vercel free-tier function limits at contract time.
- **Phase 4 (strong)**: Dutch counsel review of Wet BIG protected-title scope for non-BIG practitioners, Reclame Code Stichting current guidance, AVG/ePrivacy 2026 interpretation of cookieless-no-banner. Counsel sign-off is non-negotiable for launch.

## Open Questions (Tracked in UNKNOWNS.md — not roadmap blockers)

See `.planning/phases/00-foundation-seo-scaffolding/UNKNOWNS.md` for full inventory. Highlights blocking specific phases:

- **Blocks Phase 1 finalization**: real practitioner phone, KvK, hero-illustration source SVG, design tokens
- **Blocks Phase 3**: domain DNS access for Resend SPF/DKIM/DMARC against custom domain (not blocking v1 if shipping on `*.vercel.app` + Resend's own verified domain)
- **Blocks Phase 4**: BIG / non-BIG status; professional association membership; pricing decision; "Vakkundig opgeleid" bullet real text
- **Blocks Phase 5**: nothing currently — Vercel-default URL ships without custom domain

---
*Roadmap created: 2026-06-14*
*Last updated: 2026-06-15 after Figma frame review + Vercel/design overrides in Phase 0 CONTEXT.md*
