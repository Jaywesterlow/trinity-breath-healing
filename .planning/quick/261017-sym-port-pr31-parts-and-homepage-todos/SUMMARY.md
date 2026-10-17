---
status: complete
date: 2026-10-17
branch: claude/proof-lotus-nav-scroll
---

# 261017-sym: PR #31 parts onto main, plus three homepage todos

Run inline (no planner/executor agents): the brief was already a full spec.

## Ported from PR #31 (d317a58, 655b7ea)
- Proof band under the hero (hairlines, no lotus marks); ledger removed from Over mij.
- Footer lotus.
- Desktop nav from 1100px; container inset; tighter links 1100–1279. Measured at
  1100/1280/1366/1600/1920: CTA right edge = container right edge, no page overflow.
- Lenis 1.3.11 smooth scroll (off under reduced motion).
- FAQ "Staat je vraag er niet bij?" line.
- Smaller type scale, buttons (via app.css, ButtonLink.svelte byte-identical), logo,
  nav height 88, stats, contact headings.

Not ported: new hero title, nav call button, nav shadow + frosted glass.

## New
- `.link-underline`: two background layers on one pseudo-element, widths driven by
  registered custom properties, instead of two stacked scaleX lines. 1px.
  Frame checks (paused-seek and live, headless, DPR 1 and 1.5): same pixel rows in
  every frame, during and after. The old compositor-layer jump could not be
  reproduced headless; a headed GPU capture did not work. Needs a look on a real screen.
- Werkwijze cards: 24px inset, 12px title→body, 24px to art/CTA; outline card art in flow.
- Behandelingen: `scroll` motion phase; fan follows scroll (280px per card), brakes
  (tau 120ms) after the scroll stops, no latch. Idle drift left as on main.
- Werkwijze: cards hold aligned until the heading reaches nav + 24px, then lift.

## Gates (once)
- vite build OK; adapter-vercel fails locally on a Windows symlink (EPERM), environmental.
- Unit: pass. Playwright: 340 pass; 17 routes.spec canonical failures come from the local
  `.env` PUBLIC_SITE_URL (pre-existing); staircase spec updated (8/8); visual baselines
  for home/contact regenerated.
- a11y: 0 violations. AI initial HTML (ClaudeBot, OAI-SearchBot): pass. html, json-ld,
  placeholders: pass.
