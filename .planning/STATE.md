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
**Plan:** Plan-phase complete — 9 executable plans across 7 waves (0–6), revision loop cleared (iter 2+3) by gsd-plan-checker. Ready for `/gsd:execute-phase 0`.
**Status:** All 9 plans + VALIDATION.md committed (d07c0d6). HANDOFF + .continue-here cleared.
**Progress:** Phases 0/6 complete · Plans 0/9 executed

```
[██░░░░░░░░] ~20% — Phase 0 fully planned, execution not yet started
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
| **SvelteKit + Svelte 5 + TS strict** (pivot from Astro 5, commit `4532a2a`) | Vercel-native stack, SSR/SSG-capable, signals/runes for fine-grained reactivity, smaller runtime than React | PROJECT.md + commit 4532a2a |
| **Vercel hosting** (pivot from Cloudflare Pages, commit `8cbadb3`) | EU regions, native SvelteKit adapter, Figma overrides workflow, integrated preview deploys | PROJECT.md + commit 8cbadb3 |
| **Plain CSS** — single `static/global.css` + Svelte scoped styles (pivot from Tailwind v4, commit `a7f96e1`) | Zero build-tool churn, Svelte scoped CSS sufficient, design-token system via CSS variables | PROJECT.md + commit a7f96e1 |
| Cal.com inline embed on `/boeken` only, lazy-mounted below the fold | Open source, native Google Meet auto-create, Dutch locale, EU posture; zero impact on landing LCP | research/STACK.md + research/PITFALLS.md #8 |
| Resend EU (`eu-west-1`) + React Email | EU data residency, Worker/server-route compatible, best DX | research/STACK.md |
| Plausible Cloud (EU) cookieless, no banner | EU-hosted, ~1 KB, no CLS/INP hit from consent banner | research/STACK.md |
| `schema-dts` + hand-rolled `<JsonLd>` emitter | TS-typed schema.org → typos become compile errors | research/STACK.md |
| Markdown content via SvelteKit content collections / mdsvex (replaces Astro Content Collections) | Zero runtime cost, full SSG; Sanity EU upgrade path for v2 | PROJECT.md |
| Reserved 200-response stub URLs `/over-ons`, `/contact`, `/boeken` from Phase 0 | Zero-301 v2 migration guarantee | research/ARCHITECTURE.md §2.2 |
| Phase 0 lock-in BEFORE any visible section | Prevents 9 of 20 pitfalls (CSR, robots, meta, hero lazy, canonical, sitemap mismatch, hreflang, granularity bias) | research/PITFALLS.md #20 |
| Skip `llms.txt` / `llms-full.txt` | No proven retrieval effect with any major AI crawler (2026 verified) | PROJECT.md + research/PITFALLS.md anti-cargo-cult |
| Per-section landing build, hero-first, mobile-first | User-stated granularity preference; ARCHITECTURE §11.2 codifies the 12-section order | PROJECT.md + research/ARCHITECTURE.md §11.2 |

### Todos (Roadmap-level)

**Phase 0 blockers — RESOLVED 2026-06-18:**
- [x] ~~Resolve address situation~~ → Hybrid home practice, city-level public, full address shared post-booking only. PROJECT.md NAP block.
- [x] ~~Lock NAP source-of-truth~~ → PROJECT.md "NAP — Source of Truth" block locked. Known: name + practitioner age 53 + service area. `TBD_*` placeholders for phone/email/KvK/BIG/association/Instagram/practitioner-name. CI flags `TBD_*` as warnings; Phase 5 launch gate fails on residual `TBD_*`.
- [x] ~~Training-crawler posture~~ → Allow all (Google-Extended + Applebot-Extended + retrieval crawlers). Already in PROJECT.md decisions.
- [x] ~~Domain DNS access~~ → No custom domain in v1; ship on `trinity-breath-healing.vercel.app`. DNS work entirely skipped in Phase 0. Custom domain deferred post-launch.

**Phase 0 light flag (not blocking):**
- [ ] Confirm SvelteKit / Svelte 5 / adapter-vercel / mdsvex patch versions at `pnpm install`

**Downstream blockers (do not block Phase 0):**
- [ ] Photography for hero — real practitioner photo, not stock (blocks Phase 1 hero sub-unit; Figma uses illustration so non-blocking if illustration stays)
- [ ] Brand-voice samples from practitioner (blocks Phase 1 copy)
- [ ] CMS-overlay decision: Sveltia on git vs PR-based editing (blocks Phase 3 — content workflow)
- [ ] Pricing transparency decision (FAQ #6) — show price on page or not (blocks Phase 1 FAQ + copy)
- [ ] BIG / non-BIG status confirmation (blocks Phase 4 — vocabulary scope)
- [ ] Professional association membership (CAT / NFG / RBCZ) (blocks Phase 4 — badges + sameAs)
- [ ] Existing Google Business Profile claim status (blocks Phase 4 — NAP audit scope)
- [ ] Replace `TBD_*` NAP placeholders before Phase 5 prod cutover

### Blockers

None. Phase 0 unblocked. Ready for `/gsd:execute-phase 0`.

## Session Continuity

**Last action (2026-06-18):** Resumed via `/gsd-resume-work`. User picked option (a)+(c): pre-resolve Phase 0 blockers in this Opus session, then `/clear` + switch to **Sonnet 4.6** to execute wave 0 only. Locked 4 Phase 0 blockers via AskUserQuestion: hybrid home practice (city-level public NAP), `TBD_*` placeholder NAP block written into PROJECT.md, training crawlers all allowed (already locked), no custom domain in v1 (no DNS work). PROJECT.md "NAP — Source of Truth" block added; 4 Key Decisions table rows marked ✓ Locked 2026-06-18.

**Previously (2026-06-15):** Session resumed via `/gsd-resume-work`. User picked option (a) "Finish Phase 0 plan-phase now". Applied iter-1 BLOCKER-8 manually (Plan 09 SEO-11 removed). Ran gsd-plan-checker iter 2 → 4 blockers + 3 warnings (down from 7 iter 1). Spawned gsd-planner iter 3 (final) revision — surgical wave/depends_on fixes + VALIDATION.md flags + Manual-Only req IDs. Committed d07c0d6. Deleted HANDOFF.json + .continue-here.md (resolved). 3-iteration revision cap reached.

**Wave map locked:**
- Wave 0: Plan 01 (test infra + scaffold)
- Wave 1: Plan 02, 07
- Wave 2: Plan 03
- Wave 3: Plan 04, 06
- Wave 4: Plan 05
- Wave 5: Plan 08
- Wave 6: Plan 09 (human checkpoints)

**Next action:** `/clear` → switch model to **Sonnet 4.6** (`/model claude-sonnet-4-6`) → run **`/gsd:execute-phase 0 --wave 0`** (or equivalent: execute only wave 0, then stop). Wave 0 = Plan 01 = SvelteKit scaffold + test infra + smoke mdsvex collection. After commit, do NOT auto-advance to wave 1 — close session, fresh session for next wave.

**Outstanding uncommitted artifacts:** None.

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
*Last updated: 2026-06-18 — Phase 0 blockers resolved; NAP locked with TBD placeholders; ready for Sonnet-4.6 single-wave execution.*
*Previously: 2026-06-15 — Phase 0 plan-phase complete; revision loop closed at iter 3; ready for /gsd:execute-phase 0.*
