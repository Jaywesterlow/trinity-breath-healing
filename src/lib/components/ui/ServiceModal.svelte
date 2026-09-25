<script lang="ts">
	/**
	 * ServiceModal — near-fullscreen detail view for one Behandelingen service
	 * (260810-mdl). Opens out of the carousel's centre card; see
	 * Behandelingen.svelte for the whole animation sequence (card-face fade,
	 * box grow/shrink, content fade) and the reasoning behind it — this
	 * component owns none of that. It is deliberately dumb, the same split
	 * TreatmentCard already uses: the carousel (or here, its parent) owns
	 * position/behaviour, this file only owns markup and layout.
	 *
	 * All 7 service bodies are always in the DOM — inactive ones carry
	 * `hidden`, never `{#if}` — so nothing about this component's content is
	 * built by JS at open time. The dialog itself starts closed (native
	 * `display: none`), but every word inside it is already in the
	 * prerendered HTML for an AI crawler or JS-off visitor to read, same as
	 * the rest of this project's above/below-the-fold content.
	 *
	 * Native <dialog> + showModal()/close(), driven entirely by the parent
	 * via the two bindable element refs below — this gives focus trap, Esc
	 * (as a cancellable 'cancel' event, see the parent's onCancel), background
	 * inert, and focus restore for free. Hand-rolling any of those is exactly
	 * what the pa11y-ci gate in CI exists to catch.
	 */

	import ButtonLink from './interactions/ButtonLink.svelte';

	/**
	 * Where the drawing actually is inside its SVG. The three card SVGs are
	 * mostly empty: the line art sits centred in a viewBox two to four times
	 * its own width, so an <img> sized to the box shows a small drawing with
	 * a lot of nothing around it, and a different amount of nothing per
	 * service. `x/y/w/h` are the drawing's bounding box as fractions of the
	 * viewBox (getBBox() on the rendered SVG, see Behandelingen's ART map);
	 * `ratio` is the drawing's own width/height. The media cell below sizes
	 * itself to the drawing and shifts the SVG inside it so only the drawing
	 * shows — every service's art then fills the same height.
	 */

	import type { ServiceArt } from '$lib/constants/service-art';

	export interface ServiceModalItem {
		slug: string;
		name: string;
		intro: string;
		helpsWith: readonly string[];
		icon: string | null;
		art?: ServiceArt;
		number?: number;
	}

	interface Props {
		services: ServiceModalItem[];
		/** Which service is currently showing. Every other panel carries `hidden`. */
		activeIndex: number;
		disclaimer: string;
		/** The dialog's own DOM node — the parent drives showModal()/close()
		 * and the open/close geometry animation directly against it. */
		dialogRef?: HTMLDialogElement | null;
		/** A real element behind the dialog, standing in for the native
		 * ::backdrop pseudo-element — see its own CSS comment for why. The
		 * parent fades this in/out via a plain el.animate() call, no
		 * pseudoElement targeting needed. */
		backdropRef?: HTMLElement | null;
		/** The fading content wrapper (all panels + the disclaimer) — the
		 * parent fades this in/out as step 3 of open and the first step of
		 * close. */
		contentRef?: HTMLElement | null;
		onPrev: () => void;
		onNext: () => void;
		onClose: () => void;
		/** Wired to the dialog's native `cancel` event (Esc) — see the
		 * parent's onModalCancel for why this must call preventDefault(). */
		onCancel: (e: Event) => void;
		onBackdropClick: (e: MouseEvent) => void;
		/** Swipe-to-navigate (mobile). This component only wires the raw
		 * pointer/click events through — direction, threshold, and the
		 * swipe-then-click guard all live in the parent, same split as
		 * everything else here. */
		onContentPointerDown: (e: PointerEvent) => void;
		onContentClickCapture: (e: MouseEvent) => void;
	}

	let {
		services,
		activeIndex,
		disclaimer,
		dialogRef = $bindable(null),
		contentRef = $bindable(null),
		backdropRef = $bindable(null),
		onPrev,
		onNext,
		onClose,
		onCancel,
		onBackdropClick,
		onContentPointerDown,
		onContentClickCapture
	}: Props = $props();

	/* The tooltips on Prev/Next name the destination, not the direction: the
	   order of the seven is not something a reader knows. */
	const count = $derived(services.length);
	const prevName = $derived(services[(activeIndex - 1 + count) % count]?.name ?? '');
	const nextName = $derived(services[(activeIndex + 1) % count]?.name ?? '');
</script>

<!-- Stands in for the native ::backdrop pseudo-element — see its own CSS
     comment for why. Purely a dismiss affordance duplicating the close
     button's own action (aria-hidden, no independent role/functionality of
     its own): a sighted pointer user clicking outside the dialog's content
     expects that to close it, but nothing here is reachable by keyboard/AT
     that isn't already reachable via the close button or Esc. -->
<div
	class="service-modal__backdrop"
	bind:this={backdropRef}
	aria-hidden="true"
	onclick={onClose}
></div>

<dialog
	class="service-modal"
	bind:this={dialogRef}
	aria-labelledby={`service-modal-title-${services[activeIndex]?.slug ?? ''}`}
	oncancel={onCancel}
	onclick={onBackdropClick}
>
	<!-- The three controls are the treatment card's arrow circle (see
	     TreatmentCard.svelte, .tcard__arrow): a thin ring in the text colour
	     that grows a halo and fills on hover. Prev/Next also run the shared
	     arrow swap from app.css, in the direction they go, the same way the
	     carousel's own Vorige/Volgende do. The close button keeps a still
	     cross: a cross has no direction to leave in. -->
	<button
		type="button"
		class="service-modal__close service-modal__control"
		onclick={onClose}
		aria-label="Sluiten"
		data-tooltip="Sluiten"
	>
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
			<path
				d="M4 4L12 12M12 4L4 12"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
			/>
		</svg>
	</button>

	<button
		type="button"
		class="service-modal__nav service-modal__nav--prev service-modal__control arrow-swap roll-host"
		onclick={onPrev}
		aria-label={`Vorige behandeling: ${prevName}`}
		data-tooltip={`Vorige: ${prevName}`}
	>
		<span class="arrow-swap__glyph arrow-swap__glyph--out">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<path
					d="M11 8H3M3 8L6.5 4.5M3 8L6.5 11.5"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</span>
		<span class="arrow-swap__glyph arrow-swap__glyph--in">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<path
					d="M11 8H3M3 8L6.5 4.5M3 8L6.5 11.5"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</span>
	</button>
	<button
		type="button"
		class="service-modal__nav service-modal__nav--next service-modal__control arrow-swap roll-host"
		onclick={onNext}
		aria-label={`Volgende behandeling: ${nextName}`}
		data-tooltip={`Volgende: ${nextName}`}
	>
		<span class="arrow-swap__glyph arrow-swap__glyph--out">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<path
					d="M5 8H13M13 8L9.5 4.5M13 8L9.5 11.5"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</span>
		<span class="arrow-swap__glyph arrow-swap__glyph--in">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<path
					d="M5 8H13M13 8L9.5 4.5M13 8L9.5 11.5"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</span>
	</button>

	<!-- onpointerdown below is a passive swipe-gesture listener, not a
	     click/keyboard interaction this element itself performs: it never
	     preventDefaults the native touch-scroll, and every service it
	     navigates to is equally reachable via the Prev/Next buttons, the
	     dots below the fan, and normal keyboard/AT navigation of this same
	     content — no functionality is gated behind this div having its own
	     interactive role. -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="service-modal__content"
		bind:this={contentRef}
		onpointerdown={onContentPointerDown}
		onclickcapture={onContentClickCapture}
	>
		<!-- The panels scroll (on a phone) inside this box; the disclaimer
		     below it never does. Its size is the container the art measures
		     itself against, see .service-modal__art. -->
		<div class="service-modal__panels">
			{#each services as service, idx (service.slug)}
				<section class="service-modal__panel" hidden={idx !== activeIndex}>
					<div class="service-modal__text">
						<h3 id={`service-modal-title-${service.slug}`} class="service-modal__title">
							{service.name}
						</h3>
						<p class="service-modal__intro">{service.intro}</p>
						<div class="service-modal__cta">
							<ButtonLink label="Naar de pagina" href={`/diensten/${service.slug}`} />
						</div>
					</div>

					<div class="service-modal__media">
						{#if service.icon && service.art}
							<!-- The drawing's box, not the SVG's: the img is scaled so the
							     drawing fills this box and shifted so the SVG's empty margins
							     fall outside it. See ServiceArt above for the numbers. -->
							<div
								class="service-modal__art"
								style={`--art-x: ${service.art.x}; --art-y: ${service.art.y}; --art-w: ${service.art.w}; --art-h: ${service.art.h}; --art-ratio: ${service.art.ratio};`}
							>
								<img src={service.icon} alt="" aria-hidden="true" class="service-modal__icon" />
							</div>
						{:else if service.icon}
							<img src={service.icon} alt="" aria-hidden="true" class="service-modal__icon-plain" />
						{:else if service.number}
							<span class="service-modal__number" aria-hidden="true">{service.number}</span>
						{/if}
					</div>

					<div class="service-modal__helps">
						<h4 class="service-modal__helps-title">Helpt bij</h4>
						<ul class="service-modal__helps-list">
							{#each service.helpsWith as item (item)}
								<li>{item}</li>
							{/each}
						</ul>
					</div>
				</section>
			{/each}
		</div>

		<p class="service-modal__disclaimer">{disclaimer}</p>
	</div>
</dialog>

<style>
	/* Reset the UA's own dialog chrome (default border/padding/centring) —
	   every bit of positioning below is ours. */
	.service-modal {
		margin: 0;
		border: none;
		padding: var(--space-6);
		position: fixed;
		top: 4vh;
		left: 4vw;
		width: 92vw;
		height: 92vh;
		/* Same background/radius as .tcard, and never anything else for the
		   whole open/close animation — the parent morphs top/left/width/
		   height only, so "the dialog appears matched exactly to the card's
		   rect, same background, same border radius" holds automatically at
		   every frame, not just the first one. */
		background: var(--color-brand-green);
		color: var(--color-bg-sand);
		border-radius: var(--radius-lg);
		overflow: hidden;
		flex-direction: column;
	}

	/* display MUST stay conditional on [open], not a blanket rule on
	   .service-modal above. The UA stylesheet's own `dialog:not([open]) {
	   display: none }` is what keeps a closed dialog out of the layout and
	   off the hit-testing tree — an author rule unconditionally setting
	   `display` on .service-modal (regardless of specificity) wins over
	   that UA rule by cascade origin, which silently made this fixed,
	   92vw/92vh box intercept clicks and add page height on every load,
	   open or not. Caught by the existing carousel Playwright specs
	   suddenly failing to click cards that were never near the modal. */
	.service-modal[open] {
		display: flex;
	}

	/* Left transparent on purpose — .service-modal__backdrop below is what
	   actually dims the page now. A first attempt animated the NATIVE
	   backdrop's opacity via el.animate(..., { pseudoElement: '::backdrop' }),
	   which worked in this project's own Chromium-based testing but was
	   confirmed NOT to fade on a real device — cross-browser support for
	   animating pseudo-elements through the Web Animations API is real but
	   inconsistent, and this dialog still needs the ::backdrop pseudo-element
	   to exist (showModal() always creates one) even though nothing here
	   renders it visibly any more. */
	.service-modal::backdrop {
		background: transparent;
	}

	/* Stands in for the native ::backdrop — a real element, so it animates
	   with a plain el.animate() call and nothing depends on pseudo-element
	   support. position: fixed + inset: 0 makes it cover the full viewport
	   independent of the dialog's own box, which is what's actually
	   growing/shrinking during open/close. display and opacity are both
	   JS-driven (Behandelingen.svelte's fadeBackdrop/openModal/closeModal) —
	   display toggles alongside dialog.showModal()/close() so this is never
	   in the hit-testing tree while the modal is closed; opacity 0 is simply
	   this element's own resting value, matching a fade-in's own starting
	   keyframe with no extra pre-hide step needed (contrast the content/nav
	   fade, whose resting opacity is 1 and does need one — see openModal's
	   own comment). */
	.service-modal__backdrop {
		position: fixed;
		inset: 0;
		background: var(--color-fg-forest-92);
		opacity: 0;
		display: none;
		/* Above Nav's own highest z-index (100) — needs to sit above
		   everything in normal document flow while the modal is open. The
		   dialog itself, once shown via showModal(), is browser-native
		   top-layer-promoted and always renders above this regardless of
		   z-index, so this only ever needs to clear ordinary page content. */
		z-index: 200;
	}

	/* ─── The three controls: the card's arrow circle ─────────────────────
	   Numbers copied from .tcard__arrow in TreatmentCard.svelte (2.625rem,
	   1px ring in the text colour, a 9px halo at 38% sand and a sand fill
	   with the glyph turning green on hover). Scoped styles cannot be shared,
	   so the values are repeated here; change them in both places or in
	   neither. The card also grows a smaller halo when the card itself is
	   hovered — there is no equivalent state in a dialog, so that one is
	   left out. */
	.service-modal__control {
		position: absolute;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.625rem;
		height: 2.625rem;
		padding: 0;
		border-radius: var(--radius-full);
		border: 1px solid currentColor;
		background: transparent;
		color: inherit;
		cursor: pointer;
		/* Above the content: on desktop the content wrapper is positioned (it
		   carries the sand half), and a positioned sibling later in the DOM
		   would otherwise paint over these and take their clicks. */
		z-index: 2;
		box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-bg-sand) 0%, transparent);
		transition:
			background-color var(--motion-arrow) var(--ease-arrow),
			color var(--motion-arrow) var(--ease-arrow),
			box-shadow var(--motion-hover) var(--ease-hover);
	}

	.service-modal__control svg {
		width: 21px;
		height: 21px;
	}

	.service-modal__control:focus-visible {
		box-shadow: 0 0 0 9px color-mix(in srgb, var(--color-bg-sand) 38%, transparent);
		background: var(--color-bg-sand);
		color: var(--color-brand-green);
	}

	@media (hover: hover) and (pointer: fine) {
		.service-modal__control:hover {
			box-shadow: 0 0 0 9px color-mix(in srgb, var(--color-bg-sand) 38%, transparent);
			background: var(--color-bg-sand);
			color: var(--color-brand-green);
		}
	}

	/* Phone: all three in one row at the top right, close on the outside,
	   because at the dialog's sides they sat on top of the text. Desktop
	   moves Prev/Next back to the sides below. The swap runs along the
	   arrow's own axis, the same vector the carousel's Vorige/Volgende use. */
	.service-modal__close {
		top: var(--space-4);
		right: var(--space-4);
	}

	.service-modal__nav--next {
		top: var(--space-4);
		right: calc(var(--space-4) + 2.625rem + var(--space-3));
		--swap-x: var(--arrow-roll);
		--swap-y: 0px;
	}

	.service-modal__nav--prev {
		top: var(--space-4);
		right: calc(var(--space-4) + 2 * (2.625rem + var(--space-3)));
		--swap-x: calc(-1 * var(--arrow-roll));
		--swap-y: 0px;
	}

	/* ─── Content: panels above, disclaimer pinned below ──────────────────
	   The disclaimer is the one line the owner wants under everything on
	   every screen, never overlapped and never scrolled away — so it is a
	   flex sibling of the scrolling panels box, not the last item inside it.
	   Room for the absolutely-positioned close/prev/next buttons so text
	   never runs under them. */
	.service-modal__content {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		/* Top clears the control row; the sides are the dialog's own padding
		   plus a little, since nothing sits beside the text on a phone. */
		padding: calc(var(--space-4) + 2.625rem + var(--space-4)) var(--space-4) 0;
	}

	.service-modal__panels {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		/* The art measures itself against this box (cqh/cqw below), so it
		   has to be a size container. Its size comes from the flex line
		   above, never from its content, which is what containment needs. */
		container-type: size;
		/* Mobile scrolls by touch, not by dragging a visible scrollbar thumb —
		   a first attempt shrank this element (margin-right) so its own
		   scrollbar, which paints at its border-box edge regardless of
		   padding, would clear the buttons. That worked (measured: 4px clear
		   instead of 32px of overlap) but reads as a stray line sitting in a
		   gap between the text and the buttons rather than at the modal's
		   true edge — a direct owner objection after checking a real device.
		   Hiding the scrollbar outright sidesteps the problem instead of
		   relocating it: nothing is left to clear, so content can go back to
		   the original, uniform padding, flush with the dialog's own edge.
		   Desktop keeps a visible scrollbar (mouse/trackpad users benefit
		   from the affordance) — reset at the 1024px breakpoint below. */
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* legacy Edge */
	}

	.service-modal__panels::-webkit-scrollbar {
		display: none; /* Chrome/Safari/mobile WebKit */
	}

	/* The author display rules below would otherwise beat the UA's
	   [hidden] { display: none } by cascade origin, and all seven panels
	   would show at once. */
	.service-modal__panel[hidden] {
		display: none;
	}

	/* Phone: one column, the drawing first and as tall as the screen allows
	   without pushing the title out of the first view, then the text. The
	   drawing is not a background: the text and the line art are both sand,
	   and sand on sand is nothing. */
	.service-modal__panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		min-height: 100%;
	}

	.service-modal__text {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		order: 2;
	}

	.service-modal__title {
		margin: 0;
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
	}

	.service-modal__intro {
		margin: 0;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		line-height: var(--line-height-loose);
	}

	.service-modal__cta {
		margin-top: var(--space-2);
	}

	/* The site's button, turned for a green ground: phone and tablet only.
	   ButtonLink paints its pill and ring in --btn-fill (brown) for a sand
	   page; brown on this green is barely there, and its ring is empty, so
	   the arrow floated on nothing. Here the two colours are sand and green,
	   the ring is filled like the modal's own close/prev/next circles, and
	   hover inverts pill and ring together, the same swap every other button
	   makes. From 1024px up the words sit on sand and the button is the
	   ordinary one again. The extra .service-modal in front is specificity:
	   ButtonLink's own hover rule is five selectors deep. ButtonLink.svelte
	   itself is untouched. */
	@media (max-width: 1023.98px) {
		.service-modal .service-modal__cta :global(.btn-host),
		.service-modal .service-modal__cta :global(.btn-pill) {
			--btn-fill: var(--color-bg-sand);
			--btn-ink: var(--color-brand-green);
		}

		.service-modal .service-modal__cta :global(.btn-link__circle) {
			background: var(--btn-fill);
			color: var(--btn-ink);
		}

		.service-modal .service-modal__cta :global(.btn-link:focus-visible .btn-link__circle) {
			background: var(--btn-ink);
			color: var(--btn-fill);
		}
	}

	@media (max-width: 1023.98px) and (hover: hover) and (pointer: fine) {
		.service-modal .service-modal__cta :global(.btn-link:hover .btn-link__circle) {
			background: var(--btn-ink);
			color: var(--btn-fill);
		}
	}

	.service-modal__media {
		order: 1;
		display: grid;
		place-items: center;
		flex: none;
		height: min(38cqh, 22rem);
	}

	/* The drawing's own box: as tall as the media cell, as wide as the
	   drawing's ratio makes it, and clipped, with the SVG inside scaled up
	   by 1/--art-w × 1/--art-h and pulled up and left by the margins so the
	   drawing lands exactly in the box. The two scale factors describe the
	   same SVG, so its aspect ratio is untouched. */
	.service-modal__art {
		position: relative;
		height: 100%;
		max-width: 100%;
		aspect-ratio: var(--art-ratio);
		overflow: hidden;
	}

	.service-modal__icon {
		position: absolute;
		display: block;
		width: calc(100% / var(--art-w));
		height: calc(100% / var(--art-h));
		max-width: none;
		left: calc(-100% * var(--art-x) / var(--art-w));
		top: calc(-100% * var(--art-y) / var(--art-h));
	}

	/* A service whose drawing has no measured box yet: plain contain. */
	.service-modal__icon-plain {
		height: 100%;
		width: auto;
		max-width: 100%;
		object-fit: contain;
	}

	.service-modal__number {
		font-family: var(--font-display);
		font-size: min(30cqh, 6rem);
		font-weight: var(--font-weight-medium);
		line-height: 1;
	}

	.service-modal__helps {
		order: 3;
	}

	.service-modal__helps-title {
		margin: 0 0 var(--space-2);
		font-family: var(--font-body);
		font-size: var(--fs-body-sm);
		font-weight: var(--font-weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.service-modal__helps-list {
		margin: 0;
		/* Room for the marker list-style below now draws — plain list-style:
		   none read as odd/unlabelled for a list of symptoms/complaints,
		   a direct owner request to restore real bullets. */
		padding-left: var(--space-5);
		list-style: disc;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-family: var(--font-body);
		font-size: var(--fs-body-sm);
		line-height: var(--line-height-normal);
	}

	.service-modal__disclaimer {
		flex: none;
		margin: var(--space-4) 0 var(--space-4);
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-bg-sand-25);
		font-family: var(--font-body);
		font-size: var(--fs-body-xs);
		color: var(--color-bg-sand);
		opacity: 0.8;
	}

	/* Desktop: the drawing in the middle at the full height of the panel,
	   the title, intro and button to its left and the list to its right,
	   both gathered against it and centred on its axis. The drawing's width
	   follows its ratio from that height, capped so the two text columns
	   always keep room; the columns take the rest. */
	/* ─── Desktop: design B, chosen by the owner ───────────────────────────
	   A centred box rather than 92vw × 92vh, so nothing floats in a sea of
	   green on a wide screen. Two grounds inside it: the left 42% stays the
	   card's green and carries the drawing, the right 58% is the page's sand
	   and carries the words in forest ink, with the site's own brown button.
	   The dialog's background stays plain green on purpose: the open
	   animation grows the card into this box (Behandelingen.svelte reads the
	   target from getBoundingClientRect, so the new size needs no JS), and the
	   sand arrives with the content fade, as a pseudo-element on the content
	   wrapper. The box keeps the card's colour for every frame of the grow. */
	@media (min-width: 1024px) {
		.service-modal {
			--modal-w: min(1180px, 88vw);
			--modal-h: min(800px, 88vh);
			--modal-split: 42%;
			top: calc((100vh - var(--modal-h)) / 2);
			left: calc((100vw - var(--modal-w)) / 2);
			width: var(--modal-w);
			height: var(--modal-h);
			padding: 0;
		}

		.service-modal__content {
			position: relative;
			padding: 0;
			display: grid;
			grid-template-columns: var(--modal-split) minmax(0, 1fr);
			grid-template-rows: minmax(0, 1fr) auto;
		}

		.service-modal__content::before {
			content: '';
			position: absolute;
			inset: 0 0 0 var(--modal-split);
			background: var(--color-bg-sand);
		}

		.service-modal__panels {
			position: relative;
			grid-column: 1 / -1;
			grid-row: 1;
		}

		/* The two columns line up with the two grounds: the panel spans the
		   whole box and splits at the same 42%. The words sit as one group in
		   the middle of the right half; the drawing fills the left half. */
		.service-modal__panel {
			display: grid;
			grid-template-columns: var(--modal-split) minmax(0, 1fr);
			grid-template-rows: 1fr auto auto 1fr;
			/* The phone layout's flex gap would open a 20px gutter between the
			   columns and push the words off the disclaimer's edge. */
			gap: 0;
			min-height: 100%;
			height: auto;
		}

		.service-modal__panel[hidden] {
			display: none;
		}

		.service-modal__media {
			order: 0;
			grid-column: 1;
			grid-row: 1 / -1;
			height: 100%;
			min-height: 0;
		}

		.service-modal__art {
			width: min(calc(80cqh * var(--art-ratio)), 32cqw);
			/* Height follows the width through the ratio. The phone rule's
			   max-width: 100% must not apply here: against the auto grid track
			   it resolves circularly and clamps the drawing to a fraction of
			   its size. */
			max-width: none;
			height: auto;
		}

		.service-modal__icon-plain {
			height: 80cqh;
			max-width: 32cqw;
		}

		/* Cormorant's digits sit well inside the em box, so the size is well
		   over the cell height to get a glyph that fills most of it. */
		.service-modal__number {
			font-size: min(80cqh, 24cqw);
		}

		/* Right margin clears the next arrow (2.625rem + its 1rem inset). */
		.service-modal__text,
		.service-modal__helps {
			order: 0;
			grid-column: 2;
			margin: 0 5rem 0 clamp(2.5rem, 4vw, 4rem);
			color: var(--color-fg-forest);
		}

		.service-modal__text {
			grid-row: 2;
			max-width: 44ch;
			gap: var(--space-4);
		}

		.service-modal__intro {
			font-size: var(--fs-body-lg);
			color: var(--color-text-subtle);
		}

		.service-modal__helps {
			grid-row: 3;
			margin-top: var(--space-5);
		}

		.service-modal__helps-title {
			color: var(--brand-muted);
		}

		/* Two balanced columns, so nine complaints are five rows, not nine.
		   CSS columns rather than a grid: an item that runs long wraps inside
		   its own column instead of pushing into the next one. */
		.service-modal__helps-list {
			display: block;
			columns: 2;
			column-gap: var(--space-10);
			font-size: var(--fs-body);
			color: var(--color-text-subtle);
		}

		.service-modal__helps-list li {
			break-inside: avoid;
			margin-bottom: var(--space-1);
		}

		.service-modal__disclaimer {
			position: relative;
			grid-column: 2;
			grid-row: 2;
			margin: 0 5rem var(--space-6) clamp(2.5rem, 4vw, 4rem);
			color: var(--color-text-subtle);
			opacity: 1;
			border-top-color: color-mix(in srgb, var(--brand-border) 25%, transparent);
		}

		/* Vertically centred against the dialog's own left/right edge. Prev
		   sits on the green half and keeps the sand ring; close and next sit
		   on the sand half and take the brown ring of every control on a sand
		   page, with the same fill-and-halo hover in brown. */
		.service-modal__nav--prev {
			top: 50%;
			right: auto;
			left: var(--space-4);
			transform: translateY(-50%);
		}

		.service-modal__nav--next {
			top: 50%;
			right: var(--space-4);
			transform: translateY(-50%);
		}

		.service-modal__close,
		.service-modal__nav--next {
			color: var(--brand-border);
		}

		.service-modal__close:focus-visible,
		.service-modal__nav--next:focus-visible {
			box-shadow: 0 0 0 9px color-mix(in srgb, var(--brand-border) 22%, transparent);
			background: var(--brand-border);
			color: var(--color-bg-sand);
		}

		/* Restore a visible scrollbar at this breakpoint — the hide is a
		   mobile-only concession to the touch-scroll pattern (see its own
		   comment); desktop's mouse/trackpad users benefit from seeing one. */
		.service-modal__panels {
			scrollbar-width: auto;
			-ms-overflow-style: auto;
		}

		.service-modal__panels::-webkit-scrollbar {
			display: block;
		}
	}

	/* A short laptop screen (1366×768, 1280×720): the box takes more of the
	   height and the intro drops to body size, so the longest treatments fit
	   or come close. What still does not fit scrolls inside the panel, with
	   a visible scrollbar. */
	@media (min-width: 1024px) and (max-height: 860px) {
		.service-modal {
			--modal-h: 94vh;
		}

		.service-modal__intro {
			font-size: var(--fs-body);
		}
	}

	@media (min-width: 1024px) and (hover: hover) and (pointer: fine) {
		.service-modal__close:hover,
		.service-modal__nav--next:hover {
			box-shadow: 0 0 0 9px color-mix(in srgb, var(--brand-border) 22%, transparent);
			background: var(--brand-border);
			color: var(--color-bg-sand);
		}
	}
</style>
