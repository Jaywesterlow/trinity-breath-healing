# Quick Task 260704-fj7: Increase spacing between cards in Werkwijze section so adjacent card edge doesn't peek in on some screens. On mobile, make vertical scroll drive horizontal card scroll until last card reached, then resume normal vertical scroll. - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning

<domain>
## Task Boundary

Two fixes to `src/lib/components/global/Werkwijze.svelte` (mobile-only, <1024px breakpoint):

1. Card peek bug: neighbor card edge visible on wider phone viewports.
2. Vertical scroll should drive horizontal card scroll while the section is in view; once the last card is reached, normal vertical page scroll resumes.

</domain>

<decisions>
## Implementation Decisions

### Root cause of peek bug (found during codebase read)
`.werkwijze__cards` uses `padding-inline: calc((100% - 17.625rem) / 2)` to center the snapped card, plus a fixed `gap: var(--space-16)` (64px) between cards. Peek occurs whenever the padding exceeds the gap, i.e. `(viewport - 282px) / 2 > 64px` → viewport > 410px. Phones at/above ~412-430px width (iPhone Pro Max, Pixel, many Android) trigger this. Fix must make the gap scale with the padding (e.g. `gap: max(var(--space-16), calc((100% - 17.625rem) / 2 + var(--space-4)))`) rather than raising the flat gap value, since a flat bump only shifts the breakpoint, not eliminates it.

### Scroll driver mechanism
- JS scroll-jack (section `position: sticky`, JS maps vertical scroll delta to horizontal transform on the card track) with native touch swipe kept as a fallback/escape hatch directly on the card track.
- All cards remain in initial HTML render order (no JS-gated visibility) — SSG/AEO crawler visibility unaffected.

### Advance style
- Continuous 1:1 tracking: horizontal position tracks vertical scroll proportionally, not discrete per-gesture snapping.

### Reduced motion
- `prefers-reduced-motion: reduce` → scroll-jack fully disabled, falls back to current behavior (normal vertical scroll, cards horizontally swipeable on their own, existing `scroll-snap-type: x mandatory`).

### Claude's Discretion
- Exact pin height / scroll distance needed to traverse all 3 cards.
- Whether to use a scroll listener + rAF-throttled transform, or IntersectionObserver + wheel/touch delta capture — implementation detail, pick whichever is simplest and meets INP < 200ms.
- Keyboard/focus behavior when tabbing through cards during the pinned phase (must not trap focus — WCAG 2.2 AA).

</decisions>

<specifics>
## Specific Ideas

No specific external reference implementation given — standard "pinned horizontal scroll section" pattern (similar to Apple/Stripe product pages), scoped to mobile only (desktop stays static per existing `@media (min-width: 1024px)` override).

</specifics>

<canonical_refs>
## Canonical References

- `src/lib/components/global/Werkwijze.svelte` — section markup + styles
- `src/lib/components/ui/WerkwijzeCard.svelte` — card component, fixed width 17.625rem
- `static/global.css` — spacing tokens (`--space-4`, `--space-16`)
- CLAUDE.md constraints: LCP < 2.5s / INP < 200ms / CLS < 0.1, WCAG 2.2 AA, no client-only rendering that blocks crawlers

</canonical_refs>
