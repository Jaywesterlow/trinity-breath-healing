# Hero in aquarel — bron en prompt

`src/lib/images/hero-illustration-aquarel.png` is de lijntekening `hero-illustration.png`
overgeschilderd in aquarel. Gemaakt 2026-09-22 met Gemini 3 Pro Image
(`gemini-3-pro-image`), met de originele PNG als invoer en de prompt hieronder.
Uitvoer is 2304x1856 (5:4); het origineel is 2015x1721. Bij gebruik eerst
bijsnijden naar die verhouding, anders klopt de hoogteberekening in Hero.svelte niet.

Nog niet in gebruik op de site. De hero tekent zichzelf nu als SVG lijn voor lijn
(zie `hero-illustration.svg` en de `--t`/`--d` waarden daarin); een platte aquarel
kan dat niet. Wie hem inzet moet kiezen: animatie laten vallen, of de wassing als
tweede laag achter de intekenende lijnen zetten en laten infaden als die klaar zijn.

Beeldgeneratie is niet deterministisch: dezelfde prompt geeft een ander resultaat.
Dit bestand is het resultaat, de prompt staat erbij om de stijl te kunnen herhalen.

## Prompt

```text
Repaint this exact line drawing as a delicate watercolour painting. Keep the composition, the perspective and every shape precisely as they are: the same windswept tree on the same bank, the same mountain ridges, the same winding river coming toward the viewer, the same ferns and stones. Add nothing and remove nothing.

Technique: transparent watercolour washes on cold-press paper. Let the pigment pool and granulate at the edges of each wash, with soft blooms and visible wet-in-wet bleeding where the river meets the bank. Leave generous areas of bare paper, especially in the sky and in the water's highlights. The original fine ink linework must stay visible on top of the colour, as if the drawing was inked first and washed afterwards; do not thicken or redraw the lines.

Palette, muted and earthy, nothing saturated: sage and deep forest green for the foliage and the far ridges, warm grey-brown for the trunk and branches, the palest blue-grey and sage for the water, soft ochre for the bank. The paper itself is a warm cream, the colour of unbleached linen (#faf0e6), and that cream is also the background of the whole image, edge to edge, with no frame, no border, no vignette and no drop shadow.

The mood is calm, airy and restrained: a healing practice's illustration, not a postcard. Understated, plenty of breathing room.
```
