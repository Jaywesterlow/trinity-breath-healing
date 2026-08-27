<script lang="ts">
	/**
	 * One card in the carousel — size/padding/layout/hover-reveal defined
	 * once here, used identically for every card regardless of position.
	 * Purely presentational: knows nothing about carousel position or
	 * physics — the parent (Carousel.svelte) sets `--pos`/`--tilt-step`/
	 * `--card-width` on this card's own pivot ancestor, and this file just
	 * reads them (with safe fallbacks) via plain CSS custom properties.
	 *
	 * Extracted from Trinity Breath & Healing's TreatmentCard.svelte. Every
	 * global design-token CSS variable it depended on is resolved to a
	 * literal value below (each annotated with its original token name) —
	 * paste this into any project without breaking on a var() that doesn't
	 * resolve to anything. `--pos`/`--tilt-step`/`--card-width`/`--magnet-x`/
	 * `--magnet-y` are NOT resolved — those are set by the parent carousel
	 * itself (see Carousel.svelte's own `.carousel__pivot` and the
	 * `use:magnetic` action), not global tokens.
	 */
	import { magnetic } from './magnetic';

	interface Props {
		/** Card title, shown at the bottom and used for the accessible name. */
		label: string;
		image?: string | null;
		/** Shown in the image slot instead of art when `image` is null —
		 * driven by absence of art, not a flag, so dropping an image in
		 * later makes the number disappear on its own. */
		number?: number;
		/** Accessible name for the corner arrow / whole-card link — the
		 * arrow itself carries no visible text. */
		ctaLabel: string;
		href: string;
		/** Shown on hover — always in the DOM (never conditionally
		 * rendered), collapsed to zero height rather than removed, so it
		 * stays readable to crawlers and JS-off visitors regardless of
		 * hover state. Any length: the title row is lifted by this text's
		 * own rendered height, so it always sits directly above it. */
		description: string;
		/** Whether THIS card runs the magnetic cursor-follow (only the
		 * centre/visible cards should, so off-screen slots don't each hold
		 * a window listener). */
		magnetic?: boolean;
		/** Whether the carousel fan itself is currently being dragged — the
		 * magnet must release immediately when true. */
		dragging?: boolean;
		/** Click on the card root — the carousel decides what a click
		 * MEANS (centre this card vs. follow its link); this component
		 * just reports that one happened. */
		onCardClick?: (e: MouseEvent) => void;
		/** True for the repeated copies the carousel renders so its loop
		 * has off-screen slots to recycle through. Visually identical, but
		 * taken out of the accessibility tree and tab order so each real
		 * item is announced and reachable exactly once. */
		duplicate?: boolean;
	}

	let {
		label,
		image = null,
		number,
		ctaLabel,
		href,
		description,
		magnetic: isMagnetic = false,
		dragging = false,
		onCardClick,
		duplicate = false
	}: Props = $props();
</script>

<a
	{href}
	class="carousel-card"
	aria-label={`${ctaLabel} over ${label}`}
	draggable="false"
	aria-hidden={duplicate ? 'true' : undefined}
	tabindex={duplicate ? -1 : undefined}
	onclick={onCardClick}
	use:magnetic={{ enabled: isMagnetic, dragging }}
>
	<div class="carousel-card__image-wrap">
		{#if image}
			<img src={image} alt="" aria-hidden="true" class="carousel-card__image" draggable="false" />
		{:else if number}
			<span class="carousel-card__number" aria-hidden="true">{number}</span>
		{/if}
	</div>

	<!-- Title row and description share one bottom-anchored column so the
	     description's own height is what lifts the title, rather than a
	     fixed distance guessed per breakpoint — see __desc-wrap below. -->
	<div class="carousel-card__footer">
		<div class="carousel-card__bottom">
			<p class="carousel-card__title">{label}</p>

			<!-- Decorative only — the whole card above is the single <a>, so
			     this carries no functionality of its own. -->
			<span class="carousel-card__arrow" aria-hidden="true">
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

		<!-- Always in the DOM, collapsed to zero height rather than removed,
		     so it stays real, crawlable content at rest. -->
		<div class="carousel-card__desc-wrap">
			<p class="carousel-card__description">{description}</p>
		</div>
	</div>
</a>

<style>
	.carousel-card {
		display: grid;
		grid-template-rows: 1fr auto;
		justify-items: center;
		position: relative;
		width: var(--card-width, 6.5rem);
		aspect-ratio: 282 / 459;
		padding: 0.75rem; /* was var(--space-3) */
		border-radius: 1rem; /* was var(--radius-lg) */
		background: #3d4a35; /* was var(--color-fg-forest) */
		color: #faf0e6; /* was var(--color-bg-sand) */
		text-decoration: none;
		cursor: pointer;
		--carousel-card-scale: 1;
		/* One local token so the icon fade / title-arrow slide / description
		   fade below can never drift apart and stop reading as one movement. */
		--carousel-card-reveal-duration: 500ms;
		--magnet-x: 0px;
		--magnet-y: 0px;
		/* Magnet (translate) and hover scale share this one property,
		   composed rather than one clobbering the other — translate first,
		   then scale, so the magnet offset itself isn't also scaled up.
		   The magnet's own screen-space offset is computed against this
		   card's rotated parent (--pos * --tilt-step, set by the carousel
		   on its pivot ancestor) — sandwiching the translate between the
		   inverse rotation and the rotation cancels that parent frame for
		   just this one step, landing the translate in screen space:
		   R(θ)·[R(-θ)·T·R(θ)·S] = T·R(θ)·S. */
		transform: rotate(calc(-1 * var(--pos, 0) * var(--tilt-step, 0deg)))
			translate(var(--magnet-x), var(--magnet-y))
			rotate(calc(var(--pos, 0) * var(--tilt-step, 0deg))) scale(var(--carousel-card-scale));
		/* Short enough that the magnet still reads as following the cursor
		   — this one transition covers both the magnet translate and the
		   hover scale, since they share this single transform property.
		   The magnetic action overrides --carousel-card-transition-duration
		   to the same duration while actively tracking. */
		transition: transform var(--carousel-card-transition-duration, 150ms)
			cubic-bezier(0.16, 1, 0.3, 1); /* 150ms was var(--motion-fast); ease was var(--ease-out) */
	}

	.carousel-card__image-wrap {
		grid-row: 1;
		/* Deliberately NOT align-self: center — that gives this element an
		   indefinite (shrink-to-fit) height, so the image's own height:
		   100% below has nothing definite to resolve against, and any
		   wide/short art ends up visibly off-centre. Grid's own default
		   (stretch) fills the entire row instead, giving the image a real,
		   definite height so object-fit: contain's centering actually has
		   the full, correct space to centre within. */
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		/* Lets this row give up height as the description expands into it —
		   a grid item's automatic minimum size would otherwise floor it at
		   the image's own height. The image is fading out across the same
		   duration, so the give is not visible. */
		min-height: 0;
		transition: opacity var(--carousel-card-reveal-duration) cubic-bezier(0.16, 1, 0.3, 1); /* ease was var(--ease-out) */
	}

	.carousel-card__image {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	/* Stand-in for missing art — the display font at roughly the size the
	   image occupies, so a numbered card reads at the same visual weight
	   as an illustrated one rather than looking like an error state. */
	.carousel-card__number {
		font-family: 'Cormorant Garamond', Georgia, serif; /* was var(--font-display) */
		font-size: clamp(2rem, 8vw, 2.75rem);
		font-weight: 500; /* was var(--font-weight-medium) */
		line-height: 1;
	}

	/* Bottom-anchored column holding the title row and the collapsible
	   description. At rest — description collapsed to zero — the card's
	   layout is identical to what it was before this element existed. */
	.carousel-card__footer {
		grid-row: 2;
		width: 100%;
	}

	.carousel-card__bottom {
		display: flex;
		align-items: center;
		/* Mobile: the arrow is gone (display: none below), so this row's
		   only child is the title — centre it in the space the arrow left
		   behind. Desktop restores the title-left/arrow-right split. */
		justify-content: center;
		gap: 0.5rem; /* was var(--space-2) */
		width: 100%;
	}

	.carousel-card__title {
		margin: 0;
		font-family: 'DM Sans', system-ui, sans-serif; /* was var(--font-body) */
		font-size: clamp(0.75rem, 0.662rem + 0.376vw, 1rem); /* was var(--fs-body-xs) */
		font-weight: 500; /* was var(--font-weight-medium) */
		line-height: 1.2; /* was var(--line-height-tight) */
	}

	/* Removed on mobile entirely, not just its circle — every other
	   property this needs only ever applies on top of that visibility, so
	   they all live in the breakpoint below instead. */
	.carousel-card__arrow {
		display: none;
	}

	/* The description's OWN height is what lifts the title row, replacing a
	   fixed --carousel-card-desc-shift translate that had to be guessed per
	   breakpoint and was wrong for any card whose copy ran to a different
	   number of lines. This wrapper animates its grid row from 0fr to 1fr,
	   and 1fr resolves to exactly the description's content height, so the
	   title always lands directly on top of the description — one line or
	   four, nothing to measure or re-tune per card.

	   Collapsed via grid-template-rows rather than display:none or
	   height:auto: the text stays real, readable DOM content at all times
	   including at rest, and 0fr->1fr is animatable where height:auto is
	   not. */
	.carousel-card__desc-wrap {
		display: grid;
		grid-template-rows: 0fr;
		/* The title-to-description gap lives here rather than as padding on
		   the description: padding cannot collapse below its own size, so
		   there it would leave the row 8px tall at rest and lift the resting
		   title off the card's bottom edge. As a margin that is 0 until
		   hover it costs nothing at rest. */
		margin-top: 0;
		transition:
			grid-template-rows var(--carousel-card-reveal-duration) cubic-bezier(0.16, 1, 0.3, 1),
			margin-top var(--carousel-card-reveal-duration) cubic-bezier(0.16, 1, 0.3, 1); /* ease was var(--ease-out) */
	}

	.carousel-card__description {
		/* Defeats a grid item's automatic minimum size, which would
		   otherwise refuse to shrink below the text's own height. */
		min-height: 0;
		overflow: hidden;
		margin: 0;
		font-family: 'DM Sans', system-ui, sans-serif; /* was var(--font-body) */
		font-size: clamp(0.75rem, 0.662rem + 0.376vw, 1rem); /* was var(--fs-body-xs) */
		line-height: 1.2; /* was var(--line-height-tight) */
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--carousel-card-reveal-duration) cubic-bezier(0.16, 1, 0.3, 1); /* ease was var(--ease-out) */
	}

	/* Hover reveal gated behind (hover: hover) and (pointer: fine) — touch
	   keeps exactly what it has by default: image, title, arrow, no
	   description, no scale. :focus-visible mirrors :hover so the reveal
	   is reachable by keyboard too. */
	@media (hover: hover) and (pointer: fine) {
		.carousel-card:hover .carousel-card__image-wrap,
		.carousel-card:focus-visible .carousel-card__image-wrap {
			opacity: 0;
		}

		.carousel-card:hover .carousel-card__desc-wrap,
		.carousel-card:focus-visible .carousel-card__desc-wrap {
			grid-template-rows: 1fr;
			margin-top: 0.5rem; /* was var(--space-2) */
		}

		.carousel-card:hover .carousel-card__description,
		.carousel-card:focus-visible .carousel-card__description {
			opacity: 1;
		}

		/* Its own, narrower media query (adds prefers-reduced-motion:
		   no-preference on top) — no scale at all under reduced motion. */
		@media (prefers-reduced-motion: no-preference) {
			.carousel-card:hover,
			.carousel-card:focus-visible {
				--carousel-card-scale: 1.025;
			}
		}
	}

	@media (min-width: 1024px) {
		.carousel-card__bottom {
			justify-content: space-between;
		}

		.carousel-card__arrow {
			display: flex;
			flex-shrink: 0;
			align-items: center;
			justify-content: center;
			width: 2.625rem;
			height: 2.625rem;
			border-radius: 9999px; /* was var(--radius-full) */
			border: 1px solid currentColor;
		}

		.carousel-card__arrow svg {
			width: 21px;
			height: 21px;
		}

		.carousel-card__title {
			font-size: clamp(0.8125rem, 0.769rem + 0.188vw, 0.9375rem); /* was var(--fs-body-sm) */
		}

		.carousel-card__description {
			font-size: clamp(0.8125rem, 0.769rem + 0.188vw, 0.9375rem); /* was var(--fs-body-sm) */
		}

		.carousel-card__number {
			font-size: clamp(3rem, 5vw, 4.5rem);
		}
	}
</style>
