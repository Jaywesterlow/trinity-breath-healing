# State: Trinity Breath & Healing

## Project Reference

**Core Value:** SEO + AEO discoverability of trustworthy, citeable content — the site must be found AND cited by Google, AI Overviews, ChatGPT, Perplexity, and Claude on Dutch breathwork/trauma queries. Visual fidelity to Figma matters, but never at the expense of discoverability.

**Current Focus:** Phase 0 — Foundation & SEO Scaffolding (lock-in BEFORE any visible landing section).

**Granularity:** fine
**Mode:** yolo
**Parallelization:** true
**Model profile:** quality

## Current Position

**Phase:** 0 — Foundation & SEO Scaffolding
**Plan:** Not started
**Status:** Roadmap approved; awaiting `/gsd:plan-phase 0` to decompose into executable plans.
**Progress:** Phases 0/6 complete · Plans 0/? complete

```
[░░░░░░░░░░] 0% — Phase 0 not yet planned
```

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| LCP (mobile, `/`) | < 2.5s | Not measured |
| INP (mobile, `/`) | < 200ms | Not measured |
| CLS (mobile, `/`) | < 0.1 | Not measured |
| Lighthouse SEO (mobile, `/`) | 100 | Not measured |
| Lighthouse A11y (mobile, `/`) | 100 | Not measured |
| JSON-LD validity | 100% routes | Not measured |
| Initial-HTML H1 presence per route | 1 per page | Not measured |
| AI-crawler initial-HTML visibility | All routes via `curl -A` | Not measured |
| AI citation surface (60–90 days) | Tracked queries on Perplexity/ChatGPT/Claude | Not measured |

## Accumulated Context

### Decisions Locked

| Decision | Rationale | Source |
|----------|-----------|--------|
| Astro 5 + TS strict + `@astrojs/cloudflare` adapter | Default zero-JS HTML output = cleanest possible initial HTML for AI crawlers; SSG default + content collections + native i18n; best LCP for a content-heavy marketing site | research/STACK.md |
| Cloudflare Pages hosting (AMS POP) | EU posture, no cold start on Workers form/booking endpoints, free at this scale | research/STACK.md |
| Cal.com inline embed on `/boeken` only, `client:visible` below the fold | Open source, native Google Meet auto-create, Dutch locale, EU posture; zero impact on landing LCP | research/STACK.md + research/PITFALLS.md #8 |
| Resend EU (`eu-west-1`) + React Email | EU data residency, Worker-compatible, best DX | research/STACK.md |
| Plausible Cloud (EU) cookieless, no banner | EU-hosted, ~1 KB, no CLS/INP hit from consent banner | research/STACK.md |
| `schema-dts` + hand-rolled `<JsonLd>` emitter | TS-typed schema.org → typos become compile errors | research/STACK.md |
| Astro Content Collections (git-MDX + Zod) v1 | Zero runtime cost, zero CMS bill, full SSG; Sanity EU upgrade path for v2 | research/STACK.md |
| Tailwind v4 build-time atomic CSS | Zero runtime JS, small bundle, build-time tokens | research/STACK.md |
| Reserved 200-response stub URLs `/over-ons`, `/contact`, `/boeken` from Phase 0 | Zero-301 v2 migration guarantee | research/ARCHITECTURE.md §2.2 |
| Phase 0 lock-in BEFORE any visible section | Prevents 9 of 20 pitfalls (CSR, robots, meta, hero lazy, canonical, sitemap mismatch, hreflang, granularity bias) | research/PITFALLS.md #20 |
| Skip `llms.txt` / `llms-full.txt` | No proven retrieval effect with any major AI crawler (2026 verified) | PROJECT.md + research/PITFALLS.md anti-cargo-cult |
| Per-section landing build, hero-first, mobile-first | User-stated granularity preference; ARCHITECTURE §11.2 codifies the 12-section order | PROJECT.md + research/ARCHITECTURE.md §11.2 |

### Todos (Roadmap-level)

- [ ] Confirm Astro 5 / Tailwind v4 / `@astrojs/cloudflare` patch versions at install (Phase 0 light flag)
- [ ] Resolve address situation: physical / online-only / hybrid (blocks Phase 0 — schema choice + NAP)
- [ ] Lock NAP source-of-truth in PROJECT.md (blocks Phase 0 — robots.txt + Organization JSON-LD)
- [ ] Decide training-crawler posture: allow `Google-Extended` / `Applebot-Extended`? (blocks Phase 0 — robots.txt)
- [ ] Photography for hero — real practitioner photo, not stock (blocks Phase 1 hero sub-unit)
- [ ] Brand-voice samples from practitioner (blocks Phase 1 copy)
- [ ] Testimonial inventory + written consent files (blocks Phase 1 testimonials sub-unit + Phase 4)
- [ ] CMS-overlay decision: Sveltia on git vs PR-based editing (blocks Phase 3 — content workflow)
- [ ] Pricing transparency decision (FAQ #6) — show price on page or not (blocks Phase 1 FAQ + copy)
- [ ] BIG / non-BIG status confirmation (blocks Phase 4 — vocabulary scope)
- [ ] Professional association membership (CAT / NFG / RBCZ) (blocks Phase 4 — badges + sameAs)
- [ ] Existing Google Business Profile claim status (blocks Phase 4 — NAP audit scope)
- [ ] Domain DNS access for Search Console + Resend SPF/DKIM/DMARC + Cloudflare Pages (blocks Phase 5 — and propagation takes up to 48h, kick off in Phase 0)

### Blockers

None currently. Phase 0 can begin once the open questions above are answered or explicitly deferred to planning.

## Session Continuity

**Last action:** Roadmap created (2026-06-14). 70/70 v1 requirements mapped to 6 phases (0–5). REQUIREMENTS.md traceability updated.

**Next action:** `/gsd:plan-phase 0` — decompose Phase 0 into executable plans.

**Files of record:**
- `.planning/PROJECT.md` — scope, audience, constraints, key decisions
- `.planning/REQUIREMENTS.md` — 70 v1 requirements + v2 deferred + Out of Scope + traceability
- `.planning/ROADMAP.md` — 6 phases, success criteria, dependencies
- `.planning/STATE.md` — this file
- `.planning/research/SUMMARY.md` — research synthesis + "Implications for Roadmap"
- `.planning/research/STACK.md` — Astro 5 + Cloudflare + Cal.com + Resend + Plausible
- `.planning/research/ARCHITECTURE.md` — hub-spoke + SSG + primitives + per-section build order
- `.planning/research/FEATURES.md` — 20 table stakes + 15 differentiators + 20 anti-features + 12-question FAQ bank
- `.planning/research/PITFALLS.md` — 20 pitfalls + recovery + pitfall-to-phase mapping
- `seo-aeo-samenvatting-checklist.md` (project root) — Dutch SEO/AEO playbook, authoritative reference

---
*Last updated: 2026-06-14 after roadmap creation*
