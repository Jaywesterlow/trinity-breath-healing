---
status: complete
---
# 261018-pln: Proof band, footer lotus, nav at 1100, smooth scroll, FAQ line, smaller scale; Werkwijze cards and pause; carousel scroll drive

Branch `claude/proof-lotus-nav-scroll` from main. Selected parts of PR #31 (commits d317a58,
655b7ea) ported on the owner's list; the rest of PR #31 (three-line hero title, call button,
nav shadow and frosted glass, lotuses between the figures) stays out.

## From PR #31

- **Proof band** (`Proof.svelte`) under the hero: three figures with AboutStat count-up, on
  `--color-card-warm`. Hairlines between them (`--proof-hairline`, brown at 28%) instead of the
  gold lotuses: border-top between rows on a phone, border-left between columns from 700px.
  Over mij loses its ledger and becomes 5fr/6fr; heading 22ch, balanced.
- **Footer lotus**: logo as a CSS mask, large and faint, cut off by the footer's bottom edge.
- **Nav desktop row from 1100px** (Nav, NavCta, NavLogo, `--nav-height` in app.css), inner width
  `min(container, 100% - 3rem)`, links tighter at 1100–1279. Measured at 1100/1280/1366/1600/1920:
  the rightmost button ends exactly on the container edge, no overflow.
- **Lenis 1.3.11** (`smooth-scroll.ts`, started in `+layout.svelte` onMount, off for reduced
  motion). Carousel, Werkwijze pin and service modal tests pass with it running.
- **FAQ line** "Staat je vraag er niet bij? Neem gerust contact op": left column under the
  heading on desktop, after the list on a phone.
- **Everything smaller**: type scale, 36px buttons from app.css (ButtonLink.svelte untouched),
  logo, nav 88px, AboutStat, Contact headings.

## Underline (`.link-underline`, app.css)

Measured frame by frame (stepped animations, then a live 60fps screencast): the line's pixel rows
never moved. The "thicker at the end" was the second stage: currentcolor at 45% alpha covered by
full colour reads as the line fattening. Now on the nav's model: 1px (`--underline-height`), both
stages opaque (idle grey, then the link colour; the footer sets `--link-underline-idle`), and a
painted `background-size` wipe instead of `scaleX`. Live recording: one pixel row from the first
frame to rest.

## Todos

- **Werkwijze cards**: padding 28px (was 16, inside a 25px corner), title and body a tight pair
  (8px), 24px to art or button; filled cards' art bleeds to the card's sides and foot; the outline
  card's art raised 16px so the heading clears it. Figma structure kept.
- **Werkwijze pause**: `STAIR_RISE_START = 0.12` from PR #29 (never merged): the cards stay
  aligned under the heading from the centre line up to 12% of the viewport before lifting.
- **Behandelingen carousel**: idle drift off (flag), new `scroll` motion phase. 400px of scroll
  is one card, down = Volgende; each frame closes a fixed fraction of the remaining distance
  (tau 100ms), so it moves with the page and brakes smoothly when the scroll stops. No step, no
  snap. `behandelingen-idle-drift.spec.ts` replaced by `behandelingen-scroll-drive.spec.ts`.
