# 261017-hpn — Hero copy, proof band, nav call button and edge, smooth scroll, lotus

Branch `claude/trinity-hero-proof-nav`, built on PR #29's branch (carousel scroll drive).
The water demo (PR #30) was scrapped on the owner's word and closed.

## What changed

- **Hero copy** — her new text verbatim: three-line title (Rust in je geest. /
  Ontspanning in je lichaam. / Verbinding met je ziel.) and four intro paragraphs.
  Each title sentence is its own line; one line each from 1100px, balanced wraps on a
  phone. `check-copy.sh` locks the new title.
- **Proof band** (`Proof.svelte`) straight under the hero: the three figures moved out
  of the Over mij ledger (same values, labels, count-up). Over mij is now two columns.
- **Logo in the design** — the lotus (CSS mask over `/trinity-logo.svg`) stands between
  the figures in the proof band, and rises large and faint out of the footer's foot.
  A watermark behind the proof band was tried and dropped (it sat behind the ∞).
- **Call button** (`NavCall.svelte`) instead of a top bar: an outlined ring beside the
  menu button on a phone and beside the CTA on desktop; a pill with the number from
  1800px, where the container is wide enough. Same global pill + text-roll classes as
  ButtonLink, which is untouched.
- **Nav edge** — once scrolled past 8px the bar gets a brown hairline, a soft shadow and
  a frosted, slightly translucent sand (solid sand without backdrop-filter).
- **Nav breakpoint 1024 → 1100** (and `--nav-height`), the tablet line the hero and
  Werkwijze use. At 1024 the row already overflowed by ~50px; 1100–1279 tightens the
  links; below 1248 the row keeps a 24px gutter.
- **Smooth scroll** — Lenis 1.3.11, lerp 0.12, nested scroll boxes keep their own
  scroll, anchors land under the nav, off under reduced motion, loaded after mount.
- **FAQ** — "Staat je vraag er niet bij? Neem gerust contact op" under the heading on
  desktop, after the list on a phone.

## Later

- Fact card: saved for the hero-image version (third branch, after this one).
