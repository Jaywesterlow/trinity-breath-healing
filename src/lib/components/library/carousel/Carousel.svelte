<script lang="ts">
	/**
	 * Carousel — a curved fan of cards that click, drag, or auto-drift
	 * through a list, with a MorphModal detail view opening out of
	 * whichever card is centred. Composes CarouselEngine (drag/momentum/
	 * latch/idle-drift physics — see its own doc comment for the model)
	 * with the already-extracted MorphModal/MorphModalEngine for the
	 * detail view, wired together the same way Trinity Breath & Healing's
	 * original Behandelingen.svelte wires its own carousel to its own
	 * modal: opening the modal pauses idle-drift, closing it (by ANY
	 * path — the close button, Esc, or a backdrop click, see
	 * MorphModalEngine's own onClosed option) resumes it, and stepping
	 * Prev/Next INSIDE the modal drives the carousel underneath to match,
	 * so it's already centred correctly by the time the modal closes.
	 *
	 * This file owns markup, layout, and wiring only — see CarouselEngine
	 * and morph-modal-engine.svelte.ts for the actual behaviour. Every
	 * global design-token CSS variable this file's own carousel chrome
	 * (header, controls, dots, the fan itself) depended on in the original
	 * is resolved to a literal value below (each annotated with its
	 * original token name) — CarouselCard.svelte and MorphModal.svelte do
	 * the same for their own pieces. Paste this whole folder into any
	 * Svelte 5 project without breaking on a var() that doesn't resolve to
	 * anything.
	 *
	 * Usage — see this folder's README.md for the full walkthrough:
	 *
	 *   <Carousel
	 *     items={[{ id: 'a', title: 'A', teaser: '…', description: '…', image: '/a.svg' }, …]}
	 *     eyebrow="Services"
	 *     heading="Pick a treatment"
	 *   />
	 */
	import { onMount } from 'svelte';
	import { createCarouselEngine } from './carousel-engine.svelte';
	import CarouselCard from './CarouselCard.svelte';
	import MorphModal, { type MorphModalItem } from '../morph-modal/MorphModal.svelte';
	import { createMorphModalEngine } from '../morph-modal/morph-modal-engine.svelte';

	export interface CarouselItem {
		/** Unique id — also used as the modal's own item id. */
		id: string;
		/** Card title + modal title. */
		title: string;
		/** Shown on the card on hover. */
		teaser: string;
		/** Shown in the modal's own body — can be longer than `teaser`. */
		description: string;
		image: string | null;
		/** Shown instead of `image` when it's null. */
		number?: number;
		/** Card + modal CTA link. */
		href: string;
		/** Accessible name for the card's corner arrow; modal CTA label
		 * defaults to "Learn more" if omitted. */
		ctaLabel?: string;
		/** Modal-only: a short bullet list under `tagsLabel`. */
		tags?: readonly string[];
		tagsLabel?: string;
	}

	interface Props {
		items: CarouselItem[];
		eyebrow?: string;
		heading?: string;
		/** Modal-only footer note (disclaimers, fine print). */
		footnote?: string;
		prevLabel?: string;
		nextLabel?: string;
		/** Accessible name for the carousel's own group role. */
		groupLabel?: string;
		modalCloseLabel?: string;
	}

	let {
		items,
		eyebrow,
		heading,
		footnote,
		prevLabel = 'Previous',
		nextLabel = 'Next',
		groupLabel = 'Carousel',
		modalCloseLabel = 'Close'
	}: Props = $props();

	// Bound per pivot below (bind:this) so the modal can find a card's live
	// element without a fresh click event — needed for Prev/Next inside the
	// modal (no click happens on those) and for close (which must shrink
	// back onto whichever item is active, not necessarily the one
	// originally clicked).
	let pivotEls: (HTMLElement | null)[] = [];

	function cardElFor(index: number): HTMLElement | null {
		const i = carousel.nearestCopyOf(index);
		return pivotEls[i]?.querySelector('a.carousel-card') ?? null;
	}

	function onCentreCardClick(e: MouseEvent, index: number): void {
		e.preventDefault();
		// The fan has no business still drifting underneath a fullscreen
		// modal the user is reading — see CarouselEngine's own
		// cancelMotion() doc and MorphModalEngine's onClosed below for the
		// resume half of this pair.
		carousel.cancelMotion();
		modal.open(e.currentTarget as HTMLElement, index);
	}

	const carousel = createCarouselEngine({
		itemCount: items.length,
		onCentreCardClick
	});

	const modal = createMorphModalEngine({
		itemCount: items.length,
		getOriginEl: cardElFor,
		originFaceSelector: '.carousel-card__image-wrap, .carousel-card__bottom',
		// Keeps the carousel centred on whatever the modal is showing,
		// whether that came from Prev/Next inside the modal or from the
		// card that was originally clicked.
		onIndexChange: (i) => carousel.goTo(carousel.nearestCopyOf(i)),
		// Fires for every close path (button, Esc, backdrop click) — see
		// its own doc comment for why a plain onClose wrapper isn't enough.
		onClosed: () => carousel.scheduleIdleDrift()
	});

	const modalItems: MorphModalItem[] = items.map((item) => ({
		id: item.id,
		title: item.title,
		description: item.description,
		tags: item.tags,
		tagsLabel: item.tagsLabel,
		image: item.image,
		number: item.number,
		href: item.href,
		ctaLabel: item.ctaLabel
	}));

	// The item list is repeated so the recycle loop always has off-screen
	// slots to wrap through (see CarouselEngine's own `repeats`/`count`) —
	// duplicates are visually identical and carry aria-hidden + tabindex
	//="-1" (see CarouselCard's own `duplicate` prop), so the
	// accessibility tree and tab order still see each item exactly once.
	const repeatedItems = Array.from({ length: carousel.repeats }, (_, r) =>
		items.map((item) => ({
			...item,
			key: r === 0 ? item.id : `${item.id}--dup${r}`,
			duplicate: r > 0
		}))
	).flat();

	onMount(() => carousel.mount());
</script>

<section class="carousel" aria-label={groupLabel}>
	{#if eyebrow || heading}
		<header class="carousel__header">
			{#if eyebrow}<p class="carousel__eyebrow">{eyebrow}</p>{/if}
			{#if heading}<h2 class="carousel__heading">{heading}</h2>{/if}
		</header>
	{/if}

	<div class="carousel__wrap">
		<div
			class="carousel__fan"
			class:carousel__fan--grabbable={carousel.cursorInBand}
			class:carousel__fan--dragging={carousel.dragging}
			role="group"
			aria-roledescription="carousel"
			aria-label={groupLabel}
			bind:this={carousel.fanEl}
			onpointerdown={carousel.onPointerDown}
			onpointermove={carousel.onFanHoverMove}
			onpointerleave={carousel.onFanHoverLeave}
			onclickcapture={carousel.onFanClickCapture}
		>
			{#each repeatedItems as item, i (item.key)}
				<div
					class="carousel__pivot"
					class:carousel__pivot--jump={carousel.noTransitionIndices.has(i)}
					class:carousel__pivot--motion={carousel.inGesture}
					style="--pos: {carousel.positions[i]! + carousel.offset}"
					bind:this={pivotEls[i]}
				>
					<CarouselCard
						label={item.title}
						image={item.image}
						number={item.number}
						ctaLabel={item.ctaLabel ?? 'Learn more'}
						href={item.href}
						description={item.teaser}
						magnetic={carousel.isVisibleSlot(carousel.positions[i]!)}
						duplicate={item.duplicate}
						onCardClick={(e) => carousel.onCardClick(e, i)}
						dragging={carousel.dragging}
					/>
				</div>
			{/each}
		</div>

		<div class="carousel__controls">
			<button
				type="button"
				class="carousel__nav"
				onclick={() => carousel.prev()}
				aria-label={prevLabel}>{prevLabel}</button
			>

			<!-- One dot per real item, not per repeated slot (see repeatedItems
			     above) — each targets whichever copy of that item currently
			     sits nearest the centre. -->
			<ul class="carousel__dots">
				{#each items as item, s (item.id)}
					<li class="carousel__dot">
						<button
							type="button"
							class="carousel__dot-visual"
							class:carousel__dot-visual--active={carousel.isItemCentred(s)}
							aria-label={`Go to ${item.title}`}
							onclick={() => carousel.goTo(carousel.nearestCopyOf(s))}
						></button>
					</li>
				{/each}
			</ul>

			<button
				type="button"
				class="carousel__nav"
				onclick={() => carousel.next()}
				aria-label={nextLabel}>{nextLabel}</button
			>
		</div>
	</div>

	<!-- Rendered once, always — every item's full body is prerendered
	     inside it (see MorphModal.svelte), inactive ones carrying
	     `hidden`. showModal()/close() only ever toggle visibility of
	     what's already in the initial HTML. -->
	<MorphModal
		items={modalItems}
		activeIndex={modal.index}
		{footnote}
		closeLabel={modalCloseLabel}
		{prevLabel}
		{nextLabel}
		bind:dialogRef={modal.dialogEl}
		bind:contentRef={modal.contentEl}
		bind:backdropRef={modal.backdropEl}
		onPrev={() => modal.prev()}
		onNext={() => modal.next()}
		onClose={() => modal.close()}
		onCancel={(e) => modal.onCancel(e)}
		onBackdropClick={(e) => modal.onBackdropClick(e)}
		onContentPointerDown={(e) => modal.onContentPointerDown(e)}
		onContentClickCapture={(e) => modal.onContentClickCapture(e)}
	/>
</section>

<style>
	.carousel {
		background: #faf0e6; /* was var(--color-bg-sand) */
		display: flex;
		flex-direction: column;
		padding: 4rem 0 2rem; /* was var(--space-16) 0 var(--space-8) */
	}

	.carousel__header {
		max-width: 24rem;
		margin: 0 auto 2rem; /* was var(--space-8) */
		padding: 0 1.5rem; /* was var(--space-6) */
		text-align: center;
	}

	.carousel__wrap {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2rem; /* was var(--space-8) */
	}

	/* Curved fan: cards rotate around ONE shared point far below the row
	   (see .carousel__pivot) — that's what curves the path, not just each
	   card's own tilt. --pos keeps counting past the visible range instead
	   of wrapping into view, so nothing ever needs to jump across the
	   screen — it only recycles once a full step past that, fully
	   off-screen (see CarouselEngine's own comments for the exact slot
	   math). */
	.carousel__fan {
		position: relative;
		/* Full-bleed to the true viewport edge — the clip boundary below
		   has to be the screen edge itself, or cards visibly stop short of
		   it with a gap on either side. */
		width: 100vw;
		margin-left: calc(50% - 50vw);
		margin-right: calc(50% - 50vw);
		/* Tall enough that no card clips top/bottom at any visible slot —
		   re-measure this for your own card size/spread if you change
		   --card-width/--pivot-distance/--tilt-step below; it does not
		   derive automatically from them. */
		height: 20.76rem;
		overflow: hidden;
		/* Horizontal gestures drive next()/prev() — pan-y keeps vertical
		   page scroll working through a touch that starts on the carousel. */
		touch-action: pan-y;
		/* Custom properties only inherit DOWN the tree, and .carousel__pivot
		   (the card's own parent) needs to read this too. */
		--card-width: 6.27rem;
		-webkit-user-select: none; /* Safari/iOS — a drag was selecting card text */
		user-select: none;
		/* Deliberately NOT `grab` — the fan's box is much taller than the
		   region that actually starts a drag (clipping headroom for the
		   rotated cards); --grabbable below carries the cursor instead,
		   driven by the same measured band a drag is gated on, so the
		   cursor and the actual behaviour can never disagree. */
		cursor: default;
	}

	.carousel__fan--grabbable {
		cursor: grab;
	}

	/* Bound to `dragging` specifically, not `inGesture` — inGesture stays
	   true through coast/latch/drift after the finger/mouse lifts, so
	   tying this to it would leave the hand closed long after the gesture
	   is physically over. */
	.carousel__fan--dragging {
		cursor: grabbing;
	}

	/* Registers --pos as a typed, animatable custom property (Houdini —
	   Chrome/Edge 85+, Safari 16.4+, Firefox 128+; older browsers just
	   ignore this rule, pure progressive enhancement). Without it, the
	   browser can't hand transform: rotate(calc(var(--pos) * …)) off to
	   the compositor — every per-frame drag/drift write would force a full
	   main-thread style recalculation instead, which reads as choppy on
	   weaker mobile CPUs even though desktop never shows it. */
	@property --pos {
		syntax: '<number>';
		inherits: false;
		initial-value: 0;
	}

	.carousel__pivot {
		position: absolute;
		left: 50%;
		bottom: var(--pivot-baseline, 7.54rem);
		will-change: transform;
		--pivot-distance: 532px;
		--tilt-step: 14deg;
		transform-origin: 50% calc(100% + var(--pivot-distance));
		transform: translateX(-50%) rotate(calc(var(--pos) * var(--tilt-step)));
		transition: transform 600ms cubic-bezier(0.65, 0, 0.35, 1); /* ease was var(--ease-in-out) */
	}

	/* Frozen for exactly the frame a recycle happens — repositions
	   instantly instead of visibly crossing from one edge to the other. */
	.carousel__pivot--jump {
		transition: none;
	}

	/* Covers the WHOLE motion — drag, coast, latch, drift, AND
	   button-driven navigation — not just the drag itself. --pos is
	   written directly, per frame, by the engine in every one of those
	   cases; a CSS transition here would fight that with its own easing
	   on top of the engine's own, which reads as a stutter/double-ease. */
	.carousel__pivot--motion {
		transition: none;
	}

	.carousel__controls {
		display: flex;
		align-items: center;
		gap: 1rem; /* was var(--space-4) */
		/* .carousel__fan keeps a big empty buffer below the resting card on
		   purpose — the clipping safety margin a card's rotated corner
		   needs mid-transition at the far positions. Pulling the controls
		   up over that (visually empty) buffer gets a tight look without
		   touching the safety margin. -1x --pivot-baseline cancels the
		   buffer out entirely. */
		margin-top: -7.54rem;
		/* .carousel__fan is position: relative, which paints after (on top
		   of) non-positioned siblings regardless of DOM order — without
		   this, the overlap from the negative margin above makes the
		   fan's own invisible-but-still-hit-testable box swallow clicks
		   meant for these controls. */
		position: relative;
		z-index: 1;
	}

	.carousel__nav {
		/* Mobile/tablet navigate by swiping the fan itself — Prev/Next are
		   desktop-only, restored below. */
		display: none;
		border: none;
		border-radius: 9999px; /* was var(--radius-full) */
		background: #3d4a35; /* was var(--color-fg-forest) */
		color: #faf0e6; /* was var(--color-bg-sand) */
		font-family: 'DM Sans', system-ui, sans-serif; /* was var(--font-body) */
		font-size: clamp(0.875rem, 0.831rem + 0.188vw, 1rem); /* was var(--fs-cta) */
		font-weight: 500; /* was var(--font-weight-medium) */
		padding: 0.5rem 1.25rem; /* was var(--space-2) var(--space-5) */
		cursor: pointer;
		transition: background-color 150ms; /* was var(--motion-fast) */
	}

	.carousel__nav:hover {
		background: #5f6d56; /* was var(--brand-muted) */
	}

	.carousel__dots {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem; /* was var(--space-2) */
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.carousel__dot {
		display: grid;
		place-items: center;
		width: 0.7rem;
		height: 0.7rem;
	}

	.carousel__dot-visual {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 9999px; /* was var(--radius-full) */
		border: 1px solid #3d4a35; /* was var(--color-fg-forest) */
		background: transparent;
		padding: 0;
		appearance: none;
		cursor: pointer;
		transition: background-color 150ms; /* was var(--motion-fast) */
	}

	.carousel__dot-visual--active {
		background: #3d4a35; /* was var(--color-fg-forest) */
	}

	.carousel__eyebrow {
		font-family: 'DM Sans', system-ui, sans-serif; /* was var(--font-body) */
		font-size: 1.25rem; /* was var(--font-size-xl) */
		font-weight: 300; /* was var(--font-weight-light) */
		color: #5f6d56; /* was var(--brand-muted) */
		margin-bottom: 0.5rem; /* was var(--space-2) */
	}

	.carousel__heading {
		max-width: 20rem;
		margin: 0 auto;
		font-family: 'Cormorant Garamond', Georgia, serif; /* was var(--font-display) */
		font-size: clamp(1.75rem, 1.486rem + 1.127vw, 2.5rem); /* was var(--fs-h2) */
		font-weight: 500; /* was var(--font-weight-medium) */
		line-height: 1.2; /* was var(--line-height-tight) */
		color: #3d4a35; /* was var(--color-fg-forest) */
	}

	@media (min-width: 1024px) {
		.carousel {
			padding-bottom: 4rem; /* was var(--space-16) */
		}

		.carousel__header {
			max-width: none;
		}

		.carousel__heading {
			max-width: 34rem;
		}

		/* Desktop: same mechanism as mobile above, just bigger — re-measure
		   these numbers for your own card art/breakpoints, they don't
		   derive automatically from the mobile values. */
		.carousel__fan {
			height: 49.5rem;
			--card-width: 15rem;
		}

		.carousel__pivot {
			--pivot-baseline: 18rem;
			--pivot-distance: 1304px;
		}

		.carousel__controls {
			margin-top: -16rem;
		}

		.carousel__nav {
			display: inline-block;
		}
	}
</style>
