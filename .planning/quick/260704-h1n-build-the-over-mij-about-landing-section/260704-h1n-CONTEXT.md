# Quick Task 260704-h1n: Build the 'Over mij' (About) landing section - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning

<domain>
## Task Boundary

New landing section, "Over mij" (About), built from Figma:
- Desktop: `node-id=318-210` (file `5oO2vWR9U4N3HFSflujbnx`)
- Mobile: `node-id=512-46` (same file)

Placed after Werkwijze in the section order (per ARCHITECTURE §11.2 per-section build order — confirm exact position against `.planning/research/ARCHITECTURE.md` §11.2 if it exists, otherwise place directly after Werkwijze in `+page.svelte`).

Two new reusable UI components required by explicit user instruction:
1. A "number/icon in a circle + label text beside it" component (used 3x — the stat badges).
2. An "icon-in-circle + title + body text" component (used 2x, desktop-only — the feature rows).

</domain>

<decisions>
## Implementation Decisions

### Content (verbatim from Figma — Dutch copy, do not paraphrase)
- Eyebrow: "Over mij"
- Heading (H2): "Vanuit eigen ervaring weet ik wat jij doormaakt."
- Body paragraph: "Ik ben 53 jaar en weet uit eigen ervaring hoe het voelt om vast te lopen. Mijn aanpak is geen theorie, het is wat mij zelf heeft geholpen. Ik werk vanuit rust, veiligheid en echte ervaring."
- Feature row 1: title "Vanuit eigen ervaring", body "Geen aangeleerde theorie, maar een aanpak die ik zelf heb doorleefd."
- Feature row 2: title "Vakkundig opgeleid", body "Geen aangeleerde theorie, maar een aanpak die ik zelf heb doorleefd." — **identical body copy to row 1, confirmed intentional-for-now**: ship exactly as Figma has it (locked decision — do not invent different copy, do not flag as a bug in the component, just reproduce verbatim). Copy can be revised later without a rebuild.
- Mobile-only pill CTA: "Plan een kennismaking"
- Stat labels: "Jaren ervaring" (8+), "Klachten verholpen" (65+), "Mogelijkheden voor herstel" (∞)
- Text link CTA: "Lees meer over mij" + arrow

### Links
- "Lees meer over mij" → `/over-mij` (existing route, confirmed present at `src/routes/over-mij/`)
- "Plan een kennismaking" (mobile-only pill) → `/contact` (existing route; no `/boeken` route exists yet)

### Stats data source
- Reuse `BRAND.stats` from `src/lib/constants/brand.ts` (already has `yearsExperience: '8+'`, `clientsHelped: '65+'`, `satisfaction: '∞'`) — do NOT hardcode these strings again in the component; import and map from `BRAND.stats`.

### Component reuse (do not build new primitives where an existing one fits)
- **"Lees meer over mij"** → reuse existing `TextLink` component (`src/lib/components/ui/interactions/TextLink.svelte`). Desktop color is `--color-muted` (#7A8C6E) not the component's current default `--color-fg-forest` — check whether `TextLink` needs a new color variant prop (e.g. `tone="muted"`) or whether an inline style override at the call site is more appropriate; planner/executor discretion, but do not fork a new link component for this.
- **"Plan een kennismaking"** (mobile pill, outline style — transparent bg, 2px border, light cream text, sits on a dark image overlay) → this does NOT match the existing `ButtonLink` component's current filled-pill style (solid `--color-border` background). Extend `ButtonLink` with an `outline` variant prop (border + transparent bg, following the same extension pattern already used elsewhere in this codebase — e.g. `WerkwijzeCard`'s `variant: 'filled' | 'outline'`, `TextLink`'s `inverted` prop). Do not create a new button component.
- Do NOT build a shared component for the two portrait image cards themselves (desktop shows 2 side-by-side, mobile shows 1 full-bleed with an overlay) — these are visually distinct enough (mobile has the text+CTA overlay baked into the image card; desktop cards are plain images) that inline section markup is appropriate. They are NOT part of the "must be components" instruction — only the number-badge and icon-feature-row are.

### New color token needed
Figma uses `#C7A27A` for the mobile CTA text/border/link accents in this section (the "Lees meer over mij" link inside the dark overlay, and the "Plan een kennismaking" pill border). This does not match any existing token closely enough to reuse (`--color-accent-gold: #D4A968` and `--color-border: #B68A6B` both differ meaningfully). Add a new token to `static/global.css` following the existing pattern (see `--color-text-subtle` added for Werkwijze) — suggested name `--color-accent-gold-soft: #C7A27A;` with a one-line comment noting it's Figma-sourced for this section's dark-overlay CTA accents. The pill button's overlay text-on-dark cream tone (`#F7EFE4`) is close enough to existing `--color-bg-sand` (#FAF0E6) to reuse as-is — do not add a token for that one.

### Images (already downloaded to `static/images/`, use these paths — do not re-fetch from Figma)
- `about-portrait-1.png` — desktop-only left card (woman-from-behind line art), 1060×1580 source, rendered at 282×459 desktop.
- `about-portrait-2.png` — desktop right card (woman-face line art) AND the single full-bleed mobile card (same image, reused at different render sizes: 282×459 desktop, ~355×579 mobile full-bleed).
- `about-icon-heart.jpg` — heart-line icon inside the "Vanuit eigen ervaring" feature circle (desktop only), rendered ~1024×1030 source into a 75px circle.
- `about-icon-sprout.jpg` — sprout/leaf-line icon inside the "Vakkundig opgeleid" feature circle (desktop only).
- `about-icon-infinity.jpg` — stylized infinity glyph image inside the "∞ Mogelijkheden voor herstel" stat badge (used at both desktop 125px and mobile 77px badge sizes — same source file, do not duplicate).

All 4 icon/portrait assets are decorative — `alt=""` `aria-hidden="true"`, matching the existing `WerkwijzeCard.svelte` convention for its `wcard__art`/`wcard__img`.

### Mobile card overlay gradient
The mobile full-bleed portrait card has a bottom gradient/blur mask (Figma "Mask group" + backdrop-blur) behind the paragraph text + CTA so they stay legible over the image. Implement as a **plain CSS gradient** (`linear-gradient` fading to a dark scrim, e.g. `background: linear-gradient(to top, rgba(61,74,53,0.92) 0%, transparent 55%)` layered over the image, tuned to taste against the screenshot) rather than downloading Figma's mask/blur image asset — cheaper, no extra network request, and CSS gradients already used elsewhere in this codebase's convention of "plain CSS over asset tricks." Exact stop values are implementer's discretion — match the screenshot closely (text legible, gradient not harshly banded).

### Desktop-only vs. both breakpoints
- Two feature rows (heart/sprout icon + title + body) appear **desktop-only** (≥1024px) — confirmed via Figma metadata, the mobile frame's node tree ends after the 3 stat badges with no feature-row equivalent. Do not force these onto mobile; do not treat their absence as a missing-content gap.
- The "Plan een kennismaking" pill button is **mobile-only** — it does not appear anywhere in the desktop frame.
- Stat badges (8+/65+/∞) appear on **both** breakpoints.
- Breakpoint cutoff: match the existing `@media (min-width: 1024px)` convention already used in `Werkwijze.svelte`/`Hero.svelte` — do not introduce a different breakpoint value for this section.

### Claude's Discretion
- Exact component names (e.g. `AboutStat.svelte` / `AboutFeature.svelte`, or similar) — pick clear names consistent with existing naming (`WerkwijzeCard`, `FooterNavColumn`).
- Where the two new shared components live — likely `src/lib/components/ui/` alongside `WerkwijzeCard.svelte`, `FooterNavColumn.svelte` per existing convention.
- Exact section component name (suggest `OverMij.svelte` or `About.svelte`, placed in `src/lib/components/global/` alongside `Werkwijze.svelte`, `Hero.svelte`) and its export in `src/lib/components/global/index.ts` + `src/lib/components/ui/index.ts` as applicable, matching how `Werkwijze` was wired into `+page.svelte`.
- Precise mobile gradient/scrim tuning, exact spacing scale mapping to `--space-*` tokens for gaps/padding not explicitly called out above.
- Whether the stat-badge circle needs distinct desktop (125px) vs mobile (77px) sizing done via a prop, a CSS custom property, or a breakpoint-scoped CSS rule — implementer's call, whichever fits the existing token/component patterns best.

</decisions>

<specifics>
## Specific Ideas

Reference: `src/lib/components/global/Werkwijze.svelte` and `src/lib/components/ui/WerkwijzeCard.svelte` for the established patterns this section should follow — eyebrow+heading block styling, mobile-first CSS with a single `@media (min-width: 1024px)` desktop override, `--space-*` token usage, decorative image `alt=""`/`aria-hidden="true"` convention, non-token exact-rem values with a `/* Figma spec */` comment when a design measurement doesn't cleanly map to the token scale (e.g. the 25px / 1.563rem card radius already used by `WerkwijzeCard` — this About section reuses that exact same card radius/size for its desktop portrait cards, worth noting as a nice consistency point, not a hard requirement to unify into a shared component).

</specifics>

<canonical_refs>
## Canonical References

- `src/lib/components/global/Werkwijze.svelte`, `src/lib/components/ui/WerkwijzeCard.svelte` — pattern reference
- `src/lib/components/ui/interactions/TextLink.svelte`, `ButtonLink.svelte` — components to reuse/extend
- `src/lib/constants/brand.ts` — `BRAND.stats` data source
- `static/global.css` — design tokens; add `--color-accent-gold-soft`
- `src/routes/over-mij/`, `src/routes/contact/` — existing CTA destinations
- CLAUDE.md constraints: SSG/no client-only rendering, LCP/INP/CLS budgets, WCAG 2.2 AA, plain CSS only

</canonical_refs>
