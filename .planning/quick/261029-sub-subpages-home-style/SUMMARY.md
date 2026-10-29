---
status: complete
date: 2026-10-29
---

# 261029-sub: subpages in the home page's style, footer curtain, hero timing

- **PageHead** centred: eyebrow over the big title, a short lead, a drawing (if any) above,
  more space before the content. Eyebrows added on Behandelingen, Diensten, Werkwijze, Over mij;
  leads shortened.
- **PageSection**: no rules between sections; eyebrows on the Over mij and service-page sections.
- **CtaBand**: a centred green watercolour card (eyebrow "Kennismaken"), disclaimer under it.
- **ServiceCard**: green watercolour, sand text, sand arrow ring; paintGreen by service index.
- **Behandelingen**: complaints as green cards; treatments as small gold-ringed tags with a soft
  glow (sand text: gold text on the green is 2.4:1). The lone 7th card is centred at 3 columns.
- **Footer curtain**: the footer sticks under the page (.page-content z-index 1, sand) and is
  revealed as the page slides off, only when the whole footer fits the screen (attachment).
- **Hero**: text wash 3.6s→2.4s, text 4.1s→2.9s (the pause after the paint; the heading is the
  LCP text). HeroLights PROBE_AT 5600→4400.
- **FAQ**: (separate commit 6e03e9f) faster curve, shorter fade delay; leaves pause off screen.
- Tests: page-grid holds a centred h1 to the page's centre line; reveal.spec checks inline
  styles only (CSS is inlined since ed8492e); leaves' opacity via a variable (reveal audit);
  visual test pins the footer for full-page captures. Not touched: the empty stub pages
  (Reviews, Artikelen) keep their own layout.

## Checks
svelte-check 0 errors; eslint/prettier clean; page-grid, reveal, reveal-audit, no-dead-css-vars
38/38; html-audit, contact, cursor-tooltip passed; visual baselines updated (4).
