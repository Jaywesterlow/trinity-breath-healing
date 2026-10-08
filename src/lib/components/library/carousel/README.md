# Carousel

A curved fan of cards on a continuous, non-wrapping position line — drag to
spin it, click a side card to centre it, click the centre card to open a
detail view, or leave it alone and it ambiently drifts. One physical model
(coast → latch spring, or a slow idle drift) drives the whole thing from a
single `requestAnimationFrame` loop. Composes this folder's own
`CarouselEngine` with the already-extracted `MorphModal`/`MorphModalEngine`
(`../morph-modal/`) for the detail view that grows out of whichever card is
centred.

No external dependencies beyond Svelte 5 (runes). Every CSS custom property
the original (Trinity Breath & Healing's Behandelingen carousel) depended on
was resolved to a literal value on extraction — safe to drop into any Svelte
5 + Tailwind (or plain CSS) project without silently breaking on a `var()`
that doesn't exist there.

## Files

- `Carousel.svelte` — markup, layout, and wiring only. Deliberately dumb:
  builds the repeated render list, wires `CarouselEngine` to `MorphModal`/
  `MorphModalEngine` (opening the modal pauses idle-drift; closing it by
  ANY path resumes it), and renders the fan/controls/dots.
- `carousel-engine.svelte.ts` — `CarouselEngine`, a plain class (Svelte 5
  `$state` fields) owning drag/momentum/latch/idle-drift physics,
  click-to-jump, and slot-recycling. Construct one per usage site via
  `createCarouselEngine(options)`. Read its own class-level doc comment
  first if you're changing the physics rather than just using it — it
  explains the `positions[i]` + `offset` model and the three-phase
  `motionTick` loop in full.
- `CarouselCard.svelte` — one card's markup/CSS. Purely presentational: no
  carousel position or physics logic, just reads `--pos`/`--tilt-step`/
  `--card-width` (set by `Carousel.svelte`) via plain CSS custom properties.
- `magnetic.ts` — `use:magnetic`, a cursor-follow action for the centre
  card only (desktop, fine pointer, no reduced-motion). Copied from
  Trinity's own `src/lib/actions/magnetic.ts`, already fully generic.

## Usage

```svelte
<script lang="ts">
	import Carousel, { type CarouselItem } from '$lib/components/library/carousel/Carousel.svelte';

	const items: CarouselItem[] = [
		{ id: 'a', title: 'Item A', teaser: '…', description: '…', image: '/a.svg', href: '/a' },
		{ id: 'b', title: 'Item B', teaser: '…', description: '…', image: null, number: 2, href: '/b' }
	];
</script>

<Carousel {items} eyebrow="Services" heading="Pick a treatment" />
```

That's it — `Carousel.svelte` owns constructing both engines, wiring them
together, and cleaning up on unmount. There's no separate engine setup to
wire yourself, unlike `MorphModal` used standalone.

## `CarouselItem`

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Unique key; also the modal's own item id. |
| `title` | yes | Card title + modal title. |
| `teaser` | yes | Shown on the card on hover. |
| `description` | yes | Shown in the modal's own body — can be longer than `teaser`. |
| `image` | yes (nullable) | Pass `null` + `number` for a numbered-item fallback (no artwork yet). |
| `number` | no | Only rendered when `image` is `null`. |
| `href` | yes | Card + modal CTA link. |
| `ctaLabel` | no | Accessible name for the card's corner arrow; modal CTA defaults to "Learn more". |
| `tags` / `tagsLabel` | no | Modal-only: a short bullet list under `tagsLabel`. |

## `Carousel.svelte` props

| Prop | Required | Notes |
|---|---|---|
| `items` | yes | `CarouselItem[]` — fixed for the component's lifetime; the engines size their slot math from `items.length` once at construction, so don't hand this a reactive/changing array. |
| `eyebrow` / `heading` | no | Section header text; the header is skipped entirely if both are omitted. |
| `footnote` | no | Modal-only footer note (disclaimers, fine print). |
| `prevLabel` / `nextLabel` | no | Default `'Previous'` / `'Next'` — used for both the carousel's own buttons and the modal's Prev/Next. |
| `groupLabel` | no | Accessible name for the carousel's `role="group"`. Default `'Carousel'`. |
| `modalCloseLabel` | no | Default `'Close'`. |

English-only strings with English defaults — override per usage; there's no
i18n system built in.

## `CarouselEngineOptions` (only needed if you use `CarouselEngine` directly)

| Field | Required | Notes |
|---|---|---|
| `itemCount` | yes | Fixed at construction; drives `repeats`/`count` (the padded, recyclable render list size). |
| `visibleSlotMax` | no | How many slots are visible at once, symmetric around the centre. Default `2` (five cards: `0, ±1, ±2`). |
| `onCentreCardClick` | no | `(e, index) => void` — fires when the CENTRE card is clicked with a real pointer click (not keyboard, not a drag's trailing click). Every other card centres itself instead; this is the one thing the engine hands back to you. Call `e.preventDefault()` if you don't want the card's own `href` to navigate. |

## Known constraints / things to check when reusing

- **CSS class names are load-bearing**, in two places: `CarouselEngine`'s
  `#measurePxPerStep`/`#getCardBandY` query `.carousel__pivot`/
  `.carousel__wrap`/`.carousel__controls` off `fanEl` directly, and
  `magnetic.ts` reads/writes `--carousel-card-transition-duration` on the
  card element. Renaming any of these in `Carousel.svelte`/
  `CarouselCard.svelte` needs the matching update on the engine/action side.
- **Colors/fonts/spacing are literal values**, not tokens — search for
  `/* was var(--` comments in `Carousel.svelte`'s and `CarouselCard.svelte`'s
  `<style>` blocks to find and swap every one for your own design system.
- **Re-measure the fan's fixed geometry for your own card art.** `.carousel`
  `height`, `--card-width`, `--pivot-baseline`, `--pivot-distance`, and
  `--tilt-step` (mobile + the `min-width: 1024px` breakpoint) don't derive
  from each other automatically — they were tuned for Trinity's own
  282:459 card art and need re-tuning for different card proportions or
  breakpoints.
- **Idle-drift timing is owner-tuned, not a sensible default** —
  `IDLE_DRIFT_DELAY_MS` (2000ms) and `DRIFT_SECONDS_PER_STEP` (6.4s) in
  `carousel-engine.svelte.ts` match Trinity's own live carousel as of this
  extraction; adjust freely, they're independent, in-place constants.
- **Reduced motion** skips the magnet, the idle drift never starts
  (`scheduleIdleDrift` checks it before calling `#beginDrift`), and the
  modal jumps straight to its end state — don't remove those checks without
  re-adding an equivalent.
- **`items` must not change after mount.** Both engines size their internal
  slot/index arithmetic from `items.length` once, at construction — this
  component isn't built to resize its item list reactively.
- Verified via a standalone Playwright harness on extraction (drag,
  momentum coast → latch, click-to-jump, Prev/Next, idle-drift timing and
  direction, idle-drift pause-on-modal-open / resume-on-modal-close via
  `onClosed`, modal open/Next/Esc-close, reduced-motion instant open,
  magnetic hover, keyboard focus). No automated test suite ships in this
  folder; re-verify similarly if you make non-trivial changes.
