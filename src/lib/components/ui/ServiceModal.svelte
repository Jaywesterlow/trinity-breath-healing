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

	export interface ServiceModalItem {
		slug: string;
		name: string;
		intro: string;
		helpsWith: readonly string[];
		icon: string | null;
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
	}

	let {
		services,
		activeIndex,
		disclaimer,
		dialogRef = $bindable(null),
		contentRef = $bindable(null),
		onPrev,
		onNext,
		onClose,
		onCancel,
		onBackdropClick
	}: Props = $props();
</script>

<dialog
	class="service-modal"
	bind:this={dialogRef}
	aria-labelledby={`service-modal-title-${services[activeIndex]?.slug ?? ''}`}
	oncancel={onCancel}
	onclick={onBackdropClick}
>
	<button type="button" class="service-modal__close" onclick={onClose} aria-label="Sluiten">
		<svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
			<path
				d="M5 5L17 17M17 5L5 17"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
		</svg>
	</button>

	<button
		type="button"
		class="service-modal__nav service-modal__nav--prev"
		onclick={onPrev}
		aria-label="Vorige behandeling"
	>
		<svg width="16" height="16" viewBox="0 0 22 22" fill="none" aria-hidden="true">
			<path
				d="M14 4L6 11L14 18"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>
	<button
		type="button"
		class="service-modal__nav service-modal__nav--next"
		onclick={onNext}
		aria-label="Volgende behandeling"
	>
		<svg width="16" height="16" viewBox="0 0 22 22" fill="none" aria-hidden="true">
			<path
				d="M8 4L16 11L8 18"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>

	<div class="service-modal__content" bind:this={contentRef}>
		{#each services as service, idx (service.slug)}
			<section class="service-modal__panel" hidden={idx !== activeIndex}>
				<h3 id={`service-modal-title-${service.slug}`} class="service-modal__title">
					{service.name}
				</h3>
				<p class="service-modal__intro">{service.intro}</p>

				<div class="service-modal__media">
					{#if service.icon}
						<img src={service.icon} alt="" aria-hidden="true" class="service-modal__icon" />
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

				<a class="service-modal__cta" href={`/diensten/${service.slug}`}>Naar de pagina</a>
			</section>
		{/each}

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
		background: var(--color-fg-forest);
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

	/* Only meaningful while open (native [open] gates display: block automatically) */
	.service-modal::backdrop {
		background: var(--color-fg-forest-92);
	}

	.service-modal__close,
	.service-modal__nav {
		position: absolute;
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-full);
		border: 1px solid currentColor;
		background: transparent;
		color: inherit;
		cursor: pointer;
		transition: background-color var(--motion-fast);
	}

	.service-modal__close:hover,
	.service-modal__nav:hover {
		background: var(--color-fg-forest-92);
	}

	.service-modal__close {
		top: var(--space-4);
		right: var(--space-4);
	}

	/* Vertically centred against the dialog's own left/right edge, per the plan. */
	.service-modal__nav--prev {
		top: 50%;
		left: var(--space-4);
		transform: translateY(-50%);
	}

	.service-modal__nav--next {
		top: 50%;
		right: var(--space-4);
		transform: translateY(-50%);
	}

	.service-modal__content {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		/* Room for the absolutely-positioned close/prev/next buttons so they
		   never overlap the first line of copy. */
		padding: var(--space-10) var(--space-10) 0;
	}

	.service-modal__panel {
		display: grid;
		grid-template-areas:
			'title'
			'intro'
			'media'
			'helps'
			'cta';
		gap: var(--space-4);
	}

	.service-modal__title {
		grid-area: title;
		margin: 0;
		font-family: var(--font-display);
		font-size: var(--fs-h3);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
	}

	.service-modal__intro {
		grid-area: intro;
		margin: 0;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		line-height: var(--line-height-loose);
	}

	.service-modal__media {
		grid-area: media;
		display: grid;
		place-items: center;
		min-height: 8rem;
	}

	.service-modal__icon {
		width: 100%;
		max-width: 12rem;
		height: auto;
		object-fit: contain;
	}

	.service-modal__number {
		font-family: var(--font-display);
		font-size: clamp(3rem, 8vw, 5rem);
		font-weight: var(--font-weight-medium);
		line-height: 1;
	}

	.service-modal__helps {
		grid-area: helps;
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
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-family: var(--font-body);
		font-size: var(--fs-body-sm);
		line-height: var(--line-height-normal);
	}

	.service-modal__cta {
		grid-area: cta;
		justify-self: start;
		display: inline-block;
		margin-top: var(--space-2);
		padding: var(--space-2) var(--space-5);
		border-radius: var(--radius-full);
		background: var(--color-accent-gold);
		color: var(--color-fg-forest);
		font-family: var(--font-body);
		font-size: var(--fs-cta);
		font-weight: var(--font-weight-medium);
		text-decoration: none;
	}

	.service-modal__disclaimer {
		margin: var(--space-8) 0 var(--space-6);
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-bg-sand-25);
		font-family: var(--font-body);
		font-size: var(--fs-body-xs);
		color: var(--color-bg-sand);
		opacity: 0.8;
	}

	@media (min-width: 1024px) {
		.service-modal__panel {
			grid-template-columns: 1fr auto 1fr;
			grid-template-areas:
				'title media helps'
				'intro media helps'
				'cta   media helps';
			align-items: start;
			column-gap: var(--space-10);
		}

		.service-modal__cta {
			align-self: start;
		}
	}
</style>
