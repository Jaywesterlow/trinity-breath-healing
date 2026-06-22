---
phase: 00-foundation-seo-scaffolding
plan: 03
status: complete
completed: 2026-06-19
subsystem: schema-jsonld
tags: [schema-dts, json-ld, aeo, structured-data, tdd, svelte-components]
requires: ["00-01", "00-02"]
provides: ["JsonLd", "Breadcrumbs", "buildGraph", "shared-schema-nodes", "buildWebPage", "buildFaqPage", "buildBreadcrumb"]
affects: ["00-04", "00-05", "00-08"]
tech-stack:
  added: []
  patterns:
    - "schema-dts Union type casting (as unknown as Record<string, unknown>) for test assertions"
    - "Conditional spread for absent-key semantics: ...(dateModified ? { dateModified } : {})"
    - "@graph dedup by @id via Map — shared nodes keyed, pageSpecific overrides or appends"
    - "Single JsonLd mount in +layout.svelte — page graph composed in +page.ts load()"
    - "T-00-jsonld: .replace(/<\\/script/gi, '<\\/script') in serialized JSON before {@html}"
key-files:
  created:
    - src/lib/schema/shared.ts
    - src/lib/schema/services.ts
    - src/lib/schema/breadcrumb.ts
    - src/lib/schema/webpage.ts
    - src/lib/schema/faq.ts
    - src/lib/schema/buildGraph.ts
    - src/lib/components/JsonLd.svelte
    - src/lib/components/Breadcrumbs.svelte
    - tests/unit/schema-shared.test.ts
    - tests/unit/schema-services.test.ts
    - tests/unit/schema-breadcrumb.test.ts
    - tests/unit/schema-faq.test.ts
    - tests/unit/jsonld.test.ts
  modified:
    - src/routes/+layout.svelte
    - src/routes/+layout.ts
    - src/routes/+page.ts
decisions:
  - "schema-dts Union types include `string` — use `as unknown as Record<string, unknown>` in tests for runtime property access; implementation uses typed node objects"
  - "serviceType removed from ProfessionalServiceLeaf — not in LocalBusinessBase (ServiceBase only); service types conveyed via 4 per-modality Service nodes"
  - "AnyNode = Thing from schema-dts — covers all Schema.org types for buildGraph input"
  - "Dedup by @id: Map keyed on @id, shared nodes first, pageSpecific overrides by @id match or appends if no @id"
  - "WARNING-2 confirmed: buildFaqPage([]) returns valid FAQPage with mainEntity=[] — Plan 08 must NOT gate on mainEntity.length > 0 in Phase 0"
  - "SEO-09 BLOCKER-3: buildWebPage uses conditional spread so absent dateModified means no key on object (never undefined)"
metrics:
  duration: "~35 minutes"
  completed_date: "2026-06-19"
  tasks: 2
  files_created: 13
  files_modified: 3
---

# Phase 0 Plan 03: JSON-LD Architecture Summary

## Result

Plan 03 complete. All tasks executed, all tests pass, build verified.

## One-liner

schema-dts-typed @graph composer (Organization + ProfessionalService + Person + WebSite + 4 Service nodes) + single-mount JsonLd primitive with XSS-safe serialization + Breadcrumbs component wired via +layout.svelte; prerendered landing page verified: 1 JSON-LD script, 9 nodes.

## Verification Outputs

| Check | Result |
|-------|--------|
| `pnpm test:unit -- --run` | 65/65 passed (11 test files) |
| `pnpm check` | 0 errors, 0 warnings (434 files) |
| `pnpm build` (prerender phase) | Completed — EPERM on closeBundle is known Windows-only Vercel adapter issue (same as Plan 02, non-blocking on CI/Linux) |
| node-html-parser gate on `index.html` | **PASS** — 1 JSON-LD script, 9 @graph nodes |
| `@context` | `https://schema.org` |
| `@graph` node count | **9** (8 shared + 1 WebPage landing) |
| `@graph` types present | Organization, ProfessionalService, Person, WebSite, Service x4, WebPage |
| Service node count | **4** (mahatma-healing, goldhealing, raster-energie, spinal-touch) |
| `</script` escape (T-00-jsonld) | ACTIVE — .replace fires on `</script` in graph string values |
| WARNING-2 (empty FAQPage) | CONFIRMED — `buildFaqPage([])` returns `{ '@type': 'FAQPage', mainEntity: [] }` |
| SEO-09 BLOCKER-3 (dateModified absent) | CONFIRMED — `buildWebPage({...})` without dateModified: `Object.hasOwn(result, 'dateModified') === false` |
| `@id` dedup by Map | VERIFIED — pageSpecific with matching @id replaces shared node, not appended |
| BreadcrumbList in second JSON-LD | **NONE** — Breadcrumbs.svelte emits no JSON-LD script (Pitfall #6 compliant) |

## Landing Page @graph Details

```
nodes: 9
@id values:
  https://trinity-breath-healing.vercel.app/#organization
  https://trinity-breath-healing.vercel.app/#business
  https://trinity-breath-healing.vercel.app/#practitioner
  https://trinity-breath-healing.vercel.app/#website
  https://trinity-breath-healing.vercel.app/#service-mahatma-healing
  https://trinity-breath-healing.vercel.app/#service-goldhealing
  https://trinity-breath-healing.vercel.app/#service-raster-energie
  https://trinity-breath-healing.vercel.app/#service-spinal-touch
  (WebPage — no @id, per-page transient)
```

## Commits

| Task | Phase | Commit | Files |
|------|-------|--------|-------|
| Task 1 (RED) | TDD RED | `205bc2a` | 4 test files |
| Task 1 (GREEN) | TDD GREEN | `78d9d3b` | 6 schema files + 4 test files (updated for type casting) |
| Task 2 (RED) | TDD RED | `3d0b7ab` | tests/unit/jsonld.test.ts |
| Task 2 (GREEN) | TDD GREEN | `36f6f04` | JsonLd.svelte, Breadcrumbs.svelte, +layout.svelte, +layout.ts, +page.ts |

## TDD Gate Compliance

| Gate | Status |
|------|--------|
| Task 1 RED commit (`test(00-03)`) | PRESENT — `205bc2a` |
| Task 1 GREEN commit (`feat(00-03)`) | PRESENT — `78d9d3b` |
| Task 2 RED commit (`test(00-03)`) | PRESENT — `3d0b7ab` |
| Task 2 GREEN commit (`feat(00-03)`) | PRESENT — `36f6f04` |

## Requirements Satisfied

- **SCH-01**: `<JsonLd>` is the SINGLE JSON-LD emission point (one `<script type="application/ld+json">` per prerendered page — verified via node-html-parser gate)
- **SCH-02**: `organizationNode` (Organization) + `professionalServiceNode` (ProfessionalService, D-locked) in shared.ts
- **SCH-03**: `personNode` (Person) with `worksFor` linking to organizationNode `@id`
- **SCH-04**: `makeServiceNode()` factory + `allServiceNodes` (4 x Service) in services.ts
- **SCH-05**: `webSiteNode` (WebSite, `inLanguage: 'nl-NL'`) in shared.ts
- **SCH-06**: `buildBreadcrumb()` in breadcrumb.ts returns typed BreadcrumbList with absolute URLs and positions
- **SCH-07**: `buildFaqPage()` in faq.ts is single source of truth; empty-mainEntity wiring valid (WARNING-2 closed)
- **SEO-09**: `buildWebPage()` accepts `dateModified?` and omits key when absent (BLOCKER-3 plumbing for Plan 05)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `serviceType` not available on `ProfessionalServiceLeaf`**
- **Found during:** Task 1 GREEN, `pnpm check`
- **Issue:** RESEARCH §11 listed `serviceType` for the ProfessionalService node, but `schema-dts`'s `ProfessionalServiceLeaf extends LocalBusinessBase` which does NOT include `serviceType` (that field is on `ServiceBase` only).
- **Fix:** Removed `serviceType` from `professionalServiceNode`. Service types are already conveyed by the 4 per-modality Service nodes in `services.ts`.
- **Files modified:** `src/lib/schema/shared.ts`

**2. [Rule 1 - Bug] schema-dts Union types include `string` — bracket notation fails strict TS**
- **Found during:** Task 1 GREEN, `pnpm check`
- **Issue:** schema-dts v2.0.0 defines `Organization = OrganizationLeaf | ... | string`. TypeScript strict mode rejects `organizationNode['@id']` because `string` doesn't have an `@id` property. Same for `ProfessionalService`, `Person`, `WebSite`, `Service`.
- **Fix:**
  - In test files: added `as unknown as Record<string, unknown>` casts before property access (runtime assertions). The type safety in production code is enforced by schema-dts catching typos on the typed object literals.
  - In implementation (`services.ts`, `webpage.ts`): used `(node as unknown as { '@id': string })['@id']` to extract stable `@id` values where the type narrowing is needed.
- **Files modified:** All 4 test files + `src/lib/schema/services.ts`, `src/lib/schema/webpage.ts`

### No Architectural Changes

All deviations were Rule 1 (bugs in plan's schema-dts usage assumptions). No Rule 4 architectural decisions required.

## Known Stubs

None introduced in this plan. The schema nodes reference `BRAND.practitionerFullName` (`TODO_PRACTITIONER_NAME`) and `BRAND.phone` (`TODO_PHONE`) — these are pre-existing stubs from Plan 02 tracked in UNKNOWNS.md. Plan 03 correctly propagates them to the schema; the Phase 5 launch gate will block on residual TODO_ values.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries beyond what the plan's threat model documented.

| Mitigation Applied | Component | Status |
|--------------------|-----------|--------|
| T-00-jsonld: `</script` escape | JsonLd.svelte | IMPLEMENTED — `.replace(/<\/script/gi, '<\\/script')` on serialized JSON; Test 2 verifies |
| T-00-meta: schema data from typed sources only | shared.ts/services.ts | IMPLEMENTED — no untrusted strings enter the payload; all values from `BRAND` (committed) + `SITE_URL` (env) |

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/lib/schema/shared.ts` exists | FOUND |
| `src/lib/schema/services.ts` exists | FOUND |
| `src/lib/schema/breadcrumb.ts` exists | FOUND |
| `src/lib/schema/webpage.ts` exists | FOUND |
| `src/lib/schema/faq.ts` exists | FOUND |
| `src/lib/schema/buildGraph.ts` exists | FOUND |
| `src/lib/components/JsonLd.svelte` exists | FOUND |
| `src/lib/components/Breadcrumbs.svelte` exists | FOUND |
| Commit `205bc2a` (Task 1 RED) | FOUND |
| Commit `78d9d3b` (Task 1 GREEN) | FOUND |
| Commit `3d0b7ab` (Task 2 RED) | FOUND |
| Commit `36f6f04` (Task 2 GREEN) | FOUND |
| 65/65 unit tests pass | PASSED |
| `pnpm check` 0 errors | PASSED |
| Prerendered index.html: 1 JSON-LD, 9 nodes | PASSED |
| WARNING-2: empty FAQPage valid | PASSED |
| SEO-09: dateModified key absent when not provided | PASSED |
