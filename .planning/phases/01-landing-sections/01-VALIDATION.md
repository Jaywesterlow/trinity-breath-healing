---
phase: 1
slug: landing-sections
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-23
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run test && npm run test:html` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run test && npm run test:html`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-00-01 | 00 (W0) | 0 | LND-09 | — | copy-check script fails on hedge language | script | `bash scripts/check-copy.sh` | ❌ W0 | ⬜ pending |
| 1-00-02 | 00 (W0) | 0 | LND-01 | — | html-audit detects hero preload + one H1 | e2e | `npm run test:html` | ❌ W0 | ⬜ pending |
| 1-00-03 | 00 (W0) | 0 | LND-07 | — | schema-faq warns when faqItems empty | unit | `npm test` | ✅ (update) | ⬜ pending |
| 1-01-01 | 01 | 1 | LND-01 PRF-02 | — | hero image has loading=eager fetchpriority=high | html-audit | `npm run test:html` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | SEO-11 | — | exactly one H1 on / | html-audit | `npm run test:html` | ✅ | ⬜ pending |
| 1-02-01 | 02 | 1 | LND-02 A11Y-01 | — | overlay has role=dialog aria-modal=true | html-audit | `npm run test:html` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | LND-03 | — | Werkwijze content in initial HTML (no {#if}) | html-audit | `npm run test:html` | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 2 | LND-04 | — | stats block renders in SSR | html-audit | `npm run test:html` | ❌ W0 | ⬜ pending |
| 1-05-01 | 05 | 3 | LND-05 PRF-07 | — | all 5 carousel <a> links in initial HTML | html-audit | `npm run test:html` | ❌ W0 | ⬜ pending |
| 1-06-01 | 06 | 3 | LND-06 A11Y-02 | — | form labels programmatically associated | html-audit | `npm run test:html` | ❌ W0 | ⬜ pending |
| 1-07-01 | 07 | 4 | LND-07 SCH-07 | — | FAQPage JSON-LD in initial HTML | unit | `npm test` | ✅ (update) | ⬜ pending |
| 1-07-02 | 07 | 4 | LND-07 | — | FAQ answers in initial HTML (not hidden via {#if}) | html-audit | `npm run test:html` | ❌ W0 | ⬜ pending |
| 1-08-01 | 08 | 4 | LND-08 LND-09 | — | copy preservation gate passes | script | `bash scripts/check-copy.sh` | ❌ W0 | ⬜ pending |
| 1-09-01 | 09 | 5 | LND-10 | — | hedge-language scan passes | script | `bash scripts/check-copy.sh` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/check-copy.sh` — copy preservation + hedge-language grep gate (LND-09, LND-10)
- [ ] `tests/html-audit.spec.ts` extension — hero preload assertion (PRF-02/03/04)
- [ ] `tests/html-audit.spec.ts` extension — overlay aria attributes (A11Y-01)
- [ ] `tests/html-audit.spec.ts` extension — carousel initial HTML (PRF-07, LND-05)
- [ ] `src/lib/schema/validate-json-ld.ts` — flip WARNING-2 to ERROR after sub-unit 7 (faqItems.length > 0 enforcement)
- [ ] `src/lib/assets/images/` — 1×1 PNG stubs for all 6 required images (hero, card-spinal-touch, card-goldhealing, about-illustration-1, about-illustration-2) + logo SVG stub

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hero LCP < 2.5s on real device | PRF-02 | Requires field data / real Chrome | Run PageSpeed Insights on preview URL after sub-unit 1 PR |
| Mobile overlay Escape key closes | A11Y-01 | Keyboard interaction, no jsdom | Tab to hamburger, Enter to open, Escape to close; verify focus returns |
| Carousel circular wrap (last→first) | LND-05 | JS behavior, no jsdom | Click prev on first card; verify wraps to last |
| Form no-JS renders email form | LND-06 | Requires disabling JS in browser | Open with JS disabled; verify email form visible, toggle hidden |
| Reduced motion: transitions skip | A11Y-04 | OS setting required | Enable `prefers-reduced-motion` in OS; verify overlay and header have no animation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
