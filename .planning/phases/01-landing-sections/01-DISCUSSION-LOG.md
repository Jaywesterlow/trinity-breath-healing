# Phase 1: Landing Sections — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 01-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-22
**Phase:** 1-Landing-Sections
**Areas discussed:** Hero illustration strategy, Header scroll behavior, Behandelingen card interaction, FAQ content strategy, Werkwijze accordion, About + stats, Contact no-JS, Cross-cutting layout

---

## Hero Illustration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| SVG inline | Inline SVG, no network request, best LCP | |
| img eager | `<img loading="eager" fetchpriority="high">` + preload | |
| EnhancedImage (PNG) | AVIF/WebP at build time, `<picture>` output | ✓ |

**User's choice:** Assets are PNGs with transparent background. EnhancedImage is correct tool.

| Option | Description | Selected |
|--------|-------------|----------|
| One SVG scales all | Single asset, CSS controls size | |
| Two variants | Mobile crop + desktop full via `<picture>` | |
| Single PNG (confirmed) | One PNG, no alt sizes | ✓ |

**Notes:** User confirmed PNGs (not SVGs). Will provide files; requested file placement instructions.

| Option | Description | Selected |
|--------|-------------|----------|
| Hidden on mobile | `display:none` on small screens | |
| Shown below text (stacked) | Image below H1+body in normal flow | |
| Shown above text | Image above hero content on mobile | ✓ |

**Notes:** Mobile = image above content (normal flow). Desktop = 2-column CSS grid (content left, image right). User clarified "background" desire means image doesn't steal horizontal space from text — achieved via grid column, not `position: absolute`.

| Option | Description | Selected |
|--------|-------------|----------|
| Just main illustration | One hero PNG only | |
| Main + service card images | Service tiles have thumbnails | ✓ |
| Main + practitioner portrait | Portrait in hero | |

**Notes:** User confirmed: hero PNG + 2 service card images (Spinal Touch = woman's back; Goldhealing = "son") + 3 social icons (header/footer) + logo SVG. User feedback: Claude should analyze Figma frame descriptions first, then confirm analysis — not ask open questions about what's visible.

---

## Header Scroll Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky (always visible) | `position: sticky` | |
| Scrolls away (smart-hide) | Fixed, hides on scroll-down, re-appears on scroll-up | ✓ |

**Notes:** Header disappears on scroll-down, re-appears on scroll-up. Requires JS scroll-direction detection. `position: fixed` to avoid CLS.

| Option | Description | Selected |
|--------|-------------|----------|
| Transparent over hero, solid after scroll | JS scroll listener needed | |
| Always solid | No JS, no INP risk | ✓ |

**Notes:** No transparent-over-hero transition. Header and hero content have no overlap per Figma.

| Option | Description | Selected |
|--------|-------------|----------|
| 768px hamburger breakpoint | Tablet+ shows full nav | |
| 1024px hamburger breakpoint | Only large screens show full nav | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| X button + Escape + tap outside | Full WCAG 2.2 AA | |
| X button only | User stated preference | ✓ (+ Escape added) |

**Notes:** User said X button only (overlay is full-screen, no "outside" to tap). Escape key added regardless for WCAG 2.2 AA A11Y-01 compliance.

**Header CTA — User's response (free text):** All nav items anchor-link to their corresponding section on the landing page. CTA "Maak een afspraak" → `#contact`. Phase 2+ will change to real page routes when dedicated pages exist.

---

## Behandelingen Card Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Navigate to service page | Cards are `<a>` links | ✓ |
| Active state only (no navigation) | Cards are `<button>` elements | |

**Notes:** Both hero service tiles AND Behandelingen section cards are `<a>` links to service pages. "Meer klachten" (hero) → `/diensten/`. "Meer diensten" (Behandelingen) → `/diensten/`.

**User clarification (free text):** Behandelingen carousel shows 5 visible cards but scrolls to reveal more (infinite loop back to first). Partial outer cards (left/right) are clipped on all screen sizes to hint at scrollability.

| Option | Description | Selected |
|--------|-------------|----------|
| All 5 visible on desktop (no carousel) | CSS grid | |
| Partial outer cards visible (carousel always active) | Same behavior all breakpoints | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| CSS scroll-snap only | Zero JS | |
| Progressive enhancement (JS + CSS fallback) | JS circular carousel, CSS fallback | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-rotate | Timer-driven | |
| User interaction only | Swipe/drag only | ✓ |

**Notes:** Phase 1 = basic circular JS carousel. User has Osmo animation reference to add later. No auto-rotate for now.

---

## FAQ Content Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| TypeScript data file `src/lib/content/faq/index.ts` | Typed array, feeds both rendered FAQ and JSON-LD | ✓ |
| MDX files one per item | Richer formatting | |
| Hardcoded in Svelte component | Duplicates data in JSON-LD | |

| Option | Description | Selected |
|--------|-------------|----------|
| Draft placeholders now | CI passes, real content replaces in Phase 4 | ✓ |
| Real Q&As ready | User provides content immediately | |
| Wait for real content | FAQ section deferred | |

| Option | Description | Selected |
|--------|-------------|----------|
| Accordion `<details>/<summary>` | Content always in DOM, no JS | ✓ |
| All open | All answers visible | |

---

## Werkwijze Accordion

| Option | Description | Selected |
|--------|-------------|----------|
| Only one open at a time | Minimal JS manages siblings | ✓ |
| Multiple open simultaneously | Pure native HTML | |

| Option | Description | Selected |
|--------|-------------|----------|
| Equal width 3 columns | CSS grid | ✓ |
| Different widths | Featured/wider card | |

---

## About + Stats

**User's choice (free text):** Section has 2 illustration images matching Figma design faithfully. User will decide later whether to replace with practitioner photos.

| Option | Description | Selected |
|--------|-------------|----------|
| BRAND constants in brand.ts | Easy to update, single source | ✓ |
| Hardcoded in component | Simpler | |

---

## Contact No-JS

**User's choice (free text):** No JS = email form only. Toggle button hidden. Description text mentioning "online meeting / booking" also hidden — only email-form-appropriate description remains. Result is a coherent, complete UI without toggle.

---

## Cross-Cutting Layout

| Option | Description | Selected |
|--------|-------------|----------|
| All sections use centered container | Consistent `--container-max` | ✓ |
| Some sections full-bleed | Certain sections span full viewport | |

| Option | Description | Selected |
|--------|-------------|----------|
| Section IDs match route slugs | `id="over-mij"` etc. | ✓ |
| Section IDs match nav label text | `id="over mij"` etc. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Standard icon library (Lucide/Heroicons) | No files needed | ✓ |
| Custom Figma-exported SVG icons | User provides files | |

---

## Claude's Discretion

- Exact breakpoint for hero 2-column grid (planner aligns with nav 1024px for consistency)
- Scroll-snap alignment values for Behandelingen carousel
- Svelte component file naming and sub-directory structure
- Placeholder FAQ questions and answers (8–12 Dutch items)
- Whether `.container` utility class lives in `static/global.css` or scoped per section

## Deferred Ideas

- Practitioner photo in About section (future v2 phase)
- Osmo carousel animation (user adds post-Phase 1)
- Nav items → real page routes (Phase 2+)
- Social platform alternatives for null channels (Phase 4 copy gate)
- Custom domain DNS (post-launch)
