---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Phase 0 COMPLETE. All Plans 01-09 done. Production deployed. CI green. Phase 1 next.
last_updated: "2026-06-22T15:00:00.000Z"
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 9
  completed_plans: 8
  percent: 0
---

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
**Plan:** Wave 5 complete (Plan 08 done). Wave 6 next: Plan 09.
**Status:** Plans 01–08 merged to master. 140 unit + 19 synthetic-violation + 153 html-audit tests pass. All CI quality gates wired and green.
**Progress:** Phases 0/6 complete · Plans 9/9 executed (Plan 09 pending)

```
[█████████░] ~95% — Wave 5 done; Wave 6 (Plan 09 — branch protection + human checkpoints) next
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
| **`tsconfig.json` paths removed** — aliases via `kit.alias` only | Manual `paths` block overrode SvelteKit's auto-generated `$lib` alias → `svelte-check` error. Kit.alias is the single source of truth. | Plan 01 execution |
| **jsdom installed separately** | Vitest 4 no longer bundles jsdom; must be explicit devDependency | Plan 01 execution |

### Todos (Roadmap-level)

**Phase 0 blockers — RESOLVED 2026-06-18:**

- [x] ~~Resolve address situation~~ → Hybrid home practice, city-level public, full address shared post-booking only. PROJECT.md NAP block.
- [x] ~~Lock NAP source-of-truth~~ → PROJECT.md "NAP — Source of Truth" block locked. Known: name + practitioner age 53 + service area. `TBD_*` placeholders for phone/email/KvK/BIG/association/Instagram/practitioner-name. CI flags `TBD_*` as warnings; Phase 5 launch gate fails on residual `TBD_*`.
- [x] ~~Training-crawler posture~~ → Allow all (Google-Extended + Applebot-Extended + retrieval crawlers). Already in PROJECT.md decisions.
- [x] ~~Domain DNS access~~ → No custom domain in v1; ship on `trinity-breath-healing.vercel.app`. DNS work entirely skipped in Phase 0. Custom domain deferred post-launch.

**Plan 01 light flags (resolved or noted):**

- [x] ~~Confirm patch versions at pnpm install~~ → Verified. All packages confirmed. jsdom 29.1.1 added (Vitest 4 requirement).
- [ ] `pnpm.onlyBuiltDependencies` WARN (pnpm 11 ignores `package.json` `pnpm` field) — non-blocking; move to `.npmrc` when convenient (Plan 08 cleanup candidate)
- [ ] mdsvex `<script context="module">` deprecation in Svelte 5 — upstream mdsvex issue; advisory warning in tests only

**Downstream blockers (do not block Phase 0):**

- [ ] Photography for hero — real practitioner photo, not stock (blocks Phase 1 hero sub-unit)
- [ ] Brand-voice samples from practitioner (blocks Phase 1 copy)
- [ ] CMS-overlay decision: Sveltia on git vs PR-based editing (blocks Phase 3 — content workflow)
- [ ] Pricing transparency decision (FAQ #6) — show price on page or not (blocks Phase 1 FAQ + copy)
- [ ] BIG / non-BIG status confirmation (blocks Phase 4 — vocabulary scope)
- [ ] Professional association membership (CAT / NFG / RBCZ) (blocks Phase 4 — badges + sameAs)
- [ ] Existing Google Business Profile claim status (blocks Phase 4 — NAP audit scope)
- [ ] Replace `TBD_*` NAP placeholders before Phase 5 prod cutover

### Blockers

None. Wave 4 complete. Wave 5 (Plan 08) ready.

## Session Continuity

**Last action (2026-06-22, session 12):** Phase 0 COMPLETE. Plan 09 all tasks done. GSC meta tag wired. PR #1 merged to main. Production deploy READY. AI crawler smoke tests 4/4 pass. robots.txt ✓ sitemap 15 loc ✓. PHASE0-LAUNCH-CHECKLIST.md + 00-09-SUMMARY.md committed. Phase 1 (Landing Sections) next.

**Previously (2026-06-20, session 11):** Wave 5 complete. Plan 08 — all CI quality gates wired. Scripts: check-html.ts (H1/title/desc/canonical/hreflang/OG/Twitter/og:locale/landmarks/font-preload/SEO-09 <time datetime>), validate-json-ld.ts (schema types/dateModified cross-check/WARNING-2 FAQPage policy), check-initial-html-ai.ts, grep-placeholders.sh. Synthetic violations: 19/19. HTML audit integration: 153/153. Full ci.yml (build-and-audit + lighthouse-and-a11y + playwright-integration). lighthouserc.json (LCP/CLS/SEO/A11y budgets). Windows workaround: node --import tsx/esm + direct vite/playwright invocation. 140/140 unit tests. Commit ee3d961.

**Previously (2026-06-20, session 10):** pnpm→npm migration complete. Deleted pnpm `node_modules/` (crashed npm due to `.pnpm/` symlink tree), ran `npm install --legacy-peer-deps` successfully, added `legacy-peer-deps=true` to `.npmrc`. Fixed `runTscOnFixture` in `image.test.ts` to call `node typescript/bin/tsc` directly (avoids npm `.cmd` wrapper + `&`-in-path cmd.exe bug on Windows). 140/140 tests pass.

**Previously (2026-06-20, session 8):** Session resumed. Deleted stale HANDOFF.json. Confirmed master at `a4760c3`, 127/127 tests, Wave 3 done.

**Previously (2026-06-19, session 7):** Wave 3 complete. Plan 06 done — CSS token system (static/global.css, 25 tokens), placeholder woff2 fonts (DM Sans + Cormorant Garamond), enforcement scripts (check-tokens.sh, no-shared-css.sh), 127/127 tests passing.

**Previously (2026-06-18, session 4):** Plan 01 fully executed. All 18 remaining Task 2 items written. Build verified (`lang="nl"` confirmed, fail-loud verified, 2/2 unit tests passing). `pnpm check` 0 errors. Fixed: removed `paths` from `tsconfig.json`; installed `jsdom`.

**Previously (2026-06-18, session 3):** Plan 01 execution started. Paused mid-Task-2.

**Previously (2026-06-18, session 2):** Locked 4 Phase 0 blockers. PROJECT.md NAP block added.

**Wave map locked:**

- Wave 0: Plan 01 ✓ DONE
- Wave 1: Plan 02 ✓ DONE, Plan 07 ✓ DONE (merged)
- Wave 2: Plan 03 ✓ DONE
- Wave 3: Plan 04 ✓ DONE, Plan 06 ✓ DONE
- Wave 4: Plan 05 ✓ DONE
- Wave 5: Plan 08 ✓ DONE
- Wave 6: Plan 09 ✓ DONE

**Next action:** Phase 1 — Landing Page Sections. Start new session → `/gsd-execute-phase --wave 1` (Phase 1, Wave 1).

**Outstanding uncommitted artifacts:** None.

**Files of record:**

- `.planning/PROJECT.md` — scope, audience, constraints, key decisions
- `.planning/REQUIREMENTS.md` — 70 v1 requirements + v2 deferred + Out of Scope + traceability
- `.planning/ROADMAP.md` — 6 phases, success criteria, dependencies
- `.planning/STATE.md` — this file
- `.planning/phases/00-foundation-seo-scaffolding/00-01-SUMMARY.md` — Plan 01 completion record
- `.planning/research/SUMMARY.md` — research synthesis + "Implications for Roadmap"
- `.planning/research/STACK.md` — SvelteKit + Vercel + Cal.com + Resend + Plausible
- `.planning/research/ARCHITECTURE.md` — hub-spoke + SSG + primitives + per-section build order
- `.planning/research/FEATURES.md` — 20 table stakes + 15 differentiators + 20 anti-features + 12-question FAQ bank
- `.planning/research/PITFALLS.md` — 20 pitfalls + recovery + pitfall-to-phase mapping
- `seo-aeo-samenvatting-checklist.md` (project root) — Dutch SEO/AEO playbook, authoritative reference

---
*Last updated: 2026-06-20 — Wave 5 complete. Plans 01–08 done. 140 unit + 19 synthetic-violation + 153 html-audit tests pass. Wave 6 (Plan 09) next.*
*Previously: 2026-06-19 — Wave 3 complete. Plans 01+02+03+04+06+07 done, 127/127 tests pass.*
*2026-06-18 — Wave 0 complete; Plan 01 done.*
*2026-06-15 — Phase 0 plan-phase complete; revision loop closed at iter 3.*
