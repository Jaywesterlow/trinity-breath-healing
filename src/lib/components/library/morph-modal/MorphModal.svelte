<script lang="ts">
	/**
	 * MorphModal — near-fullscreen detail view that grows out of a clicked
	 * element (a card, thumbnail, list row) and shrinks back into it on
	 * close. All animation/behaviour lives in morph-modal-engine.svelte.ts
	 * (MorphModalEngine) — this file only owns markup and layout, driven
	 * entirely by the props below. See this folder's README.md for a full
	 * usage walkthrough.
	 *
	 * Extracted from Trinity Breath & Healing's service-detail modal
	 * (originally ServiceModal.svelte). Every CSS custom property this
	 * component depended on in that project has been resolved to a literal
	 * value below (each annotated with its original token name) so this
	 * file has zero external CSS-variable dependencies — paste it into any
	 * Svelte 5 + Tailwind v4 project and it renders identically, rather than
	 * silently breaking on a var() that doesn't resolve to anything. Swap
	 * the literal values for your own design tokens as needed; the class
	 * names (`morph-modal__*`) are free to rename too, as long as you also
	 * update MorphModalEngine's own `#navEls()` selector to match.
	 *
	 * Native <dialog> + showModal()/close() (driven by the engine via the
	 * two bindable element refs below) gives focus trap, Esc as a
	 * cancellable 'cancel' event, background inert, and focus restore for
	 * free — hand-rolling any of those is real accessibility work this
	 * sidesteps entirely.
	 *
	 * All items are always in the DOM — inactive ones carry `hidden`, never
	 * `{#if}` — so nothing about this component's content is built by JS at
	 * open time. Keep this if you want every item's content in the
	 * prerendered HTML (SSG/SSR, AI crawlers, JS-off visitors); swap to
	 * `{#if idx === activeIndex}` instead if that doesn't matter for your
	 * use case and you'd rather not render every item's markup up front.
	 */

	export interface MorphModalItem {
		/** Unique key — also used as the title's own id-anchor for aria-labelledby. */
		id: string;
		title: string;
		description: string;
		/** A short bullet list under `tagsLabel` (e.g. symptoms, features, specs).
		 * Omit (or pass an empty array) to skip that whole block. */
		tags?: readonly string[];
		/** Heading above `tags` — e.g. "Helps with", "Includes", "Specs". */
		tagsLabel?: string;
		/** Image src. If null and `number` is set, a large numeral renders instead
		 * (e.g. for a numbered-steps list with no per-item artwork yet). */
		image: string | null;
		number?: number;
		/** Optional CTA link under the tags — omit both to skip the CTA entirely. */
		href?: string;
		ctaLabel?: string;
	}

	interface Props {
		items: MorphModalItem[];
		/** Which item is currently showing. Every other panel carries `hidden`. */
		activeIndex: number;
		/** Optional footer note (disclaimers, fine print) shown under every item. */
		footnote?: string;
		/** The dialog's own DOM node — the engine drives showModal()/close()
		 * and the open/close geometry animation directly against it. */
		dialogRef?: HTMLDialogElement | null;
		/** A real element behind the dialog, standing in for the native
		 * ::backdrop pseudo-element (see its own CSS comment for why). The
		 * engine fades this in/out via a plain el.animate() call. */
		backdropRef?: HTMLElement | null;
		/** The fading content wrapper (all panels + the footnote) — the engine
		 * fades this in/out as the last step of open and the first of close. */
		contentRef?: HTMLElement | null;
		onPrev: () => void;
		onNext: () => void;
		onClose: () => void;
		/** Wired to the dialog's native `cancel` event (Esc) — must call
		 * preventDefault() so the animated close runs instead of an instant
		 * native one; see MorphModalEngine.onCancel. */
		onCancel: (e: Event) => void;
		onBackdropClick: (e: MouseEvent) => void;
		/** Swipe-to-navigate (mobile). This component only wires the raw
		 * pointer/click events through — direction, threshold, and the
		 * swipe-then-click guard all live in the engine. */
		onContentPointerDown: (e: PointerEvent) => void;
		onContentClickCapture: (e: MouseEvent) => void;
		/** aria-label for the close button and Prev/Next nav — override for a
		 * non-English project. Defaults are English since this is a generic
		 * library component. */
		closeLabel?: string;
		prevLabel?: string;
		nextLabel?: string;
	}

	let {
		items,
		activeIndex,
		footnote,
		dialogRef = $bindable(null),
		contentRef = $bindable(null),
		backdropRef = $bindable(null),
		onPrev,
		onNext,
		onClose,
		onCancel,
		onBackdropClick,
		onContentPointerDown,
		onContentClickCapture,
		closeLabel = 'Close',
		prevLabel = 'Previous',
		nextLabel = 'Next'
	}: Props = $props();
</script>

<!-- Stands in for the native ::backdrop pseudo-element — see its own CSS
     comment for why. Purely a dismiss affordance duplicating the close
     button's own action (aria-hidden, no independent role/functionality of
     its own): a sighted pointer user clicking outside the dialog's content
     expects that to close it, but nothing here is reachable by keyboard/AT
     that isn't already reachable via the close button or Esc. -->
<div
	class="morph-modal__backdrop"
	bind:this={backdropRef}
	aria-hidden="true"
	onclick={onClose}
></div>

<dialog
	class="morph-modal"
	bind:this={dialogRef}
	aria-labelledby={`morph-modal-title-${items[activeIndex]?.id ?? ''}`}
	oncancel={onCancel}
	onclick={onBackdropClick}
>
	<button type="button" class="morph-modal__close" onclick={onClose} aria-label={closeLabel}>
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
		class="morph-modal__nav morph-modal__nav--prev"
		onclick={onPrev}
		aria-label={prevLabel}
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
		class="morph-modal__nav morph-modal__nav--next"
		onclick={onNext}
		aria-label={nextLabel}
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

	<!-- onpointerdown below is a passive swipe-gesture listener, not a
	     click/keyboard interaction this element itself performs: it never
	     preventDefaults the native touch-scroll, and every item it
	     navigates to is equally reachable via the Prev/Next buttons and
	     normal keyboard/AT navigation of this same content — no
	     functionality is gated behind this div having its own interactive
	     role. -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="morph-modal__content"
		bind:this={contentRef}
		onpointerdown={onContentPointerDown}
		onclickcapture={onContentClickCapture}
	>
		{#each items as item, idx (item.id)}
			<section class="morph-modal__panel" hidden={idx !== activeIndex}>
				<h3 id={`morph-modal-title-${item.id}`} class="morph-modal__title">
					{item.title}
				</h3>
				<p class="morph-modal__intro">{item.description}</p>

				<div class="morph-modal__media">
					{#if item.image}
						<img src={item.image} alt="" aria-hidden="true" class="morph-modal__icon" />
					{:else if item.number}
						<span class="morph-modal__number" aria-hidden="true">{item.number}</span>
					{/if}
				</div>

				{#if item.tags && item.tags.length > 0}
					<div class="morph-modal__tags">
						{#if item.tagsLabel}
							<h4 class="morph-modal__tags-title">{item.tagsLabel}</h4>
						{/if}
						<ul class="morph-modal__tags-list">
							{#each item.tags as tag (tag)}
								<li>{tag}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if item.href}
					<a class="morph-modal__cta" href={item.href}>{item.ctaLabel ?? 'Learn more'}</a>
				{/if}
			</section>
		{/each}

		{#if footnote}
			<p class="morph-modal__footnote">{footnote}</p>
		{/if}
	</div>
</dialog>

<style>
	/* Reset the UA's own dialog chrome (default border/padding/centring) —
	   every bit of positioning below is ours. */
	.morph-modal {
		margin: 0;
		border: none;
		padding: 1.5rem; /* was var(--space-6) */
		position: fixed;
		top: 4vh;
		left: 4vw;
		width: 92vw;
		height: 92vh;
		/* Swap these two for your own surface/text colors — the parent morphs
		   only top/left/width/height, so "the dialog appears matched exactly
		   to the origin element's rect, same background, same border radius"
		   holds automatically at every frame as long as both share these. */
		background: #3d4a35; /* was var(--color-fg-forest) */
		color: #faf0e6; /* was var(--color-bg-sand) */
		border-radius: 1rem; /* was var(--radius-lg) */
		overflow: hidden;
		flex-direction: column;
	}

	/* display MUST stay conditional on [open], not a blanket rule on
	   .morph-modal above. The UA stylesheet's own `dialog:not([open]) {
	   display: none }` is what keeps a closed dialog out of the layout and
	   off the hit-testing tree — an author rule unconditionally setting
	   `display` on .morph-modal (regardless of specificity) wins over that
	   UA rule by cascade origin, which would make this fixed, 92vw/92vh box
	   intercept clicks and add page height even while closed. */
	.morph-modal[open] {
		display: flex;
	}

	/* Left transparent on purpose — .morph-modal__backdrop below is what
	   actually dims the page now. Animating the NATIVE backdrop's opacity
	   via el.animate(..., { pseudoElement: '::backdrop' }) worked in
	   Chromium-based testing but was confirmed NOT to fade on a real
	   device — cross-browser support for animating pseudo-elements through
	   the Web Animations API is real but inconsistent, and this dialog
	   still needs the ::backdrop pseudo-element to exist (showModal()
	   always creates one) even though nothing here renders it visibly any
	   more. */
	.morph-modal::backdrop {
		background: transparent;
	}

	/* Stands in for the native ::backdrop — a real element, so it animates
	   with a plain el.animate() call and nothing depends on pseudo-element
	   support. position: fixed + inset: 0 covers the full viewport
	   independent of the dialog's own box, which is what's actually
	   growing/shrinking during open/close. display and opacity are both
	   JS-driven (MorphModalEngine's #fadeBackdrop/open/close) — display
	   toggles alongside dialog.showModal()/close() so this is never in the
	   hit-testing tree while the modal is closed; opacity 0 is simply this
	   element's own resting value, matching a fade-in's own starting
	   keyframe with no extra pre-hide step needed. */
	.morph-modal__backdrop {
		position: fixed;
		inset: 0;
		background: color-mix(in srgb, #3d4a35 92%, transparent); /* was var(--color-fg-forest-92) */
		opacity: 0;
		display: none;
		/* Set this higher than any other fixed/sticky element in your page —
		   the dialog itself, once shown via showModal(), is browser-native
		   top-layer-promoted and always renders above this regardless of
		   z-index, so this only ever needs to clear ordinary page content. */
		z-index: 200;
	}

	.morph-modal__close,
	.morph-modal__nav {
		position: absolute;
		display: grid;
		place-items: center;
		width: 2.5rem; /* was var(--space-10) */
		height: 2.5rem; /* was var(--space-10) */
		border: none;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}

	/* Close keeps circular button chrome (the one control here that isn't
	   paired with an obvious "this is clickable" affordance like an arrow
	   shape already implies motion) — Prev/Next deliberately don't. */
	.morph-modal__close {
		top: 1rem; /* was var(--space-4) */
		right: 1rem; /* was var(--space-4) */
		border-radius: 9999px; /* was var(--radius-full) */
		border: 1px solid currentColor;
		transition: background-color 150ms; /* was var(--motion-fast) */
	}

	@media (hover: hover) and (pointer: fine) {
		.morph-modal__close:hover {
			background: color-mix(in srgb, #3d4a35 92%, transparent); /* was var(--color-fg-forest-92) */
		}
	}

	/* Bare arrows, no circle/border — opacity is the only hover affordance
	   left once the circle (and its own hover background) is gone. */
	@media (hover: hover) and (pointer: fine) {
		.morph-modal__nav:hover {
			opacity: 0.65;
		}
	}

	.morph-modal__nav--prev {
		top: 50%;
		left: 1rem; /* was var(--space-4) */
		transform: translateY(-50%);
	}

	.morph-modal__nav--next {
		top: 50%;
		right: 1rem; /* was var(--space-4) */
		transform: translateY(-50%);
	}

	.morph-modal__content {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		/* Room for the absolutely-positioned close/prev/next buttons so text
		   never runs under them. */
		padding: 2.5rem 2.5rem 0; /* was var(--space-10) var(--space-10) 0 */
		/* Mobile scrolls by touch, not by dragging a visible scrollbar thumb —
		   hiding it outright means nothing needs to clear the buttons.
		   Desktop keeps a visible scrollbar (mouse/trackpad users benefit
		   from the affordance) — reset at the breakpoint below. */
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* legacy Edge */
	}

	.morph-modal__content::-webkit-scrollbar {
		display: none; /* Chrome/Safari/mobile WebKit */
	}

	.morph-modal__panel {
		display: grid;
		/* Without this, the single implicit column sizes itself to its widest
		   content (auto), not the full available width. 1fr stretches the
		   column itself first. Reset at the breakpoint below, which declares
		   its own 3-column template. */
		grid-template-columns: 1fr;
		/* Mobile order: image first, then title/intro/tags/cta — reset
		   entirely at the breakpoint below. */
		grid-template-areas:
			'media'
			'title'
			'intro'
			'tags'
			'cta';
		gap: 1rem; /* was var(--space-4) */
	}

	.morph-modal__title {
		grid-area: title;
		margin: 0;
		font-family: 'Cormorant Garamond', Georgia, serif; /* was var(--font-display) */
		font-size: clamp(1.375rem, 1.155rem + 0.939vw, 2rem); /* was var(--fs-h3) */
		font-weight: 500; /* was var(--font-weight-medium) */
		line-height: 1.2; /* was var(--line-height-tight) */
	}

	.morph-modal__intro {
		grid-area: intro;
		margin: 0;
		font-family: 'DM Sans', system-ui, sans-serif; /* was var(--font-body) */
		font-size: clamp(0.9375rem, 0.894rem + 0.188vw, 1.0625rem); /* was var(--fs-body) */
		line-height: 1.75; /* was var(--line-height-loose) */
	}

	.morph-modal__media {
		grid-area: media;
		display: grid;
		place-items: center;
		/* Mobile: full-width square — reset to unconstrained sizing at the
		   breakpoint below, where media sits in its own narrower column. */
		width: 100%;
		aspect-ratio: 1 / 1;
	}

	.morph-modal__icon {
		/* Fills the square media box; object-fit: contain keeps the artwork's
		   own aspect ratio intact (most icons aren't square themselves)
		   rather than stretching it to fill the square. */
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.morph-modal__number {
		font-family: 'Cormorant Garamond', Georgia, serif; /* was var(--font-display) */
		font-size: clamp(3rem, 8vw, 5rem);
		font-weight: 500; /* was var(--font-weight-medium) */
		line-height: 1;
	}

	.morph-modal__tags {
		grid-area: tags;
	}

	.morph-modal__tags-title {
		margin: 0 0 0.5rem; /* was var(--space-2) */
		font-family: 'DM Sans', system-ui, sans-serif; /* was var(--font-body) */
		font-size: clamp(0.8125rem, 0.769rem + 0.188vw, 0.9375rem); /* was var(--fs-body-sm) */
		font-weight: 500; /* was var(--font-weight-medium) */
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.morph-modal__tags-list {
		margin: 0;
		padding-left: 1.25rem; /* was var(--space-5) */
		list-style: disc;
		display: flex;
		flex-direction: column;
		gap: 0.25rem; /* was var(--space-1) */
		font-family: 'DM Sans', system-ui, sans-serif; /* was var(--font-body) */
		font-size: clamp(0.8125rem, 0.769rem + 0.188vw, 0.9375rem); /* was var(--fs-body-sm) */
		line-height: 1.5; /* was var(--line-height-normal) */
	}

	.morph-modal__cta {
		grid-area: cta;
		justify-self: start;
		display: inline-block;
		margin-top: 0.5rem; /* was var(--space-2) */
		padding: 0.5rem 1.25rem; /* was var(--space-2) var(--space-5) */
		border-radius: 9999px; /* was var(--radius-full) */
		background: #d4a968; /* was var(--color-accent-gold) */
		color: #3d4a35; /* was var(--color-fg-forest) */
		font-family: 'DM Sans', system-ui, sans-serif; /* was var(--font-body) */
		font-size: clamp(0.875rem, 0.831rem + 0.188vw, 1rem); /* was var(--fs-cta) */
		font-weight: 500; /* was var(--font-weight-medium) */
		text-decoration: none;
	}

	.morph-modal__footnote {
		margin: 2rem 0 1.5rem; /* was var(--space-8) 0 var(--space-6) */
		padding-top: 1rem; /* was var(--space-4) */
		border-top: 1px solid color-mix(in srgb, #faf0e6 25%, transparent); /* was var(--color-bg-sand-25) */
		font-family: 'DM Sans', system-ui, sans-serif; /* was var(--font-body) */
		font-size: clamp(0.75rem, 0.662rem + 0.376vw, 1rem); /* was var(--fs-body-xs) */
		color: #faf0e6; /* was var(--color-bg-sand) */
		opacity: 0.8;
	}

	@media (min-width: 1024px) {
		.morph-modal__panel {
			grid-template-columns: 1fr auto 1fr;
			grid-template-areas:
				'title media tags'
				'intro media tags'
				'cta   media tags';
			align-items: start;
			column-gap: 2.5rem; /* was var(--space-10) */
		}

		.morph-modal__cta {
			align-self: start;
		}

		/* The full-width square above is a mobile-only concession to a small
		   viewport — restore unconstrained, auto-height sizing here, where
		   media sits in its own narrower column next to title/intro/tags. */
		.morph-modal__media {
			width: auto;
			aspect-ratio: auto;
			min-height: 8rem;
		}

		.morph-modal__icon {
			width: 100%;
			max-width: 12rem;
			height: auto;
		}

		/* Restore a visible scrollbar at this breakpoint — the hide is a
		   mobile-only concession to the touch-scroll pattern; desktop's
		   mouse/trackpad users benefit from seeing one. */
		.morph-modal__content {
			scrollbar-width: auto;
			-ms-overflow-style: auto;
		}

		.morph-modal__content::-webkit-scrollbar {
			display: block;
		}
	}
</style>
