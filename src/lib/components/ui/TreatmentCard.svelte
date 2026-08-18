<script lang="ts">
	/**
	 * The one place these cards' size/padding/layout is defined. Used
	 * identically for all 5 Behandelingen cards — no per-item branching in
	 * this file at all, so nothing here can drift out of sync between cards
	 * the way two separate template branches (a plain card vs. a link card)
	 * previously could.
	 *
	 * Purely presentational: knows nothing about carousel position. The
	 * carousel (Behandelingen.svelte) owns where this card sits — cards
	 * never resize or overlap, at any position or breakpoint, on purpose,
	 * so there's nothing here to inherit for that.
	 *
	 * The card root is now the `<a>` itself (not a wrapped stretched-link
	 * pseudo-element) — see the arrow's own comment below for why that
	 * simplification is safe here (260809-hov). `magnetic`/`dragging` are
	 * the one addition in that same spirit-only-not-practice sense as
	 * `cardNumber`: opaque flags the carousel hands down, not position
	 * knowledge this component computes itself (see use:magnetic below and
	 * its own file for what they drive).
	 */
	import { magnetic } from '$lib/actions/magnetic';

	interface Props {
		/** Service name — shown as the visible bottom title. */
		label: string;
		icon?: string | null;
		/** Shown in the icon slot instead of art when `icon` is null (260810-mdl) — driven by
		 * absence from Behandelingen.svelte's ICONS map, not a flag, so dropping art in later
		 * makes the number disappear on its own. Real text content, not a background image or
		 * CSS `content:`, so it stays readable to AI crawlers — but `aria-label` above is
		 * already this card's one accessible name, so the number itself is `aria-hidden` to
		 * avoid announcing it twice. */
		number?: number;
		/** Where the corner button goes. Accessible name only for now — the
		 * arrow itself carries no visible text (not final copy either way). */
		buttonLabel: string;
		buttonHref: string;
		/** Placeholder copy shown on hover (260809-hov) — see brand.ts for why
		 * it's real Dutch-shaped placeholder text, not lorem ipsum. Always in
		 * the DOM (never conditionally rendered) so AI crawlers can read it
		 * regardless of hover state — hidden purely via opacity/transform. */
		description: string;
		/** Whether THIS card runs the magnetic cursor-follow. Every VISIBLE
		 * card gets true (f1ff682 — the cards are all clickable, they just do
		 * different things, so they should all feel the same); off-screen
		 * slots stay false so they don't each hold a window listener. See the
		 * magnetic action's own file header for the rest of the contract
		 * (touch/reduced-motion/drag gating). */
		magnetic?: boolean;
		/** Whether the carousel fan itself is currently being dragged — the
		 * magnet must release immediately when this is true. */
		dragging?: boolean;
		/** Click on the card root. The carousel decides what a click MEANS
		 * (centre this card vs. follow its link) — this component just reports
		 * that one happened, staying position-unaware like the rest of it.
		 * Replaces the .treatments__jump overlay, which covered the card and
		 * so blocked :hover from ever reaching it. */
		onCardClick?: (e: MouseEvent) => void;
		/** True for the repeated copies the carousel renders so its loop has
		 * off-screen slots to recycle through. Visually identical, but taken out
		 * of the accessibility tree and the tab order so each service is
		 * announced and reachable exactly once. */
		duplicate?: boolean;
	}

	let {
		label,
		icon = null,
		number,
		buttonLabel,
		buttonHref,
		description,
		magnetic: isMagnetic = false,
		dragging = false,
		onCardClick,
		duplicate = false
	}: Props = $props();
</script>

<a
	href={buttonHref}
	class="tcard"
	aria-label={`${buttonLabel} over ${label}`}
	draggable="false"
	aria-hidden={duplicate ? 'true' : undefined}
	tabindex={duplicate ? -1 : undefined}
	onclick={onCardClick}
	use:magnetic={{ enabled: isMagnetic, dragging }}
>
	<div class="tcard__icon-wrap">
		{#if icon}
			<img src={icon} alt="" aria-hidden="true" class="tcard__icon" draggable="false" />
		{:else if number}
			<span class="tcard__number" aria-hidden="true">{number}</span>
		{/if}
	</div>

	<!-- Title row and description share one bottom-anchored column so the
	     description's own height is what lifts the title, rather than a
	     fixed distance guessed per breakpoint — see .tcard__desc-wrap. -->
	<div class="tcard__footer">
		<div class="tcard__bottom">
			<p class="tcard__title">{label}</p>

			<!-- Decorative only — the whole card above is now the single <a>, so
			     this no longer needs to be its own link or carry a stretched-link
			     pseudo-element (simplification of what shipped in 7c557ae: with no
			     second link inside the card there's no nested-link problem left to
			     solve). aria-hidden since it adds no information beyond the card's
			     own accessible name. -->
			<span class="tcard__arrow" aria-hidden="true">
				<svg width="14" height="14" viewBox="0 0 22 22" fill="none" aria-hidden="true">
					<path
						d="M5 17L17 5M17 5H9M17 5V13"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</span>
		</div>

		<!-- Always in the DOM, collapsed to zero height rather than removed —
		     never {#if hovered}. Conditionally-rendered content is invisible
		     to AI crawlers, and this project is judged first on AEO. -->
		<div class="tcard__desc-wrap">
			<p class="tcard__description">{description}</p>
		</div>
	</div>
</a>

<style>
	.tcard {
		display: grid;
		grid-template-rows: 1fr auto;
		justify-items: center;
		position: relative;
		width: var(--card-width, 6.5rem);
		aspect-ratio: 282 / 459;
		padding: var(--space-3); /* consistent on all 4 sides */
		border-radius: var(--radius-lg);
		background: var(--color-fg-forest);
		color: var(--color-bg-sand);
		text-decoration: none;
		cursor: pointer;
		--tcard-scale: 1;
		/* The reveal (icon fade-out, title/arrow slide-up, description
		   fade-in) runs at half the speed of the site's base motion token —
		   a direct owner request after seeing 250ms live. Kept as one local
		   token rather than three literals so the three properties can never
		   drift apart and stop reading as a single movement. */
		--tcard-reveal-duration: 500ms;
		--magnet-x: 0px;
		--magnet-y: 0px;
		/* Magnet (translate) and hover scale share this one property, composed
		   rather than one clobbering the other — translate first, then scale,
		   so the magnet offset itself isn't also scaled up by --tcard-scale. The
		   use:magnetic action only ever writes --magnet-x/y (and, while
		   actively tracking, --tcard-transition-duration) — see that action's
		   own file for why. */
		/* The magnet offset is computed in SCREEN space (cursor position minus
		   the card's own rect centre), but this element sits inside
		   .treatments__pivot, which is rotated by --pos * --tilt-step. A plain
		   translate here would therefore be applied in the pivot's rotated
		   frame and pull the card off-axis — at --tilt-step: 14deg the ±2 cards
		   sit at 28deg, so a pull toward the cursor would visibly miss it.
		   Sandwiching the translate between the inverse rotation and the
		   rotation cancels the parent's frame for that one step only:
		   R(θ)·[R(-θ)·T·R(θ)·S] = T·R(θ)·S — the card still rotates and scales
		   exactly as before, and the translate lands in screen space.
		   Both custom properties inherit down from the pivot. */
		transform: rotate(calc(-1 * var(--pos, 0) * var(--tilt-step, 0deg)))
			translate(var(--magnet-x), var(--magnet-y))
			rotate(calc(var(--pos, 0) * var(--tilt-step, 0deg))) scale(var(--tcard-scale));
		/* --motion-fast (150ms), not --motion-base: this one transition covers
		   BOTH the magnet translate and the hover scale, because they share
		   this single transform property. It has to be short enough that the
		   magnet still reads as following the cursor. The magnetic action
		   overrides --tcard-transition-duration to the same 150ms while
		   actively tracking (it used to override it to 0s, which silently
		   removed the scale's animation entirely). */
		transition: transform var(--tcard-transition-duration, var(--motion-fast)) var(--ease-out);
	}

	.tcard__icon-wrap {
		grid-row: 1;
		/* Deliberately NOT align-self: center (removed — see own history):
		   that gave this element an indefinite (shrink-to-fit) height, so
		   .tcard__icon's own height: 100% below had nothing definite to
		   resolve against and the wrap ended up shorter than its actual
		   grid row, unevenly — the shortfall landed almost entirely below
		   the wrap rather than split top/bottom. Most icons are tall/narrow
		   enough that the gap was barely visible, but Goldhealing's wide,
		   short sun art made it obvious: the icon visibly sat high, with a
		   big gap to the title below and almost none above. Grid's own
		   default (align-self: stretch, i.e. no override at all) instead
		   makes this element fill the ENTIRE row — confirmed via
		   getBoundingClientRect() to land with zero px of slack above or
		   below — which gives .tcard__icon a real, definite height to
		   resolve 100% against, so object-fit: contain's own default
		   centering (object-position: 50% 50%) actually has the full,
		   correct space to centre within. */
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		/* Lets this row actually give up height as the description below
		   expands into it — a grid item's automatic minimum size would
		   otherwise floor it at the icon's own height and force the card to
		   overflow instead. The icon is fading to nothing across the same
		   duration, so the give is not visible. */
		min-height: 0;
		transition: opacity var(--tcard-reveal-duration) var(--ease-out);
	}

	.tcard__icon {
		/* ~75% bigger than the icon's original 65% — the source art has a lot
		   of built-in padding, so this is close to the practical ceiling
		   before it starts crowding the title/arrow row below it. */
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	/* Stand-in for missing art (260810-mdl) — the display font at roughly the
	   size the icon art occupies, so a numbered card reads at the same visual
	   weight as an illustrated one rather than looking like an error state. */
	.tcard__number {
		font-family: var(--font-display);
		font-size: clamp(2rem, 8vw, 2.75rem);
		font-weight: var(--font-weight-medium);
		line-height: 1;
	}

	/* Bottom-anchored column holding the title row and the collapsible
	   description. Occupies grid row 2, so at rest — with the description
	   collapsed to zero height — the card's layout is byte-for-byte what it
	   was before this element existed. */
	.tcard__footer {
		grid-row: 2;
		width: 100%;
	}

	.tcard__bottom {
		display: flex;
		align-items: center;
		/* Mobile: the arrow is gone (display: none below), so this row's only
		   child is the title — centre it in the space the arrow left behind.
		   Desktop restores the original title-left/arrow-right split, once
		   the arrow is back. */
		justify-content: center;
		gap: var(--space-2);
		width: 100%;
	}

	.tcard__title {
		margin: 0;
		font-family: var(--font-body);
		font-size: var(--fs-body-xs);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-tight);
	}

	/* Removed on mobile entirely (owner request) — not just its circle, the
	   whole element. Every other property this needs (size, centring, the
	   circle) only ever applied on top of that visibility, so they live
	   entirely in the 1024px breakpoint below now instead of splitting
	   "shown, no circle" here and "circle added" there. */
	.tcard__arrow {
		display: none;
	}

	/* The description's OWN height is what lifts the title row, replacing a
	   fixed --tcard-desc-shift translate that had to be guessed per
	   breakpoint and was wrong for every card whose copy ran to a different
	   number of lines (the taller ones ended up with the title sitting on
	   top of the text instead of above it). This wrapper animates its grid
	   row from 0fr to 1fr, and 1fr resolves to exactly the description's
	   content height — so the title always lands directly on top of the
	   description, one line or four, with nothing to measure or re-tune per
	   card.

	   Collapsed via grid-template-rows rather than display:none or
	   height:auto: the text stays real, readable DOM content at all times
	   including at rest (display:none would hide it from crawlers, and this
	   project is judged first on AEO), and 0fr->1fr is animatable where
	   height:auto is not. */
	.tcard__desc-wrap {
		display: grid;
		grid-template-rows: 0fr;
		/* The title-to-description gap lives here rather than as padding on
		   the description itself: padding cannot collapse below its own size
		   (border-box floors the element at 8px even with min-height: 0), so
		   putting it there left the row 8px tall at rest and lifted the
		   resting title 8px off the card's bottom edge. As a margin that is
		   0 until hover it costs nothing at rest, and transitions on the
		   same duration/easing as the row so the two still read as one
		   movement. */
		margin-top: 0;
		transition:
			grid-template-rows var(--tcard-reveal-duration) var(--ease-out),
			margin-top var(--tcard-reveal-duration) var(--ease-out);
	}

	.tcard__description {
		/* Defeats the automatic minimum size of a grid item, which would
		   otherwise refuse to shrink below the text's own height and leave
		   the row permanently open. */
		min-height: 0;
		overflow: hidden;
		margin: 0;
		font-family: var(--font-body);
		font-size: var(--fs-body-xs);
		line-height: var(--line-height-tight);
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--tcard-reveal-duration) var(--ease-out);
	}

	/* Whole hover reveal gated behind (hover: hover) and (pointer: fine) —
	   touch keeps exactly what it has today: icon, title, arrow, no
	   description, no scale. :focus-visible mirrors :hover throughout so
	   the reveal is reachable by keyboard, not just a mouse. One shared
	   motion token (--motion-base/--ease-out) across every property here —
	   and on .tcard__icon-wrap/.tcard__bottom above — so it reads as one
	   movement, not four unrelated ones. */
	@media (hover: hover) and (pointer: fine) {
		.tcard:hover .tcard__icon-wrap,
		.tcard:focus-visible .tcard__icon-wrap {
			opacity: 0;
		}

		.tcard:hover .tcard__desc-wrap,
		.tcard:focus-visible .tcard__desc-wrap {
			grid-template-rows: 1fr;
			margin-top: var(--space-2);
		}

		.tcard:hover .tcard__description,
		.tcard:focus-visible .tcard__description {
			opacity: 1;
		}

		/* Scale is deliberately its own, narrower media query (adds
		   prefers-reduced-motion: no-preference on top of hover/pointer) —
		   the owner asked for NO scale at all under reduced motion, whereas
		   the fade/slide above may stay, just instant (the site-wide
		   reduced-motion override in app.css already forces near-0
		   transition durations globally, so nothing extra is needed here
		   for that). */
		@media (prefers-reduced-motion: no-preference) {
			.tcard:hover,
			.tcard:focus-visible {
				--tcard-scale: 1.025;
			}
		}
	}

	@media (min-width: 1024px) {
		.tcard__bottom {
			/* Arrow is back at this breakpoint — restore the original
			   title-left/arrow-right split the mobile-only centring above
			   replaced. */
			justify-content: space-between;
		}

		.tcard__arrow {
			/* Only ever shown here — see its own display: none above. Sized
			   ~50% bigger than the old mobile 1.5rem (2.625rem); tap target
			   and glyph (the svg rule below) scale together so the arrow's
			   proportions inside the circle hold. */
			display: flex;
			flex-shrink: 0;
			align-items: center;
			justify-content: center;
			width: 2.625rem;
			height: 2.625rem;
			border-radius: var(--radius-full);
			border: 1px solid currentColor;
		}

		.tcard__arrow svg {
			/* Scaled by the same ~1.5x as the arrow circle above (14px ->
			   21px) so the glyph keeps the same visual proportion inside its
			   circle. Overrides the width/height attributes set in the
			   markup (still 14x14, since this component has no
			   breakpoint-awareness of its own to size them from). */
			width: 21px;
			height: 21px;
		}

		.tcard__title {
			font-size: var(--fs-body-sm);
		}

		.tcard__description {
			font-size: var(--fs-body-sm);
		}

		.tcard__number {
			font-size: clamp(3rem, 5vw, 4.5rem);
		}
	}
</style>
