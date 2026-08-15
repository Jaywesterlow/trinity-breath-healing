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
		 * rendered), hidden purely via opacity/transform, so it stays
		 * readable to crawlers and JS-off visitors regardless of hover
		 * state. */
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

	<!-- Always in the DOM, hidden with opacity/transform — never
	     {#if hovered}, so it stays real, crawlable content at rest. -->
	<p class="carousel-card__description">{description}</p>
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
		--carousel-card-desc-shift: 2.25rem;
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

	.carousel-card__bottom {
		grid-row: 2;
		display: flex;
		align-items: center;
		/* Mobile: the arrow is gone (display: none below), so this row's
		   only child is the title — centre it in the space the arrow left
		   behind. Desktop restores the title-left/arrow-right split. */
		justify-content: center;
		gap: 0.5rem; /* was var(--space-2) */
		width: 100%;
		transition: transform var(--carousel-card-reveal-duration) cubic-bezier(0.16, 1, 0.3, 1); /* ease was var(--ease-out) */
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

	/* Anchored to the same bottom padding edge .carousel-card__bottom
	   rests on, so fading this in while that translates up reads as one
	   movement. Hidden with opacity/transform (never display/height): the
	   text stays real, readable DOM content at all times. */
	.carousel-card__description {
		position: absolute;
		left: 0.75rem; /* was var(--space-3) */
		right: 0.75rem; /* was var(--space-3) */
		bottom: 0.75rem; /* was var(--space-3) */
		margin: 0;
		font-family: 'DM Sans', system-ui, sans-serif; /* was var(--font-body) */
		font-size: clamp(0.75rem, 0.662rem + 0.376vw, 1rem); /* was var(--fs-body-xs) */
		line-height: 1.2; /* was var(--line-height-tight) */
		opacity: 0;
		transform: translateY(6px);
		pointer-events: none;
		transition:
			opacity var(--carousel-card-reveal-duration) cubic-bezier(0.16, 1, 0.3, 1),
			transform var(--carousel-card-reveal-duration) cubic-bezier(0.16, 1, 0.3, 1); /* ease was var(--ease-out) */
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

		.carousel-card:hover .carousel-card__bottom,
		.carousel-card:focus-visible .carousel-card__bottom {
			transform: translateY(calc(-1 * var(--carousel-card-desc-shift, 2.25rem)));
		}

		.carousel-card:hover .carousel-card__description,
		.carousel-card:focus-visible .carousel-card__description {
			opacity: 1;
			transform: translateY(0);
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

		.carousel-card {
			/* Desktop cards are noticeably bigger — the description needs
			   more reserved room to read as a real sentence. */
			--carousel-card-desc-shift: 3.5rem;
		}
	}
</style>
