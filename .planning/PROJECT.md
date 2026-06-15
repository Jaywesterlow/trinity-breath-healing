# Trinity Breath & Healing

## What This Is

Marketing website for **Trinity Breath & Healing** — a Holland-based breathwork + energetic-healing practice run by the user's aunt. The practitioner offers in-person sessions (mobile to clients within 30 min of Amsterdam + fixed locations in Reigersbos fysio on Saturdays and a room in Almere) and remote energetic sessions (Mahatma Healing, Goldhealing, Raster Energie). v1 site is the landing page (Dutch, mobile-first) that welcomes both existing followers (Instagram) and cold visitors who have never heard of the modalities, and converts them into a 30-minute Google Meet **intake call** — from which the aunt and prospect agree on a real session.

## Core Value

**SEO + AEO discoverability of trustworthy, citeable content** — the site must be found and *cited* by Google, AI Overviews, ChatGPT, Perplexity, Claude, and Apple Intelligence on Dutch breathwork / trauma-release / energetic-healing queries. Visual fidelity to the Figma design matters, but if SEO/AEO underperforms the project has failed. Every implementation choice is judged first on its SEO/AEO impact, then on aesthetics.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Landing page built mobile-first, then CSS layered to match Figma desktop frames
- [ ] All landing copy from Figma frames preserved verbatim (hero H1, body, Werkwijze 3 cards, About + stats, contact section)
- [ ] Inline contact email form (server-side delivery to practitioner) — Vercel Function → Resend EU
- [ ] Inline 30-min Google Meet **intake booking** via Cal.com embed inside the contact-section toggle (NOT a separate `/boeken` page)
- [ ] Footer mailto link + phone (tel:) + KvK placeholder + BIG-status placeholder slots
- [ ] SSG-rendered HTML on Vercel (SvelteKit `prerender = true`) — content + meta + JSON-LD present in initial HTML, not JS-injected
- [ ] Per-page unique `<title>` (50–60 chars) and meta description (150–160 chars) in initial HTML
- [ ] One unique `<H1>` per page; logical H2/H3 hierarchy
- [ ] Semantic HTML5 landmarks (`<main>`, `<nav>`, `<article>`, `<section>`, `<footer>`)
- [ ] JSON-LD structured data: `Organization` + `ProfessionalService` + `Person` (practitioner) + per-modality `Service` + `FAQPage` (sourced from inline FAQ section) + `WebSite` + `BreadcrumbList`
- [ ] `robots.txt` with explicit allow for AI search/RAG crawlers (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Claude-User`) AND training crawlers (`Google-Extended`, `Applebot-Extended`) BEFORE wildcard catchall; sitemap reference
- [ ] XML sitemap auto-generated; canonical tag on every page; hreflang nl + x-default infrastructure
- [ ] Core Web Vitals targets: LCP < 2.5s · INP < 200ms · CLS < 0.1
- [ ] Open Graph + Twitter Card meta for social sharing
- [ ] Image optimization via `@sveltejs/enhanced-img`: AVIF/WebP, alt-text, explicit width/height, hero illustration eager + preloaded, rest lazy
- [ ] Inline FAQ section ADDED below the contact section on landing (8–12 Q&A, answer-first, 50–150 word answers) — overrides Figma which omits it
- [ ] Citeable content blocks already in design (stats 8+ / 65+ / ∞) + at least 1 stat + 1 attributed quote + 1 outbound citation per KDD 2024 GEO
- [ ] Practitioner E-E-A-T signals: practitioner age (53) + "vanuit eigen ervaring" framing + credentials placeholder
- [ ] Welcoming tone for both initiated and uninitiated; define terms when used
- [ ] Dutch-language content (primary audience: Holland); EN deferred
- [ ] Accessibility: WCAG 2.2 AA
- [ ] 15-route stub set ships from Phase 0 (zero-301 v2 migration guarantee): `/werkwijze`, `/over-mij`, `/behandelingen`, `/contact`, `/diensten/{mahatma-healing,goldhealing,raster-energie,spinal-touch}`, `/diensten`, `/blog`, `/artikelen`, `/faq`, `/privacyverklaring`, `/algemene-voorwaarden`
- [ ] Eyebrow tags on landing sections match navigation labels (Frame 4 = "Behandelingen", Frame 5 = "Contact")

### Out of Scope

- ~~Testimonials on landing~~ + ~~`/reviews` route~~ — user direction: no reviews in v1; route eliminated entirely
- ~~Separate `/boeken` page~~ — booking is inline in contact-section toggle per Figma Frame 5
- ~~`LocalBusiness` schema with storefront address~~ — practice is mobile + remote + part-time at 3rd-party sites; use `ProfessionalService` + `Service` instead
- Deep content on `/werkwijze`, `/over-mij`, `/behandelingen`, `/diensten/*`, `/blog`, `/artikelen`, `/faq` — v1 ships stubs only; deep content in v2 milestones
- Practitioner photograph on landing — Figma uses illustration; no photo blocker
- E-commerce / online product sales — practice sells time, not products
- Multi-language beyond Dutch in v1 — `hreflang` infrastructure-ready
- User accounts / login
- `llms.txt` / `llms-full.txt` — no proven retrieval effect 2026
- HIPAA / medical-record handling — no PHI collected
- Native mobile apps
- Aggregate review schema — N/A given no-reviews decision
- Custom domain registration in v1 — host on `*.vercel.app` until launch commitment

## Context

- **Reference document:** `seo-aeo-samenvatting-checklist.md` at project root — authoritative Dutch SEO/AEO playbook (Princeton/KDD 2024 GEO, HubSpot 2025, 2026 crawler refs). All SEO/AEO choices cross-reference this.
- **Design source:** `Figma/Landingpage/Desktop/*.png` (6 frames) + `Figma/Landingpage/Mobile/*.png` (5 frames + menu open). Landing page only in v1.
- **Known design gaps (infer from desktop counterparts):**
  - Frame 2 mobile — Werkwijze section becomes a 3-card accordion on mobile
  - Frame 4 mobile — inactive-card state for service selector (active state visible on Mahatma Healing only)
- **Locked content from design** (no need to ask aunt): hero H1 + body, Werkwijze 3 cards, About + stats (8+/65+/∞), Contact section, footer NAP. Brand voice = the existing copy.
- **Service portfolio (5):** Mahatma Healing · Goldhealing · Raster Energie · Spinal Touch · "Meer diensten" link. Brand body copy also names: ademwerk (breathwork), lichaamsgerichte therapie, energetische / energiegerichte behandelingen.
- **Audience composition:**
  1. Existing Instagram followers (warm, intent-driven)
  2. Cold Dutch search traffic (don't know brand, may not know modality) — primary SEO target
  3. Curious learners (open but uneducated) — primary AEO target
- **Health/wellness niche:** Claims constrained by Wet BIG + Reclame Code; experience framing only, no therapeutic-cure language. Vocabulary scope depends on aunt's BIG status (TBD — see UNKNOWNS.md).

## Constraints

- **Discoverability:** SEO + AEO are primary success metrics — overrides aesthetic preferences in conflict.
- **Tech rendering:** SSG only — SvelteKit + Svelte 5 (runes) on Vercel, `prerender = true` per route. Content + meta + JSON-LD in initial HTML.
- **Build approach:** Mobile-first markup + structure first, then CSS layered to match Figma desktop. Not the reverse.
- **Hosting:** Vercel (`fra1` region for Frankfurt EU residency on serverless functions). NOT Cloudflare Pages. NOT Netlify.
- **CI:** GitHub Actions for tests + Lighthouse CI + pa11y/axe + JSON-LD validation. Vercel handles deploy via GitHub integration.
- **Repository:** `trinity-breath-healing` on GitHub, private, owned by user. Main branch protected.
- **Language:** Dutch primary. Hreflang-ready architecture for future EN.
- **Verification:** Every SEO/AEO technique cross-referenced against `seo-aeo-samenvatting-checklist.md` + fresh evidence. No speculative tactics.
- **Design fidelity:** Match Figma frames pixel-faithfully where they exist. Infer missing frames per user direction. Override design ONLY where user explicitly approves (inline FAQ addition, eyebrow tag renames, footer KvK+BIG slots).
- **Trust signals:** E-E-A-T non-negotiable. Practitioner identity + credentials + consistency + freshness.
- **Performance:** LCP < 2.5s, INP < 200ms, CLS < 0.1 — measured via Lighthouse CI + CrUX field data.
- **Domain posture:** No custom domain in v1. Production = `trinity-breath-healing.vercel.app`. Connect `trinitybnh.nl` later when ready.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SEO/AEO is primary success metric (not visuals) | User explicitly stated; growth depends on cold search + AI citation | — Pending |
| Dutch as primary language | Practice operates in Holland; cold-search audience is Dutch | — Pending |
| Skip `llms.txt` despite hype | No proven retrieval effect per reference doc (2026 verified) | — Pending |
| Use proven SEO/AEO techniques only | User constraint | — Pending |
| Infer missing mobile frames from desktop | User direction (Frame 2 accordion, Frame 4 inactive state) | — Pending |
| **Framework: SvelteKit + Svelte 5 (runes)** + TypeScript strict | User explicit choice 2026-06-15; SSG via `prerender = true`; project-local `svelte-project` skill aligns | — Pending |
| **Hosting: Vercel (`fra1`)** | User explicit choice; GitHub-native; EU region for serverless functions | — Pending |
| **CI: GitHub Actions** | User uses GitHub; portability + transparency over Vercel built-in CI | — Pending |
| **Repository: `trinity-breath-healing` private on GitHub** | User explicit choice | — Pending |
| **Adapter: `@sveltejs/adapter-vercel`** (NOT Astro adapter, NOT Cloudflare) | Follows framework + hosting decisions | — Pending |
| **MDX: `mdsvex`** (Svelte-native MDX preprocessor) | Required because SvelteKit has no Astro-equivalent Content Collections; `.svx` files + Vite glob imports | — Pending |
| **Images: `@sveltejs/enhanced-img`** | Vite plugin; AVIF/WebP at build time; explicit dimensions → CLS=0 | — Pending |
| **Sitemap: hand-rolled `+server.ts` endpoint** | No plug-and-play sitemap lib for SvelteKit equivalent to Astro's | — Pending |
| **Booking: Cal.com inline embed INSIDE contact-section toggle** (NOT separate `/boeken` page) | Matches Figma Frame 5 design; eliminates `/boeken` route | — Pending |
| **Schema: `ProfessionalService` + per-modality `Service` + `Person`** (NOT `LocalBusiness` with storefront) | Practice is mobile + remote + part-time at 3rd-party — no customer storefront | — Pending |
| **No testimonials, no `/reviews` route** | User direction (overrides earlier roadmap) | — Pending |
| **Inline FAQ section ADDED on landing under contact** | User direction; AEO citation lift (overrides Figma which omits FAQ) | — Pending |
| **Eyebrow tags match nav names** (Frame 4 → "Behandelingen", Frame 5 → "Contact") | User direction | — Pending |
| **Footer adds KvK + BIG status placeholder slots** | User direction; legal NL requirement | — Pending |
| **Build mobile-first then layer CSS to design** | User direction; semantic + a11y discipline | — Pending |
| **Training crawlers (Google-Extended, Applebot-Extended) ALLOWED in robots.txt** | Non-sensitive content + high long-term AI citation surface | — Pending |
| **Search Console verification via user's Google account** (HTML-file method, URL-prefix property) | DNS-TXT deferred until custom domain | — Pending |
| **Custom domain deferred** | User: "not using the name right now"; ship on `*.vercel.app` | — Pending |
| **Design tokens deferred to later phase** | User will provide; Phase 0 ships placeholders with TODO markers | — Pending |
| **CMS: git-MDX (Astro Content Collections) v1; Sanity EU v2 trigger when >50 pages OR >2 editors** | Aunt unlikely to edit v1; Sanity migration cost amortizes only at scale | — Pending |
| **Email delivery: Resend EU (`eu-west-1`)** | EU residency for GDPR; React Email DX | — Pending |
| **Analytics: Plausible Cloud EU** | Cookieless = no banner = no CLS hit; EU residency | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-15 after Figma frame review + Vercel/design overrides decided in Phase 0 discussion*
