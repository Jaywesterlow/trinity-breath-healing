# Recipe — Trinity Breath & Healing, water demo (`/demo`)

A second homepage, built from scratch on 2026-10-14 so the owner can compare it with the live
one. Sector: a one-person breathwork and body-therapy practice; the visitor is someone who is
stuck and nervous, comparing on trust; the page has to make them book a free 30-minute
introduction, write, or call.

Look: **Light clinical studio** (physio / yoga, `looks.md`), the Warm studio clinic recipe
transferred to a practice that books one thing. Departures from the look are listed as
deviations.

| Layer | Choice | Rules |
| --- | --- | --- |
| Look | Light clinical studio. Departs in imagery (water, not practitioner portraits at the edges: she has no portrait set yet) and in motion class (B, not A: the owner asked for the library to be used). | SB01, SB04 |
| Surface and theme | Light page on warm sand `#f6f2ea`; one tint band `#dfeaec` (treatments); one deep band `#1e4e58` (about); two photo bands (hero, closing); footer ink `#17333a`. | C13, C22 |
| Palette | Ink `#17333a` text, ink-soft `#3f5a62` secondary; deep water `#1e4e58` is the one action hue (filled pills), sand `#f3ece0` pills on the dark bands; water `#4f8f9c` decorative only (the drawn line, focus rings). | C01, C07 |
| Type | Cormorant Garamond 700 for display, DM Sans 400/700 for everything else; Cinzel only in the wordmark. Scale: 13 eyebrow, 16 body, 18 lead, 22 h3, 32 stat, 32–48 h2, 40–72 h1 (seven steps). Caps tracked 0.08em. | T01, T07, T10, T35 |
| Spacing and grid | 8-base: 8, 16, 24, 32, 48, 64, 96, 128. Frame 1200 with 24px gutters; reading column 46ch; section padding 96 standard, 128 once (the closing). Key line = frame left. | T56, T66, T68, GF14 |
| Centring budget and mode sequence | Accent page: F C G A C A C C — hero (F, centred), statement (C, under-filled 42ch), practice row (G, three equal cards), treatments (A, 5/7 with the header on the key line), werkwijze (C header over a centred column of left-aligned steps), about (A, 7/5 mirror), closing card (C), FAQ (C). Four centred of eight, the sector's catalogue rhythm. | GA29, GD03, GD29 |
| Asymmetry and under-fill | One split, 5/7, and its mirror 7/5. Under-filled: the statement (42ch) and the werkwijze column (40rem). | GB01, GC01, GC08 |
| Radius and depth | Two radii: 16 (cards, photos) and pill. Depth is fill difference only; no shadows anywhere. | A12, C25, C26 |
| Nav | Two-zone bar, 72px, transparent over the water, gains the sand surface and one hairline at 40px; five anchor links at 16px with 32px gaps; one filled Maak een afspraak pill at 40px against the hero's 48; mobile: logo, Menu button, a sheet under the bar. | NA01, NB15, NC11, NB19 |
| Hero | Full-viewport water, centred two-line serif H1 (the locked copy), 46ch lead, filled + outlined pill, the breath badge bottom right. Scrim: flat 42% ink plus an eased gradient to 72% at the foot. | A41, I22, I23 |
| Section headers | Eyebrow 8px above the heading, heading 16px above the lead, header 48px above content. | A45, T21 |
| Cards and grids | Practice: three tinted cards. Treatments: hairline rows (name, teaser, arrow) beside a sticky 4:5 photo. | A47, A48 |
| Proof | Two figures from BRAND.stats (8+ years, 65+), tabular; no star rows, no invented quotes. | A87, A83 |
| FAQ | Yes, five closed rows in a 45rem centred column as the last section (the Dentologie pattern), hairlines, plus-icon right; the project's own research keeps FAQPage on the homepage. | FA01, FC04, FB01 |
| Footer | Ink footer, three columns (NAP, pages, legal), legal row with the build date. | A60 |
| Imagery | Four generated photographs in one grade (muted teal, sage, sand): hero stream 21:9, stones 4:5, seated figure 4:5 (no face; her own portrait replaces it), dusk lake 21:9. One ratio per role. | I05, I11, I15, A83 |
| Container breaks | Two: the hero and closing photo bands bleed; the closing card overlaps the FAQ's top edge by 80px. | A29, B01, B02 |
| Motion | Class B. See the concept below. | M01, M23 |
| Deviations | Four kinds of motion instead of three (M08): the owner asked for the library to be used generously. Motion class B instead of the sector's A, same reason. FAQ on the homepage against the sector's "no FAQ" (26 of 27): the project's SEO/AEO research outranks the look. | |
| AI-tell check | No cream-serif-terracotta: the accent is water, not clay. No centred paragraph over four lines. No middle dots (the badge uses spacing). Eyebrows only above section headings, no arrows in copy, no star rows. The generic "centred header + three cards" appears once (the practice row). | A76–A88 |

## Bewegingsconcept — water demo (praktijk, demo)

Huidige beweging: de live site is een tekenende lijntekening met fades per element en een
waaier-carrousel die met de scroll stapt.

Gekozen systeem: beeld-gedragen, rustig, klasse B (scroll-gedreven, geen pin). Foto-check:
dragen (gegenereerd, één grade).

Verhaal in vier stappen:

1. Het water stroomt echt: de bezoeker ziet stromend water en een kop die regel voor regel uit
   de regel eronder opkomt.
2. Scrollen duwt het water mee; het ademt-badge draait met de scroll en staat stil als jij
   stilstaat.
3. Elke sectie komt rustig binnen: koppen uit een masker, foto's die openklappen, de
   werkwijze-lijn die zich tekent terwijl je de drie stappen afdaalt.
4. De kaart op het stille meer: kennismaking plannen, bericht sturen, of bellen.

Signatuurmoment (één): het water in de hero. Eén foto, in WebGL door twee lagen drijvende
ruis gebroken (`water.ts`); de fase loopt op eigen tempo door en de scrollpositie wordt erbij
opgeteld, dus scrollen stuwt de stroom en loslaten laat hem terugzakken. Start pas na `load`
en een idle-moment, draait alleen in beeld, pauzeert op een verborgen tab.

Bewegingssoorten (vier, afgesproken afwijking): tekst-intree (16 kop, 03b regels uit masker),
beeld-reveal (12), scroll-scrub (water, 23 lijn, 44b badge), hover (27c magnetische knop).

Afwerking: loader geen · menu een vlak onder de balk · hover kleurwissel op pillen en rijen,
pijl 4px mee · cursor standaard.

Mobiel: het water blijft (één quad, dpr ≤ 1.5); de badge gaat uit; de reveals blijven;
offsets gaan naar nul.

Reduced motion: de stilstaande foto, alle tekst en beelden direct zichtbaar, geen scrub, geen
reveal; de pagina is compleet zonder script.

Vangrails: [x] bewegingssoorten (vier, afwijking benoemd) [x] tekst binnen 300 ms leesbaar
(koppen onder de vouw, 0,9 s uit het masker maar nooit verborgen in de HTML) [x] geen
scroll-lock [x] reduced motion volwaardig [ ] Lighthouse mobiel ≥ 90: lokaal niet betrouwbaar
te meten, CI op de preview is de maat.

Wat verandert er aan de beweging t.o.v. nu: het beeld beweegt zelf (water) in plaats van dat
een tekening zich tekent, en de secties komen uit maskers en wipes in plaats van alleen te
faden.

Library-ids: 16, 03b, 12, 23, 44b, 27c; het water is eigen (het dichtstbijzijnde in de
bibliotheek is 02b, dat een frame-reeks nodig heeft die er nog niet is).
