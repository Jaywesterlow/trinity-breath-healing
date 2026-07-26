# E2E failure triage

> **Note added 2026-07-26:** the counts below (33 → 20) predate tests added on
> 2026-07-25/26 — `werkwijze-scrolljack.spec.ts`, `faq-disclosure.spec.ts`, and a new
> `reveal.spec.ts`. The suite has not been re-run since. The three buckets below are still the
> right shape; re-measure the numbers before acting on any of its recommendations.

_2026-07-13, recorded during Slice 2. Started at **33 failing**; **20 remain**. No test's expectations were weakened — the 13 that went green were fixed in the app, because the tests were right._

## Status

| | Failing |
|---|---|
| Baseline (pre-migration original AND migrated fork, identical) | 33 |
| After `1597d1f` — per-page `<title>`/description bug fixed | **20** |

The 14 `routes.spec.ts` title failures turned out to be a genuine SEO bug, not test rot (see below). The remaining 20 are Phase-0 contracts asserting work that does not exist yet, plus two the hero rewrite made obsolete. **No test was changed** — changing a contract is a product decision, not a cleanup.

## Not caused by the Tailwind/shadcn migration

Measured, not assumed: the pre-migration app (`trinity-breath-healing`, `fix/hero-fit-cards`) and the migrated fork produce the **identical** result — 33 failed / 167 passed — once both are built with the same `PUBLIC_SITE_URL`. The migration introduced zero e2e regressions.

> An earlier count of 48 failures was an artifact: the original repo's `.svelte-kit/output` was a stale build baked with the production canonical URL, while the fork was freshly built against the local `.env` (`http://localhost:5173`). Rebuilding both the same way reconciles them exactly. Playwright's `vite preview` serves whatever build is on disk — always `npm run build` first.

## The 33, by cluster

| # | Cluster | Spec | What it asserts | Verdict |
|---|---------|------|-----------------|---------|
| 14 | Stub route `<title>` | `routes.spec.ts` | Each stub route's `<title>` starts with the `STUB_META` base title | **REAL BUG — fixed.** See below. The test was right; the app was wrong. |
| 15 | Font preload (FND-06) | `html-audit.spec.ts` | `<link rel="preload" as="font" crossorigin>` present on every page | **Never implemented.** The test calls itself "defensive". Real perf work, and it changes what ships in `<head>`. |
| 1 | Hero image preload (PRF-02) | `html-audit.spec.ts` | `<link rel="preload" as="image">` for the hero | **Now obsolete.** Since `81bbe8f` the hero is an inlined SVG — there is no image to preload. This test asserts a contract the architecture no longer has. Strongest candidate for retirement. |
| 1 | Hero eager loading (PRF-03) | `html-audit.spec.ts` | `loading="eager"` appears exactly once (the hero `<img>`) | **NEW — introduced by `81bbe8f`.** This test PASSED before the hero rewrite. Replacing `<enhanced:img>` with an inlined SVG removed the only `<img loading="eager">`, so the count is now 0. Same call as PRF-02: the contract's *intent* (hero paints immediately, nothing render-blocking) is arguably better served by an inline SVG — but the contract text no longer matches the architecture. |
| 1 | Modal ARIA (A11Y-01) | `html-audit.spec.ts` | `role="dialog"` present | **Asserting unbuilt work** — no overlay/modal exists yet. |
| 1 | Form labels (A11Y-02) | `html-audit.spec.ts` | every `<input>`/`<textarea>` has a `<label>` | **Asserting unbuilt work** — fails with "contact form not yet implemented". Lands in P3. |
| 1 | FAQPage `mainEntity=[]` | `synthetic-violations.spec.ts` | an empty `mainEntity` should be *rejected* by `validate-json-ld.ts` | **Real validator gap.** The synthetic violation passes validation when it should fail (WARNING-2 contract). |

## The one real bug found (and fixed): every page shipped the same `<title>` and description

`src/routes/+layout.svelte` rendered `<Head meta={data.meta} />`, where `data` is the **layout's** load data. Page-level `+page.ts` files each return their own `meta` (built from `STUB_META`), but the layout never looked at it — so `Head`, the only component that emits `<title>` and `<meta name="description">`, always received the layout default.

Result, measured on the prerendered output:

- All 15 pages: `<title>TRINITY Breath &amp; Healing | TRINITY Breath &amp; Healing</title>`
- All 15 pages: the same generic `<meta name="description">`
- Canonicals were *not* affected (the layout's `meta.path` is per-route), which is why the html-audit canonical checks passed and this stayed hidden.

The correct per-page copy was authored all along in `src/lib/seo/stub-meta.ts` (`FAQ – Veelgestelde vragen…`, `Contact – Boek een intake…`) and passed into `StubLayout` — but `StubLayout` only uses it for the visible `<h1>` and body text, never for `<head>`.

For a project whose stated core value is SEO/AEO discoverability, 15 pages sharing one title and one description is duplicate-content signal across the entire site. Fixed in `1597d1f` by reading `page.data.meta` (page data overrides layout data) instead of the layout's own.

## Recommendation for the remaining 20

Three different things are tangled together, and they want different treatment:

1. **Tests asserting features that do not exist yet** (A11Y-01 modal, A11Y-02 contact form, and arguably FND-06 font preload) — 17 of the 20. A suite that is *expected* to be red teaches everyone to ignore red. Convert to `test.fixme()` with the owning phase in the title so they light up automatically when the feature lands. Biggest win available: takes 17 permanent failures off the board without weakening a single contract.
2. **The two obsolete ones** (PRF-02 hero preload, PRF-03 hero eager-load). The hero is now an inlined SVG. Retire them, or rewrite them to assert what you actually want now — that the hero paints without a render-blocking fetch. Note PRF-03 was passing until `81bbe8f`; whoever owns the hero rewrite should make this call.
3. **The genuine remaining bug** (JSON-LD validator accepts `FAQPage` with an empty `mainEntity` when the WARNING-2 contract says it must reject it). Real gap in `validate-json-ld.ts`. Small, self-contained, worth fixing.

None of this blocks Slice 2. It is pre-existing debt that the migration merely made visible — and the one item that turned out to be a live SEO bug is already fixed.
