# Phase 1: Landing Sections — Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the complete Dutch landing page (`/`) mobile-first, section by section, in 8 sub-units following Figma frame order. Every section is server-rendered in initial HTML. Each sub-unit ships as its own PR with per-section DoD gates (Lighthouse SEO=100, A11y=100, CWV budgets, JSON-LD valid). No integrations (Cal.com, Resend, Plausible) are wired here — Phase 3 handles those.

Sub-units in order:
1. Hero (LND-01) — Frame 1
2. Header + mobile menu (LND-02)
3. Werkwijze 3-card / accordion (LND-03) — Frame 2
4. About + stats (LND-04) — Frame 3
5. Behandelingen service selector / carousel (LND-05) — Frame 4
6. Contact + booking toggle (LND-06) — Frame 5
7. Inline FAQ (LND-07)
8. Footer (LND-08) — Frame 6

</domain>

<decisions>
## Implementation Decisions

### Hero Section (Sub-unit 1 — LND-01)

- **D-01:** Hero illustration is a **PNG** with transparent background (not SVG). Use `EnhancedImage` component (`@sveltejs/enhanced-img`) → AVIF/WebP at build time. Asset placed in `src/lib/assets/images/hero.png` (user provides).
- **D-02:** Mobile layout: image stacks **above** the H1+body+CTA block in normal flow (column direction). Desktop layout (1024px+): **2-column CSS grid** — content left, hero image right. Image is in grid flow (not `position: absolute`). This gives the user's desired "doesn't steal space from content" effect via the right grid column.
- **D-03:** LCP strategy: `EnhancedImage` with `loading="eager" fetchpriority="high"` + `<link rel="preload" as="image">` injected in Head. Hero is the declared LCP element.
- **D-04:** Hero bottom-left service tiles (3 cards):
  - Card 1: Spinal Touch → `<a href="/diensten/spinal-touch">` — has image (woman's back PNG, `loading="lazy"`)
  - Card 2: Goldhealing → `<a href="/diensten/goldhealing">` — has image ("son" PNG, `loading="lazy"`)
  - Card 3: "Meer klachten" → `<a href="/diensten/">` — text-only, no image
  - All three are `<a>` tags (crawlable links).

### Header + Mobile Menu (Sub-unit 2 — LND-02)

- **D-05:** Header is **`position: fixed`** (out of flow). Smart-hide behavior: hides on scroll-down, re-appears on scroll-up. Requires lightweight Svelte `onMount` scroll-direction listener. No transparent-over-hero transition — header is always solid.
- **D-06:** Main content gets `padding-top` equal to header height to prevent hero overlap.
- **D-07:** Hamburger breakpoint: **1024px**. Below 1024px = hamburger icon, full-screen overlay. At 1024px+ = full inline nav.
- **D-08:** Mobile overlay is full-screen (no "outside" area). Closes via **X button** AND **Escape key** (Escape added for WCAG 2.2 AA A11Y-01 compliance — user specified X only, but Escape is non-negotiable for accessibility).
- **D-09:** Logo: **separate SVG file** from favicon. User provides it → `src/lib/assets/logo.svg`.
- **D-10:** Social icons: **standard icon library** (Lucide or Heroicons SVG). No custom files needed. Show all icon slots that appear in the Figma design regardless of null `BRAND.socials` values — null platforms use `href="#"` for now; real URLs filled before Phase 4.
- **D-11:** Nav items (Home · Werkwijze · Over mij · Behandelingen · Contact) are **anchor links** (`href="#werkwijze"`, `href="#over-mij"`, etc.) on the landing page. CTA "Maak een afspraak" → `href="#contact"`. Phase 2+ will change these to real page routes.

### Werkwijze 3-Card / Accordion (Sub-unit 3 — LND-03)

- **D-12:** Desktop: **3 equal-width CSS grid columns**. No accordion on desktop.
- **D-13:** Mobile: **native `<details>/<summary>` accordion**. **Only one card open at a time** — minimal JS manages state (closing others when one opens). Content stays in DOM for AI crawlers regardless of open/closed state.
- **D-14:** Section ID: `id="werkwijze"`.

### About + Stats (Sub-unit 4 — LND-04)

- **D-15:** Section contains **2 illustration images** faithful to Figma design (user provides both PNGs → `src/lib/assets/images/about-illustration-1.png`, `about-illustration-2.png`). These may be replaced with practitioner photos in a future phase — build faithful to current design.
- **D-16:** Stats (8+ / 65+ / ∞) sourced from **`BRAND` constants** in `src/lib/constants/brand.ts`. Add a `stats` object to `BRAND` in this sub-unit:
  ```ts
  stats: {
    yearsExperience: '8+',
    clientsHelped: '65+',
    satisfaction: '∞'
  }
  ```
- **D-17:** "Lees meer over mij →" links to `/over-mij` (Phase 0 stub; still valid link, Phase 2 fills content).
- **D-18:** Section ID: `id="over-mij"`.

### Behandelingen Service Selector / Carousel (Sub-unit 5 — LND-05)

- **D-19:** 5 cards as **`<a>` links in initial HTML** (SEO/AEO-safe, all links crawlable):
  - Mahatma Healing → `/diensten/mahatma-healing`
  - Goldhealing → `/diensten/goldhealing`
  - Raster Energie → `/diensten/raster-energie`
  - Spinal Touch → `/diensten/spinal-touch`
  - Meer diensten → `/diensten/`
- **D-20:** **JS circular carousel** (progressive enhancement). Partial outer cards visible on ALL screen sizes (left and right edges clipped to hint at scroll). User interaction only — no auto-rotate.
- **D-21:** CSS fallback (no-JS): `overflow-x: auto + scroll-snap-x mandatory`. Cards remain navigable without JS.
- **D-22:** Phase 1 = **basic carousel only**. User will add Osmo-style animation later when they have the code.
- **D-23:** Section ID: `id="behandelingen"`.

### Contact + Booking Toggle (Sub-unit 6 — LND-06)

- **D-24:** Radio toggle: "Email formulier" / "Online meeting". Progressive enhancement — JS powers the toggle.
- **D-25:** **No-JS behavior**: show email form only. Toggle button hidden (`display: none` via `<noscript>` or JS-added class). The description text that mentions "book an appointment / online meeting" is also hidden — only the email form description remains visible. This way no-JS users see a coherent, complete UI.
- **D-26:** Email form fields: Voornaam, Achternaam, Email, Telefoon (+31 prefix), Bericht textarea, "Verstuur email" submit button. Form `action` / `POST` endpoint wired in Phase 3.
- **D-27:** Cal.com panel: placeholder `<div id="cal-mount" aria-label="Agenda voor online afspraak">` — empty in Phase 1. Phase 3 mounts Cal.com inline embed here.
- **D-28:** Section ID: `id="contact"`.

### Inline FAQ (Sub-unit 7 — LND-07)

- **D-29:** FAQ content lives in **`src/lib/content/faq/index.ts`** as a typed TypeScript array:
  ```ts
  export interface FaqItem { question: string; answer: string }
  export const faqItems: FaqItem[] = [ ... ]
  ```
  Zod validation can be added later. Single source feeds both the rendered accordion and `FAQPage` JSON-LD (via `src/lib/schema/faq.ts`).
- **D-30:** Phase 1 ships with **placeholder Dutch Q&As** (8–12 items, answer-first, 50–150 words each). Planner drafts these; aunt provides final copy before Phase 4 legal gate.
- **D-31:** Rendering: **`<details>/<summary>` accordion**. Content always in DOM (open attribute controls expansion). Answer-first format in the summary label.
- **D-32:** Section sits directly below the Contact section, no eyebrow/heading decision locked — planner to infer from Figma context.

### Footer (Sub-unit 8 — LND-08)

- **D-33:** Footer pulls all NAP and brand data from `BRAND` constants. Never hand-edit copy in the Svelte component.
- **D-34:** Social icons: same standard icon library as header (Lucide/Heroicons). Show all icon slots from design. Null-platform icons link to `href="#"` until Phase 4 provides real URLs.
- **D-35:** KvK, BIG, phone, Instagram handle remain `TODO_*` placeholders in `BRAND` — CI warns, Phase 5 launch gate blocks on residuals.
- **D-36:** `SiteFooter.svelte` stub is replaced with full content in this sub-unit.

### Cross-Cutting Layout

- **D-37:** All sections use a **centered `max-width: var(--container-max)` container** with full-bleed section backgrounds. Pattern: `<section class="section-name"><div class="container"> ... </div></section>` where `.container { max-width: var(--container-max); margin-inline: auto; padding-inline: var(--space-6); }`.
- **D-38:** Section IDs match route slugs: `id="werkwijze"`, `id="over-mij"`, `id="behandelingen"`, `id="contact"`.
- **D-39:** Plain CSS locked — scoped Svelte `<style>` blocks per component. NO Tailwind, SCSS, CSS-in-JS.
- **D-40:** `SiteNav.svelte` and `SiteFooter.svelte` stubs are fully replaced in sub-units 2 and 8 respectively.

### Claude's Discretion

- Specific breakpoints for hero 2-column grid (768px or 1024px — planner to align with nav breakpoint for consistency).
- Internal scroll-snap alignment values (start vs center) for Behandelingen carousel.
- Svelte component file naming and sub-directory structure within `src/lib/components/`.
- Exact placeholder FAQ questions and answers (8–12 Dutch items, answer-first, 50–150 words).
- Whether `.container` utility class goes in `static/global.css` or each section scopes its own max-width.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-Level
- `.planning/PROJECT.md` — Core value (SEO/AEO first), stack decisions, NAP source-of-truth, constraints
- `.planning/REQUIREMENTS.md` — Full v1 requirements; LND-01–10, PRF-02–07, A11Y-01–04 govern this phase
- `seo-aeo-samenvatting-checklist.md` — Dutch SEO/AEO playbook; every implementation choice checked here

### Phase 0 Artifacts (foundation this phase builds on)
- `.planning/phases/00-foundation-seo-scaffolding/00-CONTEXT.md` — Locked stack, NAP, areaServed, slug decisions
- `src/lib/constants/brand.ts` — BRAND constants; NAP source of truth; add `stats` object here (D-16)
- `static/global.css` — All design tokens (colors, spacing, typography, motion, `--container-max`); DO NOT add global component styles here

### Schema / JSON-LD
- `src/lib/schema/faq.ts` — FAQPage emitter; Phase 1 feeds `faqItems` from `src/lib/content/faq/index.ts` into this
- `src/lib/schema/services.ts` — Service schema; already built from `BRAND.services`
- `src/lib/schema/buildGraph.ts` — Graph composer; landing page uses this for combined JSON-LD output

### Performance / SEO Constraints
- ROADMAP.md §Phase 1 Success Criteria — 5 criteria all PRs must satisfy (Lighthouse 100, AI-curl, hero preload, FAQ single-source, copy preservation)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/components/EnhancedImage.svelte` — Use for ALL raster images (hero, service cards, About illustrations). Enforces required `alt`, `width`, `height`. Produces `<picture>` with AVIF/WebP variants.
- `src/lib/components/JsonLd.svelte` — Wraps `<script type="application/ld+json">`. Use per-section where structured data is needed.
- `src/lib/components/Head.svelte` — Inject `<link rel="preload">` for hero image here.
- `src/lib/components/Breadcrumbs.svelte` — Not needed on landing page (`/`); no breadcrumb on homepage.
- `src/lib/schema/faq.ts` — Already exists; planner wires `faqItems` array from new content file.
- `src/lib/schema/services.ts` — Already exists; Behandelingen cards can reference service slugs from `BRAND.services`.
- `src/lib/constants/routes.ts` — Check for any pre-registered route constants before hardcoding strings.

### Established Patterns
- **Svelte 5 runes** — Use `$state()`, `$derived()`, `$effect()` for all reactivity. No Svelte 4 stores or `let` for reactive state.
- **Scoped CSS** — All component styles in `<style>` block. Global utilities only via `static/global.css` tokens.
- **Token-only styling** — Use CSS custom properties from `static/global.css`. Never hardcode colors, spacing, or type sizes.
- **`SiteNav.svelte` + `SiteFooter.svelte` stubs exist** — Both are in `src/lib/components/`. Replace in sub-units 2 and 8.

### Integration Points
- `src/routes/+layout.svelte` — `SiteNav` and `SiteFooter` mount here (or will after sub-units 2 and 8). Landing page `+page.svelte` adds section components.
- `src/routes/+page.svelte` — Landing page root; each sub-unit adds its section component here.
- `src/lib/content/faq/` — Currently empty (`.gitkeep` only). Sub-unit 7 creates `index.ts` here.
- `src/lib/constants/brand.ts` — Sub-unit 4 adds `stats` property to `BRAND` object.

</code_context>

<specifics>
## Specific Ideas

### User-Provided Assets (REQUIRED before Phase 1 execution)
Place all files before running any sub-unit plan:

| File | Destination |
|------|-------------|
| Hero illustration PNG | `src/lib/assets/images/hero.png` |
| Spinal Touch card image (woman's back) | `src/lib/assets/images/card-spinal-touch.png` |
| Goldhealing card image ("son") | `src/lib/assets/images/card-goldhealing.png` |
| About section illustration 1 | `src/lib/assets/images/about-illustration-1.png` |
| About section illustration 2 | `src/lib/assets/images/about-illustration-2.png` |
| Logo SVG (separate from favicon) | `src/lib/assets/logo.svg` |

### Osmo Animation Reference
User has a future Osmo-based animation for the Behandelingen carousel. Phase 1 ships basic circular JS carousel only. User will integrate the Osmo animation themselves when ready. Reference: https://www.osmo.supply/preview?resource=crisp-loading-animation (for orientation only — do not attempt to implement in Phase 1).

### Contact Section No-JS
When JS is unavailable: email form visible, toggle button hidden, "online meeting" copy hidden. Only email-specific description shown. This must be implemented via `<noscript>` CSS override or a JS-set body class, not a JS-dependent render path (SSG must render all content in initial HTML).

### Accordion One-At-A-Time (Werkwijze)
Native `<details>` allows multiple open simultaneously. One-at-a-time requires either: (a) JS `toggle` event listener that closes siblings, or (b) a `name` attribute on `<details>` (HTML spec "exclusive accordion" — browser support still emerging as of 2026; verify before using). Prefer JS event approach for broadest compatibility.

</specifics>

<deferred>
## Deferred Ideas

- **Practitioner photo in About section** — User wants to replace illustrations with real photos eventually. Deferred to a future v2 phase. Phase 1 is faithful to current Figma illustrations.
- **Osmo carousel animation** — User will add themselves post-Phase 1. Not in scope.
- **Nav items → real page routes** — Currently anchor links. Convert to real `<a href="/werkwijze">` etc. routes when Phase 2 content pages go live.
- **Social platform alternatives** — User unsure about Facebook/X. Deferred to Phase 4 copy gate.
- **Custom domain DNS** — Deferred post-launch per Phase 0 decision.

</deferred>

---

*Phase: 1-Landing-Sections*
*Context gathered: 2026-06-22*
