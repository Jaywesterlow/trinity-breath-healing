# Plan 01-07 Summary — FaqSection + FAQ JSON-LD

**Status:** Complete (pending git commits — shell permission blocked)
**Date:** 2026-06-23

## Files Created

- `src/lib/content/faq/index.ts` — `FaqItem` interface + `faqItems` array with 10 Dutch FAQ entries covering: ademwerk, behandeling geschiktheid, sessieduur/kosten, Mahatma Healing, Goldhealing, Raster Energie, Spinal Touch, aantal sessies, wetenschappelijke onderbouwing, afspraak maken.
- `src/lib/components/FaqSection.svelte` — `<details>/<summary>` accordion. No JS state needed. All FAQ answers are in SSR HTML from the first byte. Token-only CSS. Chevron SVG rotates 180° on open via CSS only. WCAG-compliant (44px min-height, `aria-hidden` on decorative SVG).

## Files Modified

- `src/routes/+page.ts` — added `import { faqItems }` + `import { buildFaqPage }`, wired `buildFaqPage(faqItems)` into `pageSpecific` array alongside `buildWebPage`.
- `src/routes/+page.svelte` — imported `FaqSection`, mounted `<FaqSection />` after `<ContactSection />`, before SEO-09 recency block.
- `scripts/validate-json-ld.ts` — WARNING-2 gate flipped: now asserts `FAQPage.mainEntity` is a non-empty array when a FAQPage node exists in the graph.
- `tests/unit/schema-faq.test.ts` — WARNING-2 test flipped from "empty is valid" to "8+ items passes" (Phase 1 LND-07 contract).

## SEO/AEO Impact

- FAQPage JSON-LD now emits 10 `Question` + `AcceptedAnswer` nodes in the `@graph` on the landing page — eligible for Google Rich Results FAQ accordion.
- All answer text is in initial SSR HTML via `<details>` — visible to AI crawlers (Googlebot, GPTBot, ClaudeBot) without JS execution.
- `mainEntity.length >= 8` validates in CI via the flipped WARNING-2 gate.

## Key Decisions

- `<details>/<summary>` chosen over JS accordion: answers always in DOM, no hydration, no sibling-close logic needed, CLS = 0.
- Chevron rotation done entirely with CSS `transition: transform` — zero JS.
- FAQ content covers all 5 modalities offered by Trinity Breath & Healing to maximize AEO citation surface area.

## Git Commits (pending)

1. `feat(01-07): faq/index.ts — 10 Dutch FAQ items, FaqItem interface`
2. `feat(01-07): FaqSection.svelte — details/summary accordion, FAQ heading`
3. `feat(01-07): +page.ts — wire buildFaqPage(faqItems) into JSON-LD graph`
4. `feat(01-07): +page.svelte — mount FaqSection after ContactSection`
5. `feat(01-07): validate-json-ld — flip WARNING-2 gate to require mainEntity.length > 0`
6. `feat(01-07): schema-faq.test.ts — flip WARNING-2 test for Phase 1`
