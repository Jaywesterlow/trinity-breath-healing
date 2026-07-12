---
phase: 00-foundation-seo-scaffolding
plan: 05
status: complete
completed: 2026-06-20
subsystem: stub-routes-seo09
tags: [stubs, seo, schema, breadcrumbs, build-date, tdd]
requires: ["00-02", "00-03", "00-04"]
provides: ["14-stub-routes", "STUB_META", "StubLayout", "SEO-09-BUILD_DATE", "__BUILD_DATE__"]
affects: ["00-08", "00-09", "Phase 1 LND-*"]
tech-stack:
  added: []
  patterns:
    - "Vite define: { __BUILD_DATE__ } — build-time YYYY-MM-DD constant for SEO-09"
    - "STUB_META Record<path, {title,description,crumbs}> — single source for 14 stub routes"
    - "StubLayout.svelte — reuses Plan 02/03 Breadcrumbs + PageTitle primitives, no UI duplication"
    - "Per-route +page.ts load() — buildGraph + buildBreadcrumb + buildWebPage; service stubs add makeServiceNode"
    - "$derived() for STUB_META lookup in .svelte files (Svelte 5 runes reactive correctness)"
key-files:
  created:
    - src/lib/seo/stub-meta.ts
    - src/lib/components/StubLayout.svelte
    - src/routes/werkwijze/+page.ts
    - src/routes/werkwijze/+page.svelte
    - src/routes/over-mij/+page.ts
    - src/routes/over-mij/+page.svelte
    - src/routes/behandelingen/+page.ts
    - src/routes/behandelingen/+page.svelte
    - src/routes/contact/+page.ts
    - src/routes/contact/+page.svelte
    - src/routes/diensten/+page.ts
    - src/routes/diensten/+page.svelte
    - src/routes/diensten/mahatma-healing/+page.ts
    - src/routes/diensten/mahatma-healing/+page.svelte
    - src/routes/diensten/goldhealing/+page.ts
    - src/routes/diensten/goldhealing/+page.svelte
    - src/routes/diensten/raster-energie/+page.ts
    - src/routes/diensten/raster-energie/+page.svelte
    - src/routes/diensten/spinal-touch/+page.ts
    - src/routes/diensten/spinal-touch/+page.svelte
    - src/routes/blog/+page.ts
    - src/routes/blog/+page.svelte
    - src/routes/artikelen/+page.ts
    - src/routes/artikelen/+page.svelte
    - src/routes/faq/+page.ts
    - src/routes/faq/+page.svelte
    - src/routes/privacyverklaring/+page.ts
    - src/routes/privacyverklaring/+page.svelte
    - src/routes/algemene-voorwaarden/+page.ts
    - src/routes/algemene-voorwaarden/+page.svelte
    - tests/unit/stub-meta.test.ts
    - tests/unit/landing-date.test.ts
    - tests/integration/routes.spec.ts
  modified:
    - vite.config.ts
    - src/app.d.ts
    - src/routes/+page.ts
    - src/routes/+page.svelte
decisions:
  - "$derived() for STUB_META lookup in stub .svelte files — svelte-check warns on const capture of $props() value; $derived reactive wrapper eliminates all 14 warnings at zero cost"
  - "Head.svelte (Plan 02) appends ' | TRINITY Breath & Healing' suffix to all non-root titles — Playwright integration test checks stub.title is contained in <title>, not exact equality (Plan 05 adapts to Plan 02 behavior)"
  - "prerender = true on every +page.ts — explicit per-route prerender flag supplements svelte.config.js prerender.entries='*' for clarity"
  - "__BUILD_DATE__ declared inside declare global{} in app.d.ts (not module scope) — required because app.d.ts has export{} making it a module; module-scope declare const is not globally visible to TypeScript"
metrics:
  duration: "~45 minutes"
  completed_date: "2026-06-20"
  tasks: 2
  files_created: 33
  files_modified: 4
---

# Phase 0 Plan 05: 14 Stub Routes + SEO-09 BUILD_DATE Summary

## Result

Plan 05 complete. Both tasks delivered via TDD RED->GREEN. 139/140 unit tests pass (1 pre-existing robots.test.ts bash failure from Plan 04 on Windows). `pnpm check` 0 errors, 0 warnings. Build produces 16 prerendered HTML files (1 landing + 14 stubs + 1 sitemap.xml).

## One-liner

14 individual stub routes each emitting distinct Dutch title/description/canonical/BreadcrumbList/WebPage JSON-LD per route, plus Vite-injected __BUILD_DATE__ flowing from build time to visible `<time datetime>` on landing and JSON-LD WebPage.dateModified simultaneously (BLOCKER-3 / SEO-09 closed).

## Verification Outputs

| Check | Result |
|-------|--------|
| `pnpm check` | 0 errors, 0 warnings (518 files) |
| `pnpm test:unit -- --run` | 139/140 passed (1 pre-existing robots bash skip on Windows) |
| Prerendered stubs | 14 HTML files confirmed in .svelte-kit/output/prerendered/pages/ |
| Index.html `<time datetime>` | `2026-06-20` — matches JSON-LD WebPage.dateModified |
| `__BUILD_DATE__` in HTML | Absent (replaced by Vite) |
| Service node @id | FOUND in 4 /diensten/<modality>.html files |
| FND-08 (14 reserved routes) | Satisfied |
| SEO-09 (visible dateModified) | Satisfied — BLOCKER-3 closed |
| Phase 0 success criterion #3 | Satisfied |

## Stub Metadata Reference (for Phase 4 hedge-language audit + Phase 5 launch checklist)

| Route | Title (chars) | Description (chars) |
|-------|---------------|---------------------|
| `/werkwijze` | Werkwijze – Zo verloopt een sessie bij Trinity BnH (50) | Ontdek hoe een sessie bij Trinity Breath & Healing verloopt: van het eerste intakegesprek tot de daadwerkelijke behandeling in Amsterdam en de regio NL. (152) |
| `/over-mij` | Over mij – Ervaringsdeskundige \| Trinity Healing BnH (52) | De therapeut achter Trinity Breath & Healing begeleidt vanuit eigen ervaring bij ademwerk en lichaamsgerichte therapie en alle energetische behandelingen. (154) |
| `/behandelingen` | Behandelingen – Overzicht Trinity Breath & Healing (50) | Bekijk alle behandelingen van Trinity Breath & Healing: ademtherapie, energetische sessies, Spinal Touch en Mahatma Healing in Amsterdam en de gehele regio. (156) |
| `/contact` | Contact – Boek een intake bij Trinity Breath & Heal (51) | Neem contact op met Trinity Breath & Healing voor een vrijblijvend intakegesprek via Google Meet of per telefoon voor vragen en het maken van een afspraak. (155) |
| `/diensten` | Diensten – Energetische therapie \| Trinity Healing (50) | Alle diensten van Trinity Breath & Healing: Mahatma Healing, Goldhealing, Raster Energie en Spinal Touch voor lichaam, geest en uw energetisch welzijn. (151) |
| `/diensten/mahatma-healing` | Mahatma Healing – Energetisch helen \| Trinity BnH. (50) | Mahatma Healing verbindt u met universele levensenergie om blokkades op te heffen en het zelfreinigend vermogen van lichaam en ziel te activeren bij Trinity. (157) |
| `/diensten/goldhealing` | Goldhealing – Gouden frequentie \| Trinity Healing. (50) | Goldhealing werkt met hoogfrequente gouden lichtenergie om emotionele en energetische patronen los te laten en innerlijk evenwicht te hervinden bij Trinity. (156) |
| `/diensten/raster-energie` | Raster Energie – Energieveldwerk \| Trinity Healing (50) | Raster Energie werkt op het subtiele energieraster rondom het lichaam om verstoringen in het energetische veld te herstellen en vitaliteit te versterken. (153) |
| `/diensten/spinal-touch` | Spinal Touch – Wervelkolom balanceren \| Trinity BnH (51) | Spinal Touch is een zachte aanraaktechniek die de balans in de wervelkolom herstelt, spierspanning vermindert en het zenuwstelsel rustig en kalm brengt. (152) |
| `/blog` | Blog – Inzichten over ademwerk en heling \| Trinity (50) | Lees artikelen van Trinity Breath & Healing over ademwerk, trauma-verwerking en energetische therapie voor uw lichamelijk en geestelijk welzijn en herstel. (155) |
| `/artikelen` | Artikelen en kennisbank \| Trinity Breath & Healing (50) | Verdiep uw kennis met artikelen van Trinity Breath & Healing over ademtherapie, lichaamsgerichte methoden en energetisch werken als weg naar uw herstel. (152) |
| `/faq` | FAQ – Veelgestelde vragen \| Trinity Breath Healing (50) | Antwoorden op veelgestelde vragen over sessies, werkwijze en de behandelingen van Trinity Breath & Healing in Amsterdam voor ademwerk en energetische therapie. (159) |
| `/privacyverklaring` | Privacyverklaring – AVG \| Trinity Breath & Healing (50) | Lees de privacyverklaring van Trinity Breath & Healing: hoe persoonsgegevens worden verwerkt conform de AVG, welke gegevens worden bewaard en uw rechten. (153) |
| `/algemene-voorwaarden` | Algemene voorwaarden – Afspraken \| Trinity Healing (50) | Bekijk de algemene voorwaarden van Trinity Breath & Healing: afspraken over annulering, betaling, aansprakelijkheid en vertrouwelijkheid voor therapiesessies. (158) |

## SEO-09 / BLOCKER-3 Closure Evidence

- `__BUILD_DATE__` value emitted by build: `2026-06-20`
- Landing page `<time datetime="2026-06-20">2026-06-20</time>` — visible, not hidden
- JSON-LD WebPage.dateModified: `"2026-06-20"` — exact match
- `__BUILD_DATE__` literal not present in index.html — Vite define replaced it at build time
- Single source: vite.config.ts define → `__BUILD_DATE__` → +page.ts → `meta.dateModified` → both `<time datetime>` attribute AND `buildWebPage({dateModified})` JSON-LD argument
- No drift possible: UI date and structured data date always equal by construction

## Requirements Satisfied

- **FND-08**: 14 reserved stub routes return HTTP 200 with prerendered HTML
- **SEO-09**: Visible `dateModified` on landing page (`<time datetime="2026-06-20">`) — BLOCKER-3 closed
- **Phase 0 success criterion #3**: All 14 stub routes prerendered with distinct per-page SEO scaffolding

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1 RED | `fc31af0` | tests/unit/stub-meta.test.ts, tests/unit/landing-date.test.ts |
| Task 1 GREEN | `e2936a4` | src/lib/seo/stub-meta.ts, StubLayout.svelte, vite.config.ts, app.d.ts, +page.ts, +page.svelte |
| Task 2 RED | `b488146` | tests/integration/routes.spec.ts |
| Task 2 GREEN | `a91f5d9` | 28 stub route files (14 routes × 2) + integration test update |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Svelte 5 runes] $derived() wrapper for STUB_META lookup in stub .svelte files**
- Found during: Task 2 GREEN — `pnpm check` emitted 14 warnings: "This reference only captures the initial value of `data`"
- Issue: `const stub = STUB_META[data.meta.path]!` in Svelte 5 runes mode; `data` is reactive ($props()) but `stub` was a plain `const` capturing the initial value
- Fix: Changed to `const stub = $derived(STUB_META[data.meta.path]!)` across all 14 `.svelte` files
- Result: 0 warnings from `pnpm check` (was 14)

**2. [Rule 1 - Adaptation] Playwright integration test title assertion adjusted for Plan 02 Head.svelte suffix behavior**
- Found during: Task 2 pre-verification — prerendered werkwijze.html `<title>` was 77 chars, not 50
- Root cause: `Head.svelte` (Plan 02) appends `| TRINITY Breath & Healing` suffix to all non-root page titles: `${meta.title} | TRINITY Breath & Healing`
- Fix: Changed integration test assertion from `toBe(stub.title)` to `toContain(stub.title)` — verifies the STUB_META base title is present in the full rendered title
- The STUB_META titles (50-60 chars) remain the canonical per-route titles; the suffix is presentation-only

### Pre-existing Issues (not introduced by this plan)

- `robots.test.ts` bash regex failure on Windows (1 failing test) — documented in Plan 04 SUMMARY; bash CRLF line-ending issue; CI Linux exercises it correctly
- `EPERM` on Vercel adapter `closeBundle` on Windows — documented in Plan 04 SUMMARY; prerendered output still produced correctly

## UNKNOWNS Surfaced During Implementation

- `/werkwijze` (v2): will cover session flow, intake process, what to expect. Phase 2 content needed.
- `/over-mij` (v2): practitioner name (TBD_PRACTITIONER_NAME), training history, personal story. Phase 2 content needed.
- `/behandelingen` (v2): full modality comparison, session types. Phase 2 content needed.
- `/blog` and `/artikelen` (v2): separate content types or merged? Decision deferred to Phase 3 CMS planning.
- `/faq` (v2): 8-12 Q&As planned for landing page; this route will be the deep-link target for expanded answers.
- Service stub descriptions mention "bij Trinity" which is slightly informal — Phase 4 hedge-language audit should review.

## Known Stubs

None — all 14 stub routes achieve their Phase 0 purpose: HTTP 200 with distinct SEO scaffolding. The "Komt binnenkort" body text is intentional placeholder per CONTEXT.md D-04 (zero-301 v2 migration guarantee). Phase 1+ replaces body content only; URLs, crumbs, and schema scaffold persist.

## Threat Surface Scan

No new trust boundaries introduced beyond what the plan's threat model covers:
- STUB_META is committed source-of-truth; no user input interpolated into any route
- `__BUILD_DATE__` is build-time constant; no runtime mutability
- 14 prerendered HTML files have no dynamic server endpoints
- No new auth paths, network endpoints beyond static HTML, or schema changes at trust boundaries

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/lib/seo/stub-meta.ts` exists | FOUND |
| `src/lib/components/StubLayout.svelte` exists | FOUND |
| `vite.config.ts` contains `__BUILD_DATE__` | FOUND |
| `src/app.d.ts` declares `__BUILD_DATE__` | FOUND |
| `src/routes/+page.ts` references `__BUILD_DATE__` | FOUND |
| `src/routes/+page.svelte` has `<time datetime` | FOUND |
| All 14 `+page.ts` files exist | FOUND |
| All 14 `+page.svelte` files exist | FOUND |
| `tests/unit/stub-meta.test.ts` exists | FOUND |
| `tests/unit/landing-date.test.ts` exists | FOUND |
| `tests/integration/routes.spec.ts` exists | FOUND |
| 14 prerendered stub HTML files | ALL FOUND |
| `index.html` `<time datetime>` = `2026-06-20` | FOUND |
| `index.html` JSON-LD WebPage.dateModified = `2026-06-20` | FOUND |
| `__BUILD_DATE__` literal absent from `index.html` | CONFIRMED |
| Service node @id in 4 modality stubs | ALL FOUND |
| `pnpm check` | 0 errors, 0 warnings |
| Unit tests | 139/140 pass (1 pre-existing) |
| Commit fc31af0 | EXISTS |
| Commit e2936a4 | EXISTS |
| Commit b488146 | EXISTS |
| Commit a91f5d9 | EXISTS |
