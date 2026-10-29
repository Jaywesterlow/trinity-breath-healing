# Quick 261027-hil — hero intro + living lights in Hero.svelte

Port of the approved prototypes (`Figma/Hero-redesign/intro-prototype`, `Figma/Hero-redesign/lights-prototype`).
GSD workflow file (`~/.claude/get-shit-done/workflows/quick.md`) is missing on this machine; steps followed by hand.

## Sequence (Jay, 2026-10-27)
1. Painted lines draw on: SSR'd mask strokes (pure CSS, as the old main-branch hero), gating the painting's own line layer.
2. Paint washes in from the tree at 1.82s (Hero.svelte's three-radial `--wash-r` mask), 1.8s.
3. Lights fade in at 2.02s (client JS: breathing orbs, 12 fireflies in 3 clusters, river streaks clipped to the river, gold-line response). Values from the lights prototype.
4. Text wash at 3.6s, text cascade at 4.1s.

## Portrait
Phone painting (no crop). Text anchored to the bottom: button bottom one side-padding above the screen edge.
On short phones the image moves up (loses sky) so the text never covers the river — CSS only (flex overflow), no JS layout.

## Constraints
SSR text and eager hero image stay. Reduced motion: everything shown, lights still. No-JS: intro still plays (CSS), no lights.

## Tasks
1. Assets: line layers, lit layers, paper tile, baked draw SVGs (emit-draw.cjs).
2. HeroLights.svelte (client).
3. Hero.svelte markup + CSS.
4. Verify: build, check, lint, touched specs, visual snapshots, LCP/CLS in preview, Chrome + WebKit at 3 sizes.
