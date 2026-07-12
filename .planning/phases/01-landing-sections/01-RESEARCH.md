# Phase 1: Landing Sections — Research

**Researched:** 2026-06-22
**Domain:** Svelte 5 runes · interactive UI patterns · CSS carousel · accessibility · SEO/AEO enforcement
**Confidence:** HIGH (all findings verified against existing codebase + established patterns from Phase 0)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
All D-01–D-40 decisions are locked. Key ones:
- D-01: Hero PNG → EnhancedImage, AVIF/WebP at build. Asset: `src/lib/assets/images/hero.png`
- D-02: Mobile = image above content (column). Desktop (1024px+) = 2-column CSS grid
- D-03: LCP via `loading="eager" fetchpriority="high"` + `<link rel="preload">` in Head
- D-04: 3 hero service tiles as `<a>` tags (2 with EnhancedImage lazy, 1 text-only)
- D-05: Header `position:fixed`, smart-hide on scroll-down/up, always solid `--color-bg-sand`
- D-06: `<main>` gets `padding-top` = header height (measured at runtime via `clientHeight`)
- D-07: Hamburger breakpoint 1024px. Below = hamburger + full-screen overlay
- D-08: Overlay closes via X button AND Escape key (WCAG 2.2 AA non-negotiable)
- D-09: Logo is `<img src="/logo.svg">` — NOT EnhancedImage (SVG is not raster)
- D-10: Social icons from Lucide or Heroicons SVG; null platforms use `href="#"` for now
- D-11: Nav items are anchor links (`#werkwijze` etc.) on landing; real routes Phase 2+
- D-12: Werkwijze desktop = 3-column CSS grid. No accordion on desktop
- D-13: Werkwijze mobile = `<details>/<summary>`, one-at-a-time via JS toggle event. No `name` attribute (use JS, not native exclusive accordion)
- D-14: Section ID `id="werkwijze"`
- D-15: About has 2 illustration PNGs via EnhancedImage lazy
- D-16: Stats sourced from `BRAND.stats` (must be added to `brand.ts`)
- D-17: "Lees meer over mij →" → `/over-mij`
- D-18: Section ID `id="over-mij"`
- D-19: 5 Behandelingen cards as `<a>` links in initial HTML
- D-20: JS circular carousel, progressive enhancement, partial outer cards visible, no auto-rotate
- D-21: CSS fallback `overflow-x:auto + scroll-snap-x mandatory`
- D-22: Phase 1 = basic carousel only. Osmo animation deferred
- D-23: Section ID `id="behandelingen"`
- D-24: Radio toggle "Email formulier" / "Online meeting", progressive enhancement
- D-25: No-JS = email form only. Toggle hidden via `js-enabled` body class
- D-26: 6 form fields + AVG consent + disclaimer. `action` wired Phase 3
- D-27: Cal.com panel = `<div id="cal-mount">` placeholder only in Phase 1
- D-28: Section ID `id="contact"`
- D-29: FAQ content in `src/lib/content/faq/index.ts` as `FaqItem[]` typed array
- D-30: Phase 1 ships 8–12 placeholder Dutch Q&As (answer-first, 50–150 words)
- D-31: FAQ renders `<details>/<summary>`, multiple-open allowed (unlike Werkwijze)
- D-32: FAQ section heading = "Veelgestelde vragen" (inferred); no anchor ID required
- D-33: Footer pulls all NAP from `BRAND` constants. Never hand-edit copy in .svelte
- D-34: Social icons = same Lucide/Heroicons as header
- D-35: KvK, BIG, phone, Instagram = `TODO_*` placeholders in BRAND
- D-36: `SiteFooter.svelte` stub fully replaced in sub-unit 8
- D-37: All sections use `.container { max-width: var(--container-max); margin-inline: auto; padding-inline: var(--space-6); }`
- D-38: Section IDs = `werkwijze`, `over-mij`, `behandelingen`, `contact`
- D-39: Plain CSS in scoped `<style>` blocks. NO Tailwind / SCSS / CSS-in-JS
- D-40: `SiteNav.svelte` and `SiteFooter.svelte` stubs fully replaced in sub-units 2 and 8

### Claude's Discretion
- Specific breakpoints for hero 2-column grid (resolved in UI-SPEC: 1024px, aligns with nav)
- Scroll-snap alignment values (resolved in UI-SPEC: `scroll-snap-align: center` for carousel peek)
- Svelte component file naming and sub-directory structure within `src/lib/components/`
- Exact placeholder FAQ questions (8–12 Dutch items, answer-first, 50–150 words)
- Whether `.container` utility class goes in `static/global.css` or each section scopes its own

### Deferred Ideas (OUT OF SCOPE)
- Practitioner photo in About section — v2
- Osmo carousel animation — user adds post-Phase 1
- Nav items → real page routes — Phase 2+
- Social platform alternatives — Phase 4 copy gate
- Custom domain DNS — post-launch
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LND-01 | Hero section — H1, body, CTA, EnhancedImage LCP, 3 service tiles | EnhancedImage usage, preload injection in Head.svelte, anchor CTA |
| LND-02 | Header + mobile menu overlay — fixed, smart-hide, hamburger, full-screen overlay | Svelte 5 `onMount` scroll listener, focus management, ARIA dialog |
| LND-03 | Werkwijze 3-card / `<details>` accordion — one-at-a-time mobile | `<details>` toggle event pattern, JS sibling close, SSR content visibility |
| LND-04 | About + stats — illustrations, bullets, stats from BRAND.stats | `BRAND.stats` property addition, EnhancedImage lazy |
| LND-05 | Behandelingen carousel — 5 `<a>` cards, JS circular, CSS fallback | Scroll-snap CSS pattern, `onMount` carousel JS, no-JS fallback |
| LND-06 | Contact + booking toggle — radio toggle, form, Cal.com placeholder | Radio toggle progressive enhancement, `js-enabled` class, AVG consent |
| LND-07 | Inline FAQ — `<details>` accordion, single source for FAQPage JSON-LD | `faqItems` array → `buildFaqPage()` wiring, `buildGraph()` integration |
| LND-08 | Footer — NAP from BRAND, columns, social, copyright | BRAND constants pattern, social icon aria-labels, `SiteFooter.svelte` replacement |
| LND-09 | Copy verbatim from Figma — no rewrites without approval | grep-based copy preservation CI gate (new script needed) |
| LND-10 | Two-sentence pattern for new copy (FAQ, glossary) | hedge-language scan in grep-placeholders.sh (extend) |
| PRF-02 | Hero preload `<link rel="preload" as="image" fetchpriority="high">` | Head.svelte `<svelte:head>` injection pattern established |
| PRF-03 | All non-hero images lazy-loaded | EnhancedImage default `loading="lazy"` — already enforced |
| PRF-04 | LCP < 2.5s on landing page | Lighthouse CI gate already wired; hero eager+preload is the implementation |
| PRF-05 | INP < 200ms | No runtime CSS-in-JS; plain CSS; Svelte event handlers are synchronous |
| PRF-06 | CLS < 0.1 | EnhancedImage requires explicit `width`/`height`; font metric override TODO noted |
| PRF-07 | Cal.com loads zero JS until toggle activated | Phase 1: empty `<div id="cal-mount">` placeholder only; Phase 3 wires embed |
| A11Y-01 | WCAG 2.2 AA — focus states, contrast, keyboard nav, ARIA | Focus trap pattern, `role="dialog" aria-modal="true"`, Escape key |
| A11Y-02 | All form inputs have programmatic labels; radio group keyboard-navigable | `<label for>` pattern, `role="radiogroup"` |
| A11Y-03 | Tap targets minimum 44×44 px mobile | `min-height: 44px` or sufficient padding on all interactive elements |
| A11Y-04 | Screen-reader walkthrough passes — no orphan headings, all images alt-tagged | One H1, H2 per section, H3 for cards; EnhancedImage requires `alt` |
</phase_requirements>

---

## Summary

Phase 1 builds the full Dutch landing page in 8 sub-units. The codebase from Phase 0 provides solid primitives: `EnhancedImage`, `JsonLd`, `Head`, `buildGraph`, `buildFaqPage`, and the CI gates (Lighthouse, pa11y, HTML audit, JSON-LD audit) are all wired and green. Phase 1 is a content-and-component build — no new npm packages are needed, and no primitives need architectural change.

The 8 sub-units vary in interaction complexity. Sub-units 1 (Hero), 3 (Werkwijze), 4 (About), 7 (FAQ), and 8 (Footer) are largely static HTML+CSS. Sub-units 2 (Header/nav), 5 (Carousel), and 6 (Contact toggle) require progressive-enhancement JavaScript using Svelte 5 `onMount`. The JS patterns are well-established in Svelte 5 and carry no significant research risk.

The most critical correctness constraint is that ALL content must appear in initial SSR HTML. This is automatically satisfied for static sections. For interactive sections (accordion, carousel, toggle), the initial render must include all content; JS only adds behavior on top. The `<details>/<summary>` elements are ideal: browsers render them server-side with all content in the DOM regardless of `open` attribute state. The carousel must render all 5 `<a>` links in initial HTML — JS only manages which cards are visible.

**Primary recommendation:** Build sub-units in Figma frame order (1→8). Sub-units 1, 3, 4, 7, 8 can be started in parallel (no shared state). Sub-units 2 and 8 (SiteNav + SiteFooter replacements) must merge before any sub-unit that depends on the layout shell. Sub-unit 6 (Contact) depends on no other sub-unit but must land before sub-unit 7 (FAQ) per DOM order on the page.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hero image (LCP element) | Frontend Server (SSR/SSG) | — | Must be in initial HTML; `loading="eager"` + preload only meaningful if server-rendered |
| Nav / header | Frontend Server (SSR/SSG) | Browser (scroll listener) | HTML in initial render; JS smart-hide added on mount |
| Mobile overlay | Browser | — | Show/hide is pure client interaction; but HTML must be in initial render |
| Accordion (Werkwijze/FAQ) | Frontend Server (SSR/SSG) | Browser (toggle events) | `<details>` content in DOM always; JS only closes siblings / manages state |
| Carousel | Frontend Server (SSR/SSG) | Browser (prev/next, circular wrap) | All 5 `<a>` links in initial HTML; JS adds visual carousel behavior |
| Contact toggle | Frontend Server (SSR/SSG) | Browser (`js-enabled` class) | Email form in initial HTML; toggle visibility via JS-added class |
| Cal.com mount point | Frontend Server (SSR/SSG) | Phase 3 (Browser, lazy) | Empty `<div>` placeholder in Phase 1; Phase 3 mounts embed on toggle |
| FAQPage JSON-LD | Frontend Server (SSR/SSG) | — | `buildGraph()` → `JsonLd` component → `<svelte:head>` → initial HTML |
| Footer NAP | Frontend Server (SSR/SSG) | — | Static content from BRAND constants |
| Copy preservation gate | CI | — | grep script run in `build-and-audit` job |

---

## Standard Stack

No new packages are needed for Phase 1. All required tools are already installed.

### Core (all from Phase 0 — already installed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `svelte` | 5.x | Runes-based reactivity | Installed |
| `@sveltejs/kit` | 2.x | SSR/SSG framework, routing | Installed |
| `@sveltejs/enhanced-img` | latest | Build-time AVIF/WebP image optimization | Installed |
| `schema-dts` | 1.1+ | TypeScript types for JSON-LD | Installed |
| `typescript` | 5.5+ | Strict type checking | Installed |
| `vitest` | 4.x | Unit testing | Installed |
| `@playwright/test` | 1.x | Integration/HTML audit tests | Installed |

### New Content Artifacts (to create, not install)

| File | Type | Purpose |
|------|------|---------|
| `src/lib/content/faq/index.ts` | TypeScript | `FaqItem[]` source — feeds both FAQ accordion and FAQPage JSON-LD |
| `src/lib/assets/images/hero.png` | Asset (user-provided) | LCP element |
| `src/lib/assets/images/card-spinal-touch.png` | Asset (user-provided) | Hero service tile |
| `src/lib/assets/images/card-goldhealing.png` | Asset (user-provided) | Hero service tile |
| `src/lib/assets/images/about-illustration-1.png` | Asset (user-provided) | About section |
| `src/lib/assets/images/about-illustration-2.png` | Asset (user-provided) | About section |
| `src/lib/assets/logo.svg` | Asset (user-provided) | Site logo in header + footer |

### Alternatives Considered

None — the stack is locked. The only discretionary choice is Lucide vs Heroicons for social icons (D-10, D-34); either is fine as they are inline SVG imports, not runtime dependencies.

---

## Package Legitimacy Audit

No new npm packages are installed in Phase 1. Skipping audit — all packages were verified in Phase 0.

---

## Architecture Patterns

### System Architecture Diagram

```
User Request (OAI-SearchBot / browser)
        |
        v
SvelteKit SSG (prerendered)
        |
        v
+layout.svelte
  ├── Head.svelte (svelte:head: title, meta, canonical, hreflang, OG, Twitter, hero preload link)
  ├── JsonLd.svelte (svelte:head: single @graph = shared nodes + FAQPage + WebPage)
  ├── SiteNav.svelte (position:fixed; content in DOM; JS adds scroll-hide behavior)
  ├── <main>
  │     └── +page.svelte
  │           ├── HeroSection (H1, body, CTA, EnhancedImage eager, 3 service tile <a>s)
  │           ├── WerkwijzeSection (3 cards: CSS grid desktop / <details> accordion mobile)
  │           ├── AboutSection (heading, bullets, BRAND.stats, 2 EnhancedImage lazy)
  │           ├── BehandelingenSection (5 <a> cards in HTML; JS carousel on top)
  │           ├── ContactSection (radio toggle; email form; cal-mount placeholder)
  │           └── FaqSection (<details>/<summary>; all answers in DOM)
  └── SiteFooter.svelte (NAP from BRAND, social icons, 3 columns, copyright)

buildGraph() call in +page.ts:
  shared nodes (Org, ProfService, Person, WebSite, 4x Service)
  + FAQPage (from faqItems)
  + WebPage (dateModified = __BUILD_DATE__)
  = 10 nodes in @graph
```

### Recommended Project Structure

```
src/
├── lib/
│   ├── assets/
│   │   ├── images/           # All raster images (user-provided PNGs)
│   │   └── logo.svg          # User-provided logo
│   ├── components/
│   │   ├── EnhancedImage.svelte   # Existing — use for all rasters
│   │   ├── Head.svelte            # Existing — inject hero preload here
│   │   ├── JsonLd.svelte          # Existing — single mount point
│   │   ├── SiteNav.svelte         # REPLACE stub in sub-unit 2
│   │   ├── SiteFooter.svelte      # REPLACE stub in sub-unit 8
│   │   ├── HeroSection.svelte     # NEW sub-unit 1
│   │   ├── WerkwijzeSection.svelte # NEW sub-unit 3
│   │   ├── AboutSection.svelte    # NEW sub-unit 4
│   │   ├── BehandelingenSection.svelte # NEW sub-unit 5
│   │   ├── ContactSection.svelte  # NEW sub-unit 6
│   │   └── FaqSection.svelte      # NEW sub-unit 7
│   ├── constants/
│   │   ├── brand.ts          # ADD: BRAND.stats property
│   │   └── routes.ts         # Existing — read for footer link columns
│   ├── content/
│   │   └── faq/
│   │       └── index.ts      # NEW: FaqItem[] typed array
│   └── schema/
│       ├── buildGraph.ts     # Existing — add FAQPage to landing +page.ts
│       └── faq.ts            # Existing — buildFaqPage() ready to consume faqItems
└── routes/
    └── +page.svelte          # REPLACE placeholder body with section components
```

### Pattern 1: Svelte 5 onMount scroll listener (smart-hide header)

**What:** Measures header height at mount, sets `padding-top` on `<main>`, registers a scroll listener, applies `translateY(-100%)` when scrolling down.
**When to use:** SiteNav only.

```typescript
// Source: [ASSUMED] — Svelte 5 onMount pattern; confirmed by existing codebase use
import { onMount } from 'svelte';

let headerEl: HTMLElement;
let isHidden = $state(false);
let lastScrollY = $state(0);
const THRESHOLD = 8; // px — D-05

onMount(() => {
  // Set main padding-top to header height (D-06)
  const main = document.querySelector('main') as HTMLElement;
  if (main) main.style.paddingTop = `${headerEl.clientHeight}px`;

  const handleScroll = () => {
    const current = window.scrollY;
    if (current > lastScrollY + THRESHOLD) {
      isHidden = true;
    } else if (current < lastScrollY - THRESHOLD) {
      isHidden = false;
    }
    lastScrollY = current;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
});
```

CSS (scoped in SiteNav.svelte):
```css
header {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  background: var(--color-bg-sand);
  transform: translateY(0);
  transition: transform var(--motion-base) var(--ease-out);
}
header.hidden {
  transform: translateY(-100%);
}
```

### Pattern 2: `<details>/<summary>` accordion one-at-a-time (Werkwijze)

**What:** Native HTML `<details>` elements, JS `toggle` event listener closes sibling details when one opens.
**When to use:** WerkwijzeSection mobile only. NOT for FAQ (FAQ allows multiple open).
**Why JS not `name` attribute:** Browser support for `name`-based exclusive accordion is still inconsistent as of 2026 (D-13).

```typescript
// Source: [ASSUMED] — standard `<details>` toggle pattern
// Run in onMount to avoid SSR reference errors
import { onMount } from 'svelte';

let sectionEl: HTMLElement;

onMount(() => {
  const allDetails = Array.from(sectionEl.querySelectorAll('details'));
  allDetails.forEach((detail) => {
    detail.addEventListener('toggle', () => {
      if (detail.open) {
        allDetails.forEach((other) => {
          if (other !== detail && other.open) other.open = false;
        });
      }
    });
  });
});
```

**SSR safety:** The `<details>` content is always in the DOM. The `open` attribute just controls visibility via browser UA stylesheet. AI crawlers see all content regardless.

### Pattern 3: CSS scroll-snap carousel + JS circular enhancement

**What:** CSS fallback with `overflow-x:auto` + `scroll-snap-type:x mandatory`. JS adds circular behavior and prev/next buttons.
**When to use:** BehandelingenSection.

CSS (scoped):
```css
/* No-JS fallback — D-21 */
.carousel-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: var(--space-6);
  padding-inline: var(--space-6);
  /* Hide scrollbar but keep scrollability */
  scrollbar-width: none;
}
.carousel-track::-webkit-scrollbar { display: none; }
.carousel-card {
  flex-shrink: 0;
  min-width: 280px;
  max-width: 320px;
  scroll-snap-align: center; /* D-UI-SPEC */
}
```

JS circular pattern (in `onMount`):
```typescript
// Source: [ASSUMED] — standard scroll carousel pattern
// Prev/Next buttons injected by JS, hidden when JS absent
// Circular: on next at last card, scrollTo card[0]; on prev at card[0], scrollTo last
let currentIndex = $state(0);
const CARD_COUNT = 5;

function goTo(idx: number) {
  currentIndex = ((idx % CARD_COUNT) + CARD_COUNT) % CARD_COUNT; // wrap
  cards[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}
```

**SSR:** All 5 `<a>` elements are in initial HTML. Carousel JS is `onMount`-only.

### Pattern 4: Progressive-enhancement contact toggle

**What:** Email form is always rendered in initial HTML. Toggle visibility is controlled by a `js-enabled` class added to `<body>` in `onMount`. No-JS users see email form only (D-25).

```typescript
// Source: [ASSUMED] — body class progressive enhancement
import { onMount } from 'svelte';
import { browser } from '$app/environment';

onMount(() => {
  document.body.classList.add('js-enabled');
});
```

CSS:
```css
/* In ContactSection.svelte — toggle group hidden unless js-enabled */
:global(body:not(.js-enabled)) .toggle-group { display: none; }
:global(body:not(.js-enabled)) .online-desc { display: none; }
```

**Note:** Using `:global()` in a scoped Svelte `<style>` block is acceptable for this specific progressive-enhancement pattern because the selector targets `body` — a truly global element. Keep the scope narrow.

### Pattern 5: Mobile overlay focus management

**What:** When overlay opens, focus moves to X close button. When overlay closes, focus returns to hamburger button. Escape key closes overlay.

```typescript
// Source: [ASSUMED] — WCAG 2.2 AA focus management pattern
let overlayOpen = $state(false);
let hamburgerEl: HTMLButtonElement;
let closeButtonEl: HTMLButtonElement;

function openOverlay() {
  overlayOpen = true;
  // Wait one tick for DOM to render
  setTimeout(() => closeButtonEl?.focus(), 0);
}

function closeOverlay() {
  overlayOpen = false;
  hamburgerEl?.focus();
}

// Escape key handler (D-08, A11Y-01)
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && overlayOpen) closeOverlay();
}
```

Template:
```svelte
<div role="dialog" aria-modal="true" aria-label="Navigatiemenu" 
     class:hidden={!overlayOpen}
     onkeydown={handleKeydown}>
  <button bind:this={closeButtonEl} aria-label="Menu sluiten" onclick={closeOverlay}>
    <!-- X icon -->
  </button>
  <!-- nav links -->
</div>
```

**Focus trap:** Full focus trap (cycling Tab within overlay) is WCAG 2.2 AA best practice. Implementation: `keydown` on overlay listening for Tab, wrapping focus between first and last focusable elements. This is additive to the Escape handler.

### Pattern 6: FAQ wiring (single source)

**What:** `faqItems` array in `src/lib/content/faq/index.ts` flows to both the rendered accordion AND `buildFaqPage()` → `buildGraph()` → `JsonLd`.

```typescript
// src/lib/content/faq/index.ts (to be created — D-29)
export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "Wat is ademwerk en hoe werkt het?",
    answer: "Ademwerk is een bewezen techniek waarbij bewuste ademhaling spanning en stress in het lichaam helpt loslaten. ..."
  },
  // 7-11 more items
];
```

In `+page.ts` (update existing load function):
```typescript
// Add to existing load() in src/routes/+page.ts
import { faqItems } from '$lib/content/faq/index';
import { buildFaqPage } from '$lib/schema/faq';

// In buildGraph pageSpecific array:
buildGraph({
  pageSpecific: [
    buildWebPage({ ... }),
    buildFaqPage(faqItems)    // ← add this
  ],
  path: '/'
})
```

`FaqSection.svelte` receives `faqItems` as a prop, renders the `<details>/<summary>` accordion.

### Pattern 7: Hero preload injection in Head.svelte

Head.svelte currently accepts `meta: PageMeta`. To inject the hero preload, one of two approaches:

**Option A (recommended):** Add a `heroPreload` optional prop to `Head.svelte`:
```svelte
<!-- Head.svelte gets new optional prop -->
let { meta, heroPreload }: { meta: PageMeta; heroPreload?: string } = $props();
```
```svelte
{#if heroPreload}
  <link rel="preload" as="image" fetchpriority="high" href={heroPreload} />
{/if}
```
Landing `+layout.svelte` or `+page.svelte` passes the path. This is type-safe and contained.

**Option B:** Use `<svelte:head>` directly in `HeroSection.svelte` — simpler but less centralized.

Since the layout already imports `Head.svelte`, Option A keeps preload logic near the other head tags. Either is valid per D-39; the planner should pick one and be consistent.

### Anti-Patterns to Avoid

- **Rendering carousel cards only for the "visible" position:** All 5 `<a>` elements must be in the initial HTML. JS may hide/style them, but must not `display:none` remove them from the accessibility tree or crawler view.
- **Using `{#if overlayOpen}` to mount/unmount the mobile overlay:** Unmounting removes content from initial HTML. Use CSS visibility/opacity toggling instead (`class:hidden`) — the overlay HTML must be in the initial server-rendered output.
- **Putting `$state` / `$effect` at module scope in a Svelte component:** In Svelte 5, `$state` and `$effect` are component-scoped. They only work inside `.svelte` component files or `.svelte.ts` files.
- **Using `window` or `document` outside `onMount` / `browser` guard:** SSR will throw. All DOM access must be behind `onMount` or `if (browser)` from `$app/environment`.
- **Adding component-level styles to `static/global.css`:** FND-02 violation. CI gate `no-shared-css.sh` will fail.
- **Hardcoding hex colors or pixel values in `<style>` blocks:** `check-tokens.sh` CI gate will fail.
- **Multiple `<h1>` elements:** SEO-11 CI gate (check-html.ts) fails the build.
- **`loading="eager"` on any below-fold image:** Only hero uses eager. Everything else defaults to `loading="lazy"` via EnhancedImage defaults.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization (AVIF/WebP) | Manual Sharp pipeline | `EnhancedImage` wrapping `<enhanced:img>` | Already built; enforces required `alt`/`width`/`height` |
| JSON-LD emission | Inline `<script>` string | `JsonLd.svelte` with `buildGraph()` | Already built; escapes `</script>`, typed via schema-dts |
| FAQPage schema | Hand-rolled JSON | `buildFaqPage(faqItems)` | Already built in `src/lib/schema/faq.ts`; tests pass |
| Per-page `<head>` meta | Direct `<svelte:head>` calls | `Head.svelte` accepting `PageMeta` | Already built; enforces canonical + hreflang + OG |
| Social icon SVGs | Custom SVG files | Lucide or Heroicons (inline) | No custom icon files needed; standard library |
| CSS design tokens | Inline pixel values | `static/global.css` CSS variables | Enforced by `check-tokens.sh` CI gate |

---

## Runtime State Inventory

Not applicable — this is a greenfield content-build phase. No renames, refactors, or data migrations.

---

## Common Pitfalls

### Pitfall 1: Build fails — missing image assets
**What goes wrong:** `@sveltejs/enhanced-img` (via `<enhanced:img>`) fails the Vite build if the source image file does not exist. Wave 0 of Phase 1 cannot build until all 6 user-provided assets are placed.
**Why it happens:** The `?enhanced` import is resolved at build time; missing file = module not found error.
**How to avoid:** Create a `Wave 0: Asset Placeholder` task that either (a) places real user-provided assets, or (b) creates temporary 1×1 PNG stubs at the correct paths. Real assets replace stubs before any PR merges.
**Warning signs:** `Error: Could not find module` pointing to `src/lib/assets/images/hero.png` or similar.

### Pitfall 2: Mobile overlay content absent from initial HTML
**What goes wrong:** If overlay is conditionally rendered with `{#if overlayOpen}`, SSR outputs the HTML with `overlayOpen = false`, meaning overlay HTML is absent from initial server-rendered output. AI crawlers never see nav links inside the overlay.
**Why it happens:** `{#if}` in Svelte 5 SSR produces no HTML when condition is false.
**How to avoid:** Always render the overlay HTML in the DOM. Control visibility via CSS (`class:hidden` + `display:none`, or `visibility:hidden`/`opacity:0`). Nav links are in initial HTML regardless of overlay state.
**Warning signs:** `curl -A "OAI-SearchBot"` output missing nav links.

### Pitfall 3: Carousel `<a>` links hidden by JS
**What goes wrong:** Carousel JS applies `display:none` to "off-screen" cards, removing them from the accessibility tree and crawler visibility.
**Why it happens:** Common carousel implementation hides non-visible slides for layout purposes.
**How to avoid:** Use `visibility:hidden` or `opacity:0` + `pointer-events:none` to hide off-screen cards visually while keeping them in the DOM and accessible. Or rely on `overflow:hidden` on the track to clip them visually.
**Warning signs:** `curl` output only shows 1-2 card links instead of all 5.

### Pitfall 4: `window`/`document` access during SSR
**What goes wrong:** Code accessing `window.scrollY`, `document.querySelector`, etc. runs during server-side prerender → throws `ReferenceError: window is not defined`.
**Why it happens:** SvelteKit prerenders all pages server-side. `window` and `document` do not exist in Node.js.
**How to avoid:** Wrap all DOM access in `onMount()` callbacks (D-05 scroll listener, D-20 carousel JS, D-24 toggle class). Use `import { browser } from '$app/environment'` for conditional checks.
**Warning signs:** Build or prerender fails with `ReferenceError`.

### Pitfall 5: Multiple `<h1>` elements
**What goes wrong:** The Phase 0 `+page.svelte` currently renders `<PageTitle>` which wraps an `<h1>`. Phase 1 HeroSection must replace the Phase 0 placeholder entirely, not add a second heading.
**Why it happens:** Developer adds H1 in HeroSection without removing the Phase 0 `<PageTitle>` usage.
**How to avoid:** In sub-unit 1, fully replace the `+page.svelte` placeholder body. Keep exactly one `<h1>`: the hero H1 "Rust in je hoofd. Ontspanning in je lichaam." The `<PageTitle>` component should remain but wrapped around the hero H1 text — or HeroSection internally handles the H1 without PageTitle. Confirm with check-html.ts CI gate.
**Warning signs:** CI gate `HTML audit` step fails on "multiple H1" assertion.

### Pitfall 6: SEO-09 `<time datetime>` recency block removed
**What goes wrong:** The current `+page.svelte` has a `<p class="page-meta"><time datetime={...}>` block (SEO-09). Phase 1 replaces the page body. If the recency block is dropped, the HTML audit CI gate fails.
**Why it happens:** Developer replaces the full stub body without preserving the `<time>` element.
**How to avoid:** The recency block MUST survive Phase 1 edits (noted in `+page.svelte` comment). Move it into HeroSection or keep it in `+page.svelte` alongside the section components. Preferred: move it to the bottom of `+page.svelte` wrapping the section list — not inside any single section — so it persists across all Phase 1 sub-unit PRs.
**Warning signs:** `HTML audit` CI fails on `<time datetime>` assertion.

### Pitfall 7: `$state` / `$effect` used in `.ts` files (not `.svelte.ts`)
**What goes wrong:** Svelte 5 runes (`$state`, `$effect`, `$derived`) only work inside `.svelte` files or files with the `.svelte.ts` extension. Using them in plain `.ts` files causes compile errors.
**Why it happens:** Developer tries to share stateful logic in a utility file.
**How to avoid:** All reactive state for interactive components (scroll hide, overlay open, carousel index, toggle state) lives in the `.svelte` component files directly. The `FaqItem` array in `src/lib/content/faq/index.ts` is a plain TypeScript module — no runes needed.
**Warning signs:** `svelte-check` or `npm run check` fails with "runes can only be used inside Svelte components".

### Pitfall 8: `$app/environment` `browser` import used in layout for head preload
**What goes wrong:** Attempting to check `if (browser)` before rendering a `<link rel="preload">` in `<svelte:head>` will suppress the preload for SSR output — which is the only place it matters for LCP.
**Why it happens:** Misunderstanding that `<svelte:head>` is rendered on the server for initial HTML.
**How to avoid:** Preload links in `<svelte:head>` do NOT need `browser` guards — they are rendered by SSR and land in initial HTML. Only DOM manipulation code (scroll listeners, class additions) needs `onMount`/`browser` guards.

### Pitfall 9: CSS `check-tokens.sh` failure from hardcoded values in new components
**What goes wrong:** New component `<style>` blocks use hex colors or pixel values (e.g., `color: #3D4A35` or `padding: 24px`).
**Why it happens:** Developer writes component styles without consulting `static/global.css` token list.
**How to avoid:** Always use `var(--color-fg-forest)` not `#3D4A35`. Always use `var(--space-6)` not `24px`. Token reference is in `static/global.css` and `01-UI-SPEC.md`.
**Warning signs:** `check-tokens.sh` step fails in CI with grep matches.

### Pitfall 10: `enhanced:img` used for SVG (logo)
**What goes wrong:** `@sveltejs/enhanced-img` is for raster images only. Using it for `logo.svg` will error or produce incorrect output.
**Why it happens:** Developer applies `EnhancedImage` to all image assets indiscriminately.
**How to avoid:** Per D-09: logo is `<img src="/logo.svg">` — a plain `<img>` tag with the SVG served directly. Do not use `EnhancedImage` or `<enhanced:img>` for SVGs. Place `logo.svg` in the `static/` directory (served at `/logo.svg`) rather than `src/lib/assets/` (which requires `?enhanced` import).

---

## Code Examples

### Hero section structure

```svelte
<!-- src/lib/components/HeroSection.svelte -->
<script lang="ts">
  import EnhancedImage from '$lib/components/EnhancedImage.svelte';
  import HeroImg from '$lib/assets/images/hero.png?enhanced';
  import SpinalTouchImg from '$lib/assets/images/card-spinal-touch.png?enhanced';
  import GoldHealingImg from '$lib/assets/images/card-goldhealing.png?enhanced';
</script>

<section class="hero">
  <div class="container">
    <div class="hero-grid">
      <div class="hero-content">
        <h1>Rust in je hoofd. Ontspanning in je lichaam.</h1>
        <p><!-- Figma body copy verbatim --></p>
        <a href="#contact" class="btn-cta">Maak een afspraak</a>
      </div>
      <div class="hero-image">
        <EnhancedImage
          src={HeroImg}
          alt="Trinity Breath & Healing — boom bij rivier illustratie"
          width={600}
          height={700}
          loading="eager"
          fetchpriority="high"
        />
      </div>
    </div>
    <!-- Service tiles -->
    <div class="service-tiles">
      <a href="/diensten/spinal-touch" class="tile">
        <EnhancedImage src={SpinalTouchImg} alt="Spinal Touch behandeling" width={280} height={160} />
        <span>Spinal Touch</span>
      </a>
      <a href="/diensten/goldhealing" class="tile">
        <EnhancedImage src={GoldHealingImg} alt="Goldhealing behandeling" width={280} height={160} />
        <span>Goldhealing</span>
      </a>
      <a href="/diensten/" class="tile tile--text-only">
        <span>Meer klachten</span>
      </a>
    </div>
  </div>
</section>
```

### BRAND.stats addition (sub-unit 4)

```typescript
// src/lib/constants/brand.ts — add to BRAND object (D-16)
stats: {
  yearsExperience: '8+',
  clientsHelped: '65+',
  satisfaction: '∞'
} as const
```

### FAQ content file (sub-unit 7 — to create)

```typescript
// src/lib/content/faq/index.ts (D-29)
export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "Wat is ademwerk en hoe werkt het?",
    answer: "Ademwerk is een vorm van bewuste begeleide ademhaling die spanning en stress in het lichaam helpt loslaten. ..."
  }
  // 7–11 more items
];
```

### `+page.ts` update for FAQ JSON-LD (sub-unit 7)

```typescript
// src/routes/+page.ts — extend existing load()
import { faqItems } from '$lib/content/faq/index';
import { buildFaqPage } from '$lib/schema/faq';

export const load: PageLoad = async () => ({
  meta: { ...defaults, dateModified: __BUILD_DATE__ },
  graph: buildGraph({
    pageSpecific: [
      buildWebPage({ title: defaults.title, description: defaults.description, path: '/', dateModified: __BUILD_DATE__ }),
      buildFaqPage(faqItems)
    ],
    path: '/'
  })
});
```

### Copy-preservation CI gate (LND-09/10) — new script

```bash
#!/usr/bin/env bash
# scripts/check-copy.sh — LND-09/10: verify locked Figma copy is present in built HTML
# Run after: npm run build
# Fails CI if any locked string is absent from .svelte-kit/output/prerendered/pages/index.html

set -euo pipefail

HTML_FILE=".svelte-kit/output/prerendered/pages/index.html"

if [[ ! -f "$HTML_FILE" ]]; then
  echo "ERROR: $HTML_FILE not found. Run npm run build first."
  exit 1
fi

LOCKED_STRINGS=(
  "Rust in je hoofd. Ontspanning in je lichaam."
  "Rustig, persoonlijk en op jouw tempo."
  "Vanuit eigen ervaring weet ik wat jij doormaakt."
  "Een eerste stap hoeft niet groot te zijn."
  "Maak een afspraak"
  "Verstuur email"
)

EXIT=0
for str in "${LOCKED_STRINGS[@]}"; do
  if ! grep -qF "$str" "$HTML_FILE"; then
    echo "FAIL: locked copy missing from HTML: \"$str\""
    EXIT=1
  fi
done

if [[ $EXIT -eq 0 ]]; then
  echo "PASS: all locked copy strings present in rendered HTML."
fi
exit $EXIT
```

Add to `ci.yml` after the HTML audit step:
```yaml
- name: Copy preservation gate — locked Figma copy in rendered HTML (LND-09)
  run: bash scripts/check-copy.sh
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Svelte 4 `let` + `$:` reactive | Svelte 5 `$state()`, `$derived()`, `$effect()` | Svelte 5 (project inception) | All Phase 1 interactive state uses runes |
| `<script context="module">` | `<script lang="ts">` module-level const | Svelte 5 | `context="module"` deprecated; use regular module exports |
| `$app/stores` `page` store | `import { page } from '$app/state'` | SvelteKit 2 / Svelte 5 | Already used in `+layout.svelte` |
| Separate store files for UI state | Component-local `$state` | Svelte 5 runes | Scroll state, overlay state, carousel index all live in their component |
| `createEventDispatcher` | `$props` callback props (`onclick`, `onclose`, etc.) | Svelte 5 | No custom events needed in Phase 1 components |

**Deprecated/outdated:**
- `<script context="module">` in `.svelte` files: deprecated in Svelte 5. Use `<script lang="ts" module>` instead (or separate `.ts` module). The mdsvex warning in tests refers to this.
- `$app/stores` (Svelte 4): replaced by `$app/state` (Svelte 5). `+layout.svelte` already uses the new import.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `onMount` scroll listener with `{ passive: true }` is the correct Svelte 5 pattern for smart-hide header | Architecture Patterns #1 | Low risk — onMount is the documented way; passive scroll is well-established |
| A2 | `<details>` `toggle` event fires reliably across all target browsers for sibling-close pattern | Architecture Patterns #2 | Low risk — `toggle` event on `<details>` is widely supported since 2020 |
| A3 | `scrollIntoView` with `{ inline: 'center' }` is sufficient for carousel circular navigation | Architecture Patterns #3 | Medium risk — some browsers have inconsistent `inline` behavior; may need fallback to manual `scrollLeft` calculation |
| A4 | Adding `js-enabled` class to `document.body` in `onMount` is the correct pattern for contact toggle progressive enhancement | Architecture Patterns #4 | Low risk — established pattern; alternative is `<noscript>` CSS which is less maintainable |
| A5 | `:global(body:not(.js-enabled)) .selector` syntax is valid in Svelte scoped `<style>` blocks | Architecture Patterns #4 | Low risk — Svelte allows `:global()` in scoped styles; confirmed by Svelte docs pattern |
| A6 | The `name` attribute for `<details>` exclusive accordion has incomplete cross-browser support as of 2026 | Common Pitfalls #2 / D-13 | Medium risk — if support is now broad, JS approach is unnecessary complexity, but it still works correctly |
| A7 | `logo.svg` should be placed in `static/` directory (served at `/logo.svg`) rather than `src/lib/assets/` | Architecture Patterns / Anti-Patterns | Low risk — `static/` is the standard SvelteKit location for public static assets |

---

## Open Questions

1. **Hero preload path format**
   - What we know: `EnhancedImage` takes `src={HeroImg}` where `HeroImg = import('hero.png?enhanced')`. The built output asset path is a hashed filename.
   - What's unclear: The `<link rel="preload">` in `<svelte:head>` needs to reference the same hashed path. During SSR prerender, the hashed path is known to Vite.
   - Recommendation: Use `HeroImg` imported at module level in the component and pass it as a prop to `Head.svelte`. At SSR time, the `?enhanced` import resolves to the final asset URL. Alternatively, render the preload tag inside `HeroSection.svelte` using `<svelte:head>` directly — this is simpler and avoids prop-threading. **Planner should test both patterns and confirm one works with the prerender output.**

2. **`scroll-snap-align: center` on carousel — partial edge card visibility**
   - What we know: UI-SPEC resolves this as `center`. The "partial outer cards visible on ALL screen widths" requirement (D-20) means the track must be narrower than its container so edge cards peek.
   - What's unclear: The exact `padding-inline` and `overflow:hidden` on the section wrapper needed to achieve the peek effect while keeping the no-JS fallback scrollable.
   - Recommendation: Planner should set `overflow: hidden` on the section wrapper and `overflow-x: auto` on the track only. The track extends beyond the wrapper bounds, and the section clips it. Experiment with `padding-inline` on the track to set initial card position.

3. **`validate-json-ld.ts` CI gate — WARNING-2 flip**
   - What we know: The comment in `faq.ts` says "That gate flips on in Phase 1 LND-07 when real FAQ entries land." The CI gate currently does NOT assert `mainEntity.length > 0`.
   - What's unclear: Where exactly in `validate-json-ld.ts` the flip happens.
   - Recommendation: Sub-unit 7 (FAQ) must include a task to enable the `mainEntity.length > 0` assertion in `validate-json-ld.ts`. This is a CI gate change, not a schema change.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 22.x | Build, tests | Assumed ✓ | 22.x (CI pinned) | — |
| npm | Install | ✓ | Migrated in Wave 4; `.npmrc` with `legacy-peer-deps=true` | — |
| `@sveltejs/enhanced-img` | Hero + card images | ✓ | Installed Phase 0 | — |
| User image assets (6 files) | Build (any sub-unit with images) | ✗ | Not yet provided | Temporary 1×1 PNG stubs |
| `logo.svg` | Sub-unit 2 (SiteNav) | ✗ | Not yet provided | Placeholder inline SVG or text |
| Lucide/Heroicons SVGs | Sub-unit 2, 8 (nav/footer icons) | Confirm | May need `npm install lucide` | Inline hand-coded SVG paths |

**Missing dependencies with no fallback:**
- User-provided image assets are required before sub-units 1, 2, 4 can build. Sub-units 3, 5, 6, 7 do not require images and can build without them.

**Missing dependencies with fallback:**
- `logo.svg` → use a text placeholder or simple inline SVG until user provides file
- Image assets → 1×1 transparent PNG stubs placed at the correct paths allow the build to succeed; real assets replace them before PR merge

**Lucide availability check needed:** Run `npm list lucide` to confirm if installed. If not: `npm install lucide` (lightweight SVG icon package). Alternatively, copy the 3 needed SVG paths inline — X (Twitter), Facebook, Instagram. For a 3-icon set, inline is acceptable.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (unit) + Playwright (integration/HTML audit) |
| Config file | `vitest.config.ts` (unit), `playwright.config.ts` (integration) |
| Quick run command | `npm run test:unit -- --run` |
| Full suite command | `npm run test:unit -- --run && npm run test:integration` |

### Existing Test Coverage (Phase 0 — 312 tests pass)

The following test files are already established and will catch regressions introduced by Phase 1 changes:

| Test File | What It Covers | Phase 1 Risk |
|-----------|---------------|-------------|
| `tests/unit/schema-faq.test.ts` | `buildFaqPage()` + `buildGraph()` + `buildWebPage()` | Sub-unit 7 updates `+page.ts` to add `buildFaqPage(faqItems)` — existing tests still pass; add new test for non-empty faqItems |
| `tests/unit/image.test.ts` | EnhancedImage TypeScript type enforcement | Any new EnhancedImage usage is type-checked at build time |
| `tests/unit/schema-shared.test.ts` | Organization/Person/ProfService/WebSite nodes | No change in Phase 1 |
| `tests/integration/html-audit.spec.ts` | H1, meta, canonical, hreflang, landmarks, `<time>` | Phase 1 must preserve all existing audit assertions |
| `tests/integration/routes.spec.ts` | All 15 routes return 200 + stub meta | Phase 1 replaces landing page body — route still returns 200 |
| `tests/integration/synthetic-violations.spec.ts` | Deliberate bad HTML caught by gates | No change |
| `tests/unit/tokens.test.ts` | CSS token references | New components must only use CSS variable names |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LND-01 | H1 "Rust in je hoofd..." in rendered HTML | HTML audit (integration) | `npm run test:integration` | ✅ extend html-audit.spec.ts |
| LND-01 | Hero image has `loading="eager"` in rendered HTML | HTML audit | `npm run test:integration` | ✅ extend html-audit.spec.ts |
| LND-01 | 3 service tile `<a>` links present in initial HTML | HTML audit | `npm run test:integration` | ✅ extend html-audit.spec.ts |
| LND-02 | `<nav>` contains all 5 nav links in initial HTML | HTML audit | `npm run test:integration` | ✅ extend html-audit.spec.ts |
| LND-03 | Werkwijze 3 card headings in initial HTML | HTML audit | `npm run test:integration` | ✅ extend html-audit.spec.ts |
| LND-04 | Stats values (8+, 65+, ∞) in initial HTML | HTML audit | `npm run test:integration` | ✅ extend html-audit.spec.ts |
| LND-05 | All 5 Behandelingen `<a>` links in initial HTML | HTML audit | `npm run test:integration` | ✅ extend html-audit.spec.ts |
| LND-06 | Email form present in initial HTML | HTML audit | `npm run test:integration` | ✅ extend html-audit.spec.ts |
| LND-07 | FAQ `<details>` items present + FAQPage in JSON-LD | Unit + HTML audit | `npm run test:unit -- --run` | ❌ Wave 0: new test in schema-faq.test.ts |
| LND-07 | `mainEntity.length > 0` in JSON-LD (WARNING-2 flip) | Unit | `npm run test:unit -- --run` | ❌ Wave 0: update schema-faq.test.ts |
| LND-08 | Footer NAP data (email, address) in rendered HTML | HTML audit | `npm run test:integration` | ✅ extend html-audit.spec.ts |
| LND-09 | Locked copy strings present in built HTML | CI grep gate | `bash scripts/check-copy.sh` | ❌ Wave 0: new script + CI step |
| LND-10 | Hedge-language absent from new FAQ copy | CI grep (extend existing) | `bash scripts/grep-placeholders.sh` | ✅ extend existing script |
| PRF-02 | `<link rel="preload" as="image">` in rendered HTML | HTML audit | `npm run test:integration` | ❌ Wave 0: extend html-audit.spec.ts |
| PRF-03 | No non-hero image has `loading="eager"` | HTML audit | `npm run test:integration` | ❌ Wave 0: extend html-audit.spec.ts |
| PRF-04/05/06 | LCP/INP/CLS budgets | Lighthouse CI | `lighthouserc.json` (wired) | ✅ already wired |
| PRF-07 | No third-party JS in initial landing page | HTML audit (script src check) | `npm run test:integration` | ❌ Wave 0: add script-src assertion |
| A11Y-01–04 | WCAG 2.2 AA on landing page | pa11y-ci | `.pa11yci.json` (wired in CI) | ✅ already wired |
| A11Y-02 | All form inputs have `<label>` | HTML audit | `npm run test:integration` | ❌ Wave 0: extend html-audit.spec.ts |
| A11Y-03 | Touch targets 44px | Manual Lighthouse | Lighthouse CI `accessibility` score | ✅ covered by Lighthouse accessibility=0.95+ |

### Sampling Rate
- **Per task commit:** `npm run test:unit -- --run` (< 30 seconds)
- **Per wave merge:** `npm run test:unit -- --run && npm run build && npm run audit:html && npm run audit:json-ld`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps (new tests/scripts needed before implementation begins)

- [ ] `scripts/check-copy.sh` — LND-09 copy preservation gate (new script)
- [ ] `tests/unit/schema-faq.test.ts` — add test: `faqItems.length >= 8` when content file exists
- [ ] `tests/unit/schema-faq.test.ts` — flip WARNING-2: assert `mainEntity.length > 0` (gated after sub-unit 7)
- [ ] `tests/integration/html-audit.spec.ts` — extend with Phase 1 landing-page assertions (H1 text, hero eager, nav links, FAQ presence, preload link, no third-party scripts)
- [ ] `ci.yml` — add `check-copy.sh` step in `build-and-audit` job after HTML audit step

---

## Security Domain

This phase introduces no authentication, no form submission (Phase 3 wires the endpoint), no third-party scripts (PRF-07), and no user data processing. Security surface is minimal.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in Phase 1 |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | All content is public |
| V5 Input Validation | Partial | AVG consent checkbox present but form does nothing (Phase 3 wires endpoint). Zod validation added in Phase 3. |
| V6 Cryptography | No | No crypto |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `{@html}` injection in Svelte | Tampering | `JsonLd.svelte` already escapes `</script` in serialized JSON. No other `{@html}` used in Phase 1. |
| XSS via FAQ answer content | Tampering | FAQ content is a TypeScript constant (not user input). No sanitization needed for static content. |
| CSP violation from inline SVG | Tampering | Social icons are inline SVG, not external scripts. No CSP risk. |

---

## Sources

### Primary (HIGH confidence)
- Existing codebase — Phase 0 artifacts verified by direct file read:
  - `src/lib/components/EnhancedImage.svelte` — usage pattern for `loading="eager" fetchpriority="high"`
  - `src/lib/components/JsonLd.svelte` — single mount point, `{@html}` with `</script>` escape
  - `src/lib/schema/faq.ts` — `buildFaqPage()` signature and usage
  - `src/lib/schema/buildGraph.ts` — `buildGraph({ pageSpecific, path })` signature
  - `src/lib/constants/brand.ts` — BRAND object structure; `stats` property missing (D-16)
  - `static/global.css` — all design tokens verified
  - `.planning/phases/01-landing-sections/01-CONTEXT.md` — D-01–D-40 locked decisions
  - `.planning/phases/01-landing-sections/01-UI-SPEC.md` — visual/interaction contract
  - `.github/workflows/ci.yml` — existing CI gate inventory
  - `lighthouserc.json` — Lighthouse budget configuration
  - `tests/unit/schema-faq.test.ts` — existing test patterns for schema

### Secondary (MEDIUM confidence)
- `[ASSUMED]` — Svelte 5 `onMount` patterns for scroll listener, focus management, progressive enhancement (training knowledge; confirmed as the standard Svelte 5 lifecycle pattern)
- `[ASSUMED]` — `<details>` `toggle` event for sibling-close (widely documented HTML pattern)
- `[ASSUMED]` — CSS `scroll-snap-type: x mandatory` + `scroll-snap-align: center` carousel (CSS specification)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages from Phase 0, verified by direct codebase inspection
- Architecture: HIGH — existing primitives verified; JS interaction patterns ASSUMED but low-risk
- Pitfalls: HIGH — derived from actual codebase + CI gate analysis + Svelte 5 SSR constraints
- Test coverage: HIGH — existing test files verified; gaps explicitly identified

**Research date:** 2026-06-22
**Valid until:** 2026-07-22 (30 days; stable stack)
