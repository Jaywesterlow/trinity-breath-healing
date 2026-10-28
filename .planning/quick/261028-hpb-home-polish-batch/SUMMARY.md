---
status: complete
date: 2026-10-28
---

# Home polish batch

- Button: the resting arrow is the pill's brown (was gold). The circle is 32px again, 6px
  from the pill's edge on top, bottom and right (an app.css override made it 36px: 4/4/6,
  which also read as a border).
- Curtain scroll: the hero is sticky; `.over-hero` in `+page.svelte` carries the rest of the
  page over it. The nav's "over the hero" state and the hero lights' rAF follow the sheet's
  top (lights: 0 updates while covered, verified).
- Werkwijze: gold rule between heading and line removed; heading forest like every H2.
- Watercolour on every green surface: `--paint-green` (app.css), from the calm top of
  `werkwijze-card1` (`green-wash.webp`, 3.4KB, mean within 3/255 of the brand green).
  Treatment cards, service modal, contact cards, footer.
- FAQ / small text links: arrow 16px with the 16px label (was 22px).
- Consistency: Contact eyebrow and H2 on the shared scale (was 16-20px / 28-40px); subpage
  section eyebrows match the home page (18px light, was 12px caps); every button label
  DM Sans 16 (in-place buttons were Cormorant 18).

Checks: svelte-check 0 errors, eslint/prettier clean, tokens unit 31/31, dead-css-vars and
cursor-tooltip specs pass, 4 visual baselines updated after review.
