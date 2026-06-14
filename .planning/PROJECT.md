# Trinity Breath & Healing

## What This Is

Marketing website for Trinity Breath & Healing — a Holland-based breathwork and healing practice run by the user's aunt. The practice helps clients release trauma and trauma-rooted physical barriers through breathwork sessions. The site is the digital storefront: it must welcome both existing followers (Instagram audience seeking treatment) and people who have never heard of the modality, and convert them into a 30-minute Google Meet booking, an email contact, or a phone call.

## Core Value

**SEO + AEO discoverability of trustworthy, citeable content** — the site must be found and *cited* by Google, AI Overviews, ChatGPT, Perplexity, and Dutch-language search. Visual fidelity to the Figma design matters, but if SEO/AEO underperforms the project has failed. Every implementation choice is judged first on its SEO/AEO impact, then on aesthetics.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Landing page built pixel-faithfully to Figma desktop + mobile frames
- [ ] Inline contact email form (server-side delivery to practitioner)
- [ ] Footer mailto link to practitioner's email
- [ ] Footer phone number (tel: link, click-to-call on mobile)
- [ ] 30-minute Google Meet booking form with user-pickable date/time (calendar integration)
- [ ] SSR/SSG-rendered HTML — content + meta tags present in initial HTML, not JS-injected (bots & AI crawlers don't run JS reliably)
- [ ] Per-page unique `<title>` (50–60 chars) and meta description (150–160 chars) in initial HTML
- [ ] One unique `<H1>` per page; logical H2/H3 hierarchy
- [ ] Semantic HTML5 landmarks (`<main>`, `<nav>`, `<article>`, `<section>`)
- [ ] JSON-LD structured data: `Organization` + `LocalBusiness` + `Service` + `FAQPage` (and `Person` for practitioner)
- [ ] `robots.txt` with explicit allow for AI search crawlers (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Claude-User`, `Google-Extended`, `Applebot-Extended`) + sitemap reference
- [ ] XML sitemap; canonical tag on every page
- [ ] Core Web Vitals targets: LCP < 2.5s · INP < 200ms · CLS < 0.1
- [ ] Open Graph + Twitter Card meta for social sharing
- [ ] Image optimization: WebP, alt-text, explicit width/height, hero non-lazy, rest lazy
- [ ] FAQ section with answer-first structure (question as heading, 50–150 word standalone answer with the answer in the first sentence) — high AI citation value
- [ ] Citeable content blocks with statistics, quotes, attribution (+30–41% AI citation lift per KDD 2024 GEO research)
- [ ] Practitioner E-E-A-T signals: visible author/practitioner credentials, "Over ons" content, transparent NAP (name/address/phone) consistency
- [ ] Welcoming tone for both initiated (wellness vocabulary OK) AND uninitiated (jargon explained, no gatekeeping)
- [ ] Dutch-language content (primary audience: Holland)
- [ ] Accessibility: WCAG 2.2 AA (focus states, contrast, keyboard nav, screen-reader labels) — also an SEO signal

### Out of Scope

- Pages beyond landing page (v1) — explicitly deferred: only landing-page Figma exists; remaining pages come in later milestones for SEO/AEO expansion
- E-commerce / online product sales — practice sells time (sessions), not products
- Multi-language beyond Dutch in v1 — add `hreflang` infrastructure-ready but no EN translation yet
- User accounts / login — booking flow is anonymous form → calendar invite
- Blog / kennisbank in v1 — planned for v2 (key for topical authority but landing is first)
- `llms.txt` / `llms-full.txt` — no proven retrieval effect as of 2026 per source doc; skip to avoid dead-end work
- HIPAA / medical-record handling — no PHI collected; intake happens during the session, not the site
- Native mobile apps

## Context

- **Reference document:** `seo-aeo-samenvatting-checklist.md` at project root — authoritative Dutch-language SEO/AEO playbook with verified sources (Princeton/KDD 2024 GEO study, HubSpot 2025, 2026 crawler refs). Cross-reference any new SEO/AEO technique against this doc + fresh web research before adopting. User wants only proven techniques.
- **Design source:** `Figma/` subfolders. Landing page only. Known gaps to infer from desktop counterparts:
  - Frame 2 mobile — missing accordion for workflow/flow
  - Frame 4 mobile — missing active state (desktop has it)
- **Audience composition:**
  1. Existing Instagram followers (warm, intent-driven, expect brand-familiarity)
  2. Cold Dutch search traffic (don't know the brand, may not know the modality) — primary SEO target
  3. Curious learners (open but uneducated about breathwork) — primary AEO target (they ask AI assistants questions like "what is breathwork", "trauma release Holland")
- **Brand voice constraint:** Welcoming to both initiated and uninitiated. No exclusive insider vocabulary. Define terms when used.
- **Health/wellness niche:** Claims must be careful — avoid unsubstantiated medical claims. Use practitioner experience framing, not therapeutic-cure language.

## Constraints

- **Discoverability**: SEO + AEO are primary success metrics — overrides aesthetic preferences when in conflict.
- **Tech rendering**: Must be SSR or SSG; client-only rendering blocks AI crawlers and degrades SEO. Framework choice constrained to SSR/SSG-capable (SvelteKit, Next.js, Astro).
- **Language**: Dutch primary. Hreflang-ready architecture even though v1 ships Dutch-only.
- **Verification**: Every SEO/AEO technique adopted must be cross-referenced against the project's `seo-aeo-samenvatting-checklist.md` and fresh online evidence. No speculative tactics.
- **Design fidelity**: Match Figma frames for landing page; infer missing frames (Frame 2 mobile accordion, Frame 4 mobile active state) from their desktop counterparts.
- **Trust signals**: Health/wellness category — E-E-A-T (practitioner identity, credentials, consistency, freshness) is non-negotiable.
- **Performance**: LCP < 2.5s, INP < 200ms, CLS < 0.1 — measured on real Chrome users via Search Console.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SEO/AEO is primary success metric (not visuals) | User explicitly stated; growth depends on cold search + AI citation discoverability | — Pending |
| Landing page only in v1 | Only Figma design that exists; further pages support SEO/AEO expansion in later milestones | — Pending |
| Dutch as primary language | Practice operates in Holland; cold search audience is Dutch-speaking | — Pending |
| Skip `llms.txt` despite hype | No proven retrieval effect per project reference doc (2026 verified) | — Pending |
| Use proven SEO/AEO techniques only | User-stated constraint; reference doc grounds choices | — Pending |
| Infer missing mobile frames from desktop | User said acceptable; Frame 2 accordion + Frame 4 active state | — Pending |
| Framework TBD (SvelteKit vs Next vs Astro) | Will resolve after research phase weighs SSR/SSG + DX + ecosystem for this use case | — Pending |
| CMS strategy TBD | Aunt may need to edit copy; weigh headless CMS vs git-based vs hardcoded for v1 | — Pending |
| Booking integration TBD (Cal.com vs Calendly vs custom) | Constraint is 30-min Google Meet, date/time picker; pick during research | — Pending |

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
*Last updated: 2026-06-14 after initialization*
