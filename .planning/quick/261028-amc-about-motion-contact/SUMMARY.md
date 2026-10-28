---
status: complete
date: 2026-10-28
---

# 261028-amc: About photo, drifting leaves, services drift, contact-card prompts

## Done

- **About portrait:** her photo ("Warme portretfoto in de tuin.png") replaces the line-art
  portrait. A ragged watercolour edge is baked into the alpha (`portrait-mask.cjs`), with a
  slightly warmer grade and a loose gold arc that draws itself on entry.
- **Drifting leaves** (`DriftingLeaves.svelte`) behind the About section:
  - The CSS 3D tumble and the JS translate are both transforms.
  - One leaf per 180px of width (5–24), recycled from right to left.
  - Scroll down speeds them up and scroll up slows them; they never go backwards.
  - They are off screen-paused and absent with reduced motion.
  - The four leaves are code-drawn placeholders (`placeholder-leaves.cjs`).
- **Services fan:** it drifts while on screen (6.4s per card).
  - Scroll down adds about one card per 400px; scroll up brakes it to a stop, never in reverse.
  - It holds under the pointer and on keyboard focus.
  - A new pause button after the dots (WCAG 2.2.2).
  - Library 42 was read and not used: it speeds up in both directions, and it is a flat band.

## Image prompts (owner generates, same tool as the Werkwijze cards)

Shared style line for every prompt:

> Soft watercolour on a muted sage-green wash (#5f7052 to #6f8060), fine hand-drawn gold
> line art (#d4a968), a warm glowing light behind the subject, delicate pale-green leaves
> with gold veins, calm and spiritual, no text, no frame.

**Contact card 1, "Plan een kennismaking"** (wide, 3:1, subject in the right third, left two
thirds plain wash for text):
- A. Two teacups side by side, steam curling up into one soft gold breath line.
- B. Two open hands reaching toward each other, a small sprout between them.
- C. A garden bench under an arching branch, two cushions.

**Contact card 2, "Stuur een bericht"** (same format):
- A. An open envelope with leaves drifting out of it.
- B. A small bird in flight carrying a leaf.
- C. A folded letter with a gold line lifting off it like wind.

**Leaves for the About section** (4 separate images, transparent background, 512x512, one leaf
each, centred, pointing right):
> A single watercolour leaf, pale sage green with soft blooms, a fine gold midrib and stem,
> transparent background, no shadow.
Make four shapes: almond, slender willow, round, and slightly curled.

## Checks

- svelte-check: 0 errors.
- eslint and prettier: clean on the changed files.
- tokens: 31/31.
- no-dead-css-vars and cursor-tooltip: pass.
- Behandelingen specs: 17/17 after the scroll-drive spec was rewritten. The modal and retarget specs pause the drift first.
- Visual baselines: home desktop and mobile updated for the photo.
