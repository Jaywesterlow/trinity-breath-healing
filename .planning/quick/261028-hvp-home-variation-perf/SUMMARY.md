---
status: complete
date: 2026-10-28
---

# Varied watercolours + home performance

Variation: ten watercolour variants (`--paint-green-1..10`, `$lib/paint.ts`): the calm tops
of the three werkwijze-card images, plain / mirrored / flipped. Services 1-7 (card and modal
share one), contact cards 8 and 9, footer 10. Each within 3/255 of the brand green.

Performance, Lighthouse A/B against the previous build (0f7d9ab) on `vite preview`, 3
alternating runs each, machine under load from another session:

| | before | after |
|---|---|---|
| desktop | 94-95 | 96 |
| mobile | 70-73 | 80-82 |

- All CSS inlined (`kit.inlineStyleThreshold`, 160KB): no render-blocking stylesheets.
- Only the screen's own line layer downloads (`<link rel=preload media>` + href set on
  hydration); before, both did (+106KB on desktop, +137KB on phones).
- Text wash: 16KB AVIF from `static/images/` (the `?url` import produced a `.heif` that
  404s), WebP fallback recompressed 177 -> 68KB. Preloaded on landscape (it is the LCP
  there); the portrait painting is preloaded on phones.
- Watercolours excluded from asset inlining so they do not ride in every page's HTML.

Gotchas: the owner's 83 was measured on the dev server with extensions. `vite preview`
indexes files at start: restart it after every build or the JS 404s and scores inflate.

Left on the table (each changes the look, owner to decide): mobile FCP/LCP are now bound by
the inlined draw SVGs in the HTML and by the intro's own reveal timing.
