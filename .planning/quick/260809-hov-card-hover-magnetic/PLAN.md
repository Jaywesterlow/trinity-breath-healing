---
id: 260809-hov
slug: card-hover-magnetic
date: 2026-08-09
type: quick
mode: default
components:
  - src/lib/components/ui/TreatmentCard.svelte
  - src/lib/components/global/Behandelingen.svelte
---

# Treatment card — new layout, hover reveal, magnetic cursor follow

Owner's idea, in their words, restated and confirmed back to them:

> Resting: icon centred, title bottom-left, circle-with-right-arrow bottom-right on the same
> line as the title. On hover: title and arrow slide up together, the centre icon fades out,
> description text fades in below them. Card scales 1.1. The card also sticks slightly to the
> cursor — stays flat, no tilt. Cursor at card centre = card at rest. Cursor moves down = card
> moves down. Cursor too far away = snap back and the hover reverts.

**Speed matters more than polish here.** The owner has twice called out over-verification on
small work. Build it, push it, let the Vercel preview be the test. Do NOT build a measurement
harness for this. The one thing worth actually checking in a browser is the clipping question
in task 4 — that is a real geometry risk, not ceremony.

---

## Decisions already made — do not re-open, do not ask

- **The arrow is no longer a link.** Today `.tcard__button` is an `<a>` in the top-right corner
  carrying a stretched-link `::after`. That whole arrangement goes. The new bottom-right arrow
  circle is decorative (`aria-hidden`), and **the card itself becomes the `<a>`**. With no
  second link inside it there is no nested-link problem, so no pseudo-element trick is needed
  any more — this is a simplification of what shipped in `7c557ae`.
- **Magnetic applies to the centre card only.** The ±1 cards are rotated around the fan pivot,
  so a translate inside them travels along rotated axes and "down" would not be screen-down.
  The centre card is also the only one that navigates. Gate on `positions[i] === 0`.
- **Mobile keeps exactly what it has now.** Gate the whole hover treatment behind
  `@media (hover: hover) and (pointer: fine)`. On touch: icon, title, arrow, no description, no
  magnet, no scale. Tapping still opens the page.
- **Description text is always in the DOM**, hidden with `opacity`/`transform`. Never
  `{#if hovered}`. Conditionally-rendered content is invisible to AI crawlers and this project
  is judged first on AEO. Non-negotiable.
- **`:focus-visible` mirrors `:hover`** for the whole reveal. Hover-only content is unreachable
  by keyboard.
- **`prefers-reduced-motion`**: no magnet, no scale. The fade/slide may stay but instant.
  Check the existing guarded pattern in `src/lib/actions/reveal.ts` and match it.
- **Copy is placeholder.** No description text exists for these treatments and it is not ours
  to invent — this is a real practitioner's health/wellness site whose primary metric is E-E-A-T
  trust. Add a `description` field to `BRAND.services` in `src/lib/constants/brand.ts` with a
  clearly-marked placeholder, prefixed `TODO_` so `npm run audit:placeholders` flags it, in the
  same spirit as the existing `TODO_PHONE`. Short Dutch sentence shape so the layout is real.
  The 'Meer diensten' card needs one too.
- **Do NOT revert the TESTKAART diagnostic cards.** They stay. Cards will show numbers instead
  of icons while this is reviewed; that is expected and fine.

---

## Task 1 — restructure `TreatmentCard.svelte`

New internal layout, resting state:

- icon (or, today, the TESTKAART number) centred in the card
- bottom row: title left, decorative arrow circle right, baseline-aligned with each other
- description below the bottom row, present but hidden

The card root becomes `<a href={buttonHref}>` carrying the existing accessible name pattern
(`{buttonLabel} over {label}`). Keep `draggable="false"` on it — `e361ffb` added that because
Chromium's native link-drag was swallowing drags that start on a card, and that bug will come
straight back if the attribute is dropped during this restructure.

Keep the component presentational and position-unaware. Its header comment insists on this and
it has held up well. The parent already passes `cardNumber`; add `description` the same way.

## Task 2 — the hover reveal (pure CSS)

On `:hover` / `:focus-visible`, inside the `(hover: hover)` media query:

- title + arrow circle translate up by the description's height
- centre icon fades to `opacity: 0`
- description fades in
- card scales `1.1`

One shared transition duration/easing so it reads as one movement, not four. Reuse an existing
motion token from `app.css` rather than inventing a duration.

No JS for any of this.

## Task 3 — the magnetic follow (JS, centre card only)

The well-known "magnetic button" pattern. Translate only — **no rotation, no perspective, no
tilt.** The owner was explicit that the card stays flat.

```
on pointermove (throttled to rAF):
  dx = cursorX - cardCentreX
  dy = cursorY - cardCentreY
  distance = hypot(dx, dy)
  if distance > MAGNET_RADIUS:  translate back to 0,0
  else:                          translate by dx * MAGNET_STRENGTH, dy * MAGNET_STRENGTH
```

Two named constants, commented with what they do so the owner can tune them the way they tuned
the spring constants:

- `MAGNET_STRENGTH = 0.15` — fraction of the cursor's offset the card follows. 0.1 is subtle,
  0.3 is very sticky.
- `MAGNET_RADIUS` — distance in px beyond which the card releases. Start around 1.5x the card's
  half-diagonal so it engages a little before the cursor arrives.

Requirements:

- **Off during a drag.** The `dragging` flag already exists. A magnet fighting a drag would be
  a real bug.
- **Off under `prefers-reduced-motion`.**
- **Off on touch** (it is inside the hover media query's remit — make sure the listener does not
  even attach).
- rAF-throttle the pointermove, matching what `onWindowPointerMove` already does in this file
  and for the same reason (pointer events outrun the display).
- Release must animate back, not snap — a CSS transition on the transform, disabled while
  actively tracking so it does not lag the cursor. This is the standard shape of this effect;
  follow the reference implementations.
- The magnetic translate and the `1.1` scale share one `transform`. Compose them in the right
  order (`translate` then `scale`) and do not let one clobber the other.

Reference implementations (same maths, different framework — write it in plain Svelte, no new
dependency, GSAP is NOT going into this project):
- https://blog.olivierlarose.com/tutorials/magnetic-button
- https://en.inithtml.com/resources/magnetic-hover-effect-creating-cursor-attracted-buttons-with-vanilla-javascript/

## Task 4 — the clipping check (the one real risk)

`.treatments__fan` has `overflow: hidden`, and its height plus `--pivot-distance` were tuned
against measured bounding boxes on the explicit assumption that **cards never resize**. A 1.1x
card plus a magnetic offset breaks that assumption.

Load the built page in a real browser at 1440x900, hover the centre card, and confirm it does
not clip at the fan's top or bottom edge.

If it does clip: **raise `.treatments__fan`'s height, do not shrink the card.** Per
`a0c0472`, extra fan height costs nothing visible — `.treatments__controls`' negative
`margin-top` absorbs it — so this is a cheap fix. Do not touch `--pivot-distance`,
`--pivot-baseline`, `--card-width` or `--tilt-step`; those are tuned and the owner has
reviewed them.

---

## Definition of done

- `npm run check` 0 errors (1 pre-existing `AboutStat` warning is expected).
- `npm run build` clean.
- Prettier on every changed file **before** committing.
- Commits split by concern: layout restructure / hover reveal / magnet / any clipping fix.
- **Pushed.** The owner cannot run a dev server; they review on Vercel previews from a phone.
- SUMMARY.md next to this plan, plus a `.planning/STATE.md` "Quick Tasks Completed" row.

Do **not** run the `behandelingen-*` Playwright specs as a gate. Six of them fail on this
machine for environmental reasons unrelated to any code change — see
`.planning/notes/KNOWN-ISSUES.md`, last section, for the bisect. Running them will only produce
noise. `check` + `build` + the browser look in task 4 is the whole verification budget.
