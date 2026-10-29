---
status: complete
date: 2026-10-29
---

# 261029-cci: contact card illustrations, no magnet behind a modal

- **Magnet:** `use:magnetic` no longer pulls while any `dialog[open]` is on the page; the
  card eases home as on any release. Covers the treatment cards and the contact cards.
- **Contact cards:** two illustrations generated with Gemini's image model (Nano Banana,
  `gemini-3.1-flash-image`) through Figma `generate_image`, in the Figma file
  "Trinity contact card illustrations" (tARqy4Tuwlnga6XwHm4Xzc). Weave was not linked to
  the account, so the Figma route was used.
  - Kennismaking: two teacups, steam twining into one gold line.
  - Bericht: an open envelope with leaves drifting out.
  - The illustrations are shown from 1280px up only, filling the card from the right and fading
    into its paint, with the text capped at 23rem. Below that, the text runs into the glow
    (1024px cards are ~510px; phones centre the text), so the illustrations are hidden there
    and never downloaded.
  - The `<picture>` wrapper is positioned out of the flow; as a flex item it, and with
    display: contents its <source>s, added gaps to the card.

## Checks
svelte-check 0 errors; eslint and prettier clean; service-modal and contact-section specs pass;
visual baselines updated for desktop only (mobile unchanged).

## Follow-up (same day)
- Glow and lines matched to the Werkwijze cards (`werkwijze-match.cjs`): the line art is
  pulled to a crisp brown-gold inside the glow, and the glow lifted to Werkwijze's peak
  (~123 luminance above the green). A dimmed version was tried first and rejected.
- Pause button removed from the carousel controls (owner). Noted in code: WCAG 2.2.2 now
  rests on keyboard focus and reduced motion only. Specs hold the fan with
  `<html data-drift="off">` instead.
