<script lang="ts">
	/**
	 * FAQ section — LND-07.
	 *
	 * Renders the same `faqItems` array that `src/routes/+page.ts` feeds to
	 * `buildFaqPage()` for the FAQPage JSON-LD in the landing page's @graph.
	 * Single source of truth: Google requires FAQPage markup to correspond to
	 * content visible on the same page, so these must never diverge.
	 *
	 * Native <details>/<summary> on purpose — fully present in the initial HTML for
	 * AI crawlers, and keyboard-accessible without an ARIA implementation.
	 *
	 * Opening animates in pure CSS. Closing cannot: the moment `open` is removed the
	 * UA stops rendering the panel, so there is nothing left on screen to collapse.
	 * `transition-behavior: allow-discrete` on `content-visibility` is supposed to
	 * hold it visible for the duration, and does in Chromium — but not everywhere,
	 * and where it doesn't the panel simply vanishes with no closing animation at all.
	 * So the close is driven here instead: intercept the click, collapse the panel
	 * while `open` is still set, and only then remove it.
	 *
	 * This is a progressive enhancement in the strict sense. It runs on interaction
	 * only. It renders nothing, gates nothing, and touches no markup — every question
	 * and answer is in the initial HTML either way, which is the reason this section
	 * is built on <details> in the first place. Without JS the panel still opens with
	 * its animation and closes instantly, exactly as a native <details> would.
	 */
	import { faqItems } from '$lib/content/faq/index';
	import { reveal } from '$lib/actions/reveal';

	/**
	 * showHeading — defaults true so the landing page (which has no <h1> of its own above
	 * this section) is unaffected. `/faq` renders its own <h1> via <PageTitle> and passes
	 * `false` here to avoid a redundant "Veelgestelde vragen" heading directly beneath it —
	 * two headings with identical text back to back is not a heading-level skip, but it is
	 * noise neither a reader nor a crawler needs.
	 */
	let { showHeading = true }: { showHeading?: boolean } = $props();

	/** Longest the close is allowed to take before we stop waiting for transitionend. */
	const CLOSE_TIMEOUT = 800;

	function onListClick(event: MouseEvent) {
		const target = event.target;
		if (!(target instanceof Element)) return;

		/* Either half of an open row closes it: the question, or the answer under
		   it. The answer is not a <summary>, so the browser does nothing with a
		   click there — this is what makes it act like one. */
		const control = target.closest('summary, .faq__answer');
		if (!control) return;
		const found = control.closest('details.faq__item');
		if (!(found instanceof HTMLDetailsElement)) return;
		const item = found;
		const fromAnswer = !control.matches('summary');

		// Clicked again mid-close: cancel the collapse and leave the panel open, rather
		// than queueing a second one against the first.
		if (item.hasAttribute('data-closing')) {
			event.preventDefault();
			item.removeAttribute('data-closing');
			return;
		}

		// Opening is the browser's job — the CSS handles it and native behaviour is better
		// than anything reimplemented here. Same when motion is not wanted.
		if (!item.open) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			// The answer still has to close it; only the animation is skipped.
			if (fromAnswer) item.open = false;
			return;
		}

		// Closing: keep `open` set so the panel stays rendered, and let the CSS collapse it.
		event.preventDefault();
		item.setAttribute('data-closing', '');

		let settled = false;
		let timer: ReturnType<typeof setTimeout>;

		function finish() {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			item.removeEventListener('transitionend', onEnd);
			// Absent if a second click cancelled the close while it was running.
			if (item.hasAttribute('data-closing')) {
				item.removeAttribute('data-closing');
				item.open = false;
			}
		}

		function onEnd(e: TransitionEvent) {
			// Only this element's own row transition — not opacity, and not anything
			// bubbling up from the answer inside.
			if (e.target === item && e.propertyName === 'grid-template-rows') finish();
		}

		item.addEventListener('transitionend', onEnd);
		// transitionend does not fire if the transition is interrupted or never starts
		// (a display change, a background tab). Without this the panel would be stuck open.
		timer = setTimeout(finish, CLOSE_TIMEOUT);
	}
</script>

<section class="faq" id="faq">
	<div class="faq__container">
		{#if showHeading}
			<header class="faq__header">
				<p class="faq__eyebrow" use:reveal={{ delay: 0 }}>FAQ</p>
				<h2 class="faq__heading" use:reveal={{ delay: 120 }}>Veelgestelde vragen</h2>
			</header>
		{/if}

		<!-- Delegated: the click always originates on a native <summary>, which is already a
		     keyboard-operable control, so Enter and Space reach this handler as clicks too. This
		     div introduces no interactive surface of its own and must not claim a role — giving
		     it one would announce a control to screen readers that does not exist. -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="faq__list" onclick={onListClick}>
			{#each faqItems as item, i (item.question)}
				<details
					class="faq__item"
					use:reveal={{
						delay: Math.min(240 + i * 90, 240 + 6 * 90),
						/* No rise here: this element owns its own grid-template-rows disclosure
						   transition (open/close, see the style block below). Animating its
						   transform — even via Web Animations, even to a no-op offset — promotes
						   it onto its own compositing layer for the animation's duration, and
						   that promotion left it unable to run its close transition afterwards,
						   confirmed empirically in isolation (see reveal.ts's doc comment). Fade
						   only; opacity is unaffected by this. */
						distance: 0
					}}
				>
					<!-- data-cursor: the pointer becomes a filled circle with a + over a
					     closed row and turns 45deg into a × when it opens. -->
					<summary class="faq__question" data-cursor="toggle">
						<span>{item.question}</span>
						<svg class="faq__chevron" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
							<polyline
								points="5,8 10,13 15,8"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
					</summary>
					<!-- The answer closes the row too. Reading to the end and having to
					     travel back up to the question to shut it is a small annoyance
					     that costs nothing to remove — and it means the disclosure
					     cursor holds all the way down the open row instead of
					     changing halfway. -->
					<p class="faq__answer" data-cursor="toggle">{item.answer}</p>
				</details>
			{/each}
		</div>
	</div>
</section>

<style>
	.faq {
		background: var(--color-bg-sand);
		padding-block: var(--space-12);

		/* Local to this section rather than the global motion tokens: --motion-base (250ms) with
		   --ease-out (a steep expo curve, ~80% travelled in its first quarter) put nearly all of
		   the movement into the first ~100ms, which reads as a snap however long the transition
		   nominally lasts. A disclosure wants the opposite — motion spread across the middle, so
		   the panel is visibly on its way. Opening is given longer than closing: opening is the
		   part worth watching, closing just needs to not vanish. */
		--faq-open: 480ms;
		--faq-close: 380ms;
		--faq-ease: cubic-bezier(0.4, 0, 0.2, 1);
	}

	.faq__container {
		max-width: var(--container-max); /* 1200px — same cap as nav/footer/hero, so edges line up */
		margin-inline: auto;
		padding-inline: var(--space-6);
	}

	.faq__header {
		margin-bottom: var(--space-8);
	}

	/* Two columns from 1024px up: the header holds the left one on its own and
	   the questions fill the right. The header does NOT stretch to match the
	   list — the empty space under it is the point, and a section this dense
	   needs somewhere to breathe. See the breakpoint at the bottom. */

	/* Matches the eyebrow treatment in Werkwijze/Behandelingen so all landing
	   sections share one header rhythm. */
	.faq__eyebrow {
		font-family: var(--font-body);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-light);
		color: var(--brand-muted);
		margin-bottom: var(--space-2);
	}

	.faq__heading {
		font-family: var(--font-display);
		font-size: var(--fs-h2); /* clamp 28→48px, same fluid scale as sibling section headings */
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
	}

	.faq__list {
		display: flex;
		flex-direction: column;
	}

	/* Opening a <details> is, by default, instantaneous: the answer appears in one frame and the
	   bottom rule jumps down with it. To ease that, the panel needs to be a box whose size can
	   be transitioned — so the <details> itself becomes a two-row grid (summary, then content)
	   and the content row is animated from 0fr to 1fr. The bottom rule lives on this element,
	   so it rides the growing row down rather than jumping.

	   `grid-template-rows` rather than `block-size: auto`, which cannot be transitioned without
	   `interpolate-size: allow-keywords` — Chromium-only as of mid-2026, where Firefox and
	   Safari would simply snap. The fr-unit transition works in every engine that supports
	   ::details-content, which has been Baseline since September 2025. */
	.faq__item {
		border-bottom: 1px solid var(--color-border);
		display: grid;
		/* min-content, NOT auto, for the summary row. An `auto` track absorbs free space, and
		   mid-transition there is a moment where the content row is still too small to hold the
		   answer — so the summary row swallowed the difference and the question text visibly
		   dropped ~65px and sprang back on every open. Measured: `auto` peaks the summary row at
		   129px against its natural 64px; `min-content` holds it at 64px for the whole
		   transition. The question must not move — only the panel beneath it. */
		grid-template-rows: min-content 0fr;
		transition: grid-template-rows var(--faq-close) var(--faq-ease);
	}

	.faq__item[open] {
		grid-template-rows: min-content 1fr;
		transition-duration: var(--faq-open);
	}

	/* The closing state, held by the script while `open` is still set — which is the point:
	   the panel is still being rendered, so there is something on screen to collapse. Once the
	   row transition finishes the script drops `open`, by which time the panel is already at
	   zero height and removing it changes nothing visible. */
	.faq__item[open]:global([data-closing]) {
		grid-template-rows: min-content 0fr;
		transition-duration: var(--faq-close);
	}

	/* The UA sets content-visibility: hidden on this box while the panel is closed, which would
	   otherwise cut the transition off at the first frame — there is nothing to animate if the
	   content is not being rendered. `allow-discrete` holds it visible for the whole duration
	   instead, so the open and the close both play out. */
	/* Closing state. The content-visibility duration has to match the collapse, not the fade:
	   the UA sets content-visibility: hidden the instant the panel closes, and without holding
	   it visible for the full collapse the panel would blink out and leave an empty box sliding
	   shut. The answer fades out well before that, so the space closes on nothing. */
	.faq__item::details-content {
		overflow: hidden;
		opacity: 0;
		transition:
			opacity 140ms ease,
			content-visibility var(--faq-close) allow-discrete;
	}

	/* Opening state. The fade waits out the first third of the slide, so the answer arrives into
	   space already made for it rather than appearing against a closed edge. */
	.faq__item[open]::details-content {
		opacity: 1;
		transition:
			opacity 320ms ease 160ms,
			content-visibility var(--faq-open) allow-discrete;
	}

	/* Fades out ahead of the collapse, so the space closes on nothing rather than squeezing
	   legible text. No content-visibility here — `open` is still set, so the panel is rendering
	   normally and there is nothing to hold visible. */
	.faq__item[open]:global([data-closing])::details-content {
		opacity: 0;
		transition: opacity 140ms ease;
	}

	.faq__question {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
		padding-block: var(--space-5);
		cursor: pointer;
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-medium);
		color: var(--color-fg-forest);
		list-style: none;
		min-height: 44px; /* WCAG 2.2 AA target size */
	}

	/* Suppress the native disclosure triangle in both engines — the chevron SVG replaces it. */
	.faq__question::marker,
	.faq__question::-webkit-details-marker {
		display: none;
	}

	.faq__question span {
		flex: 1;
	}

	/* Matched to the panel it describes — at 150ms the chevron finished long before the answer
	   had, which made the whole thing feel disjointed. */
	.faq__chevron {
		flex-shrink: 0;
		transition: transform var(--faq-close) var(--faq-ease);
	}

	.faq__item[open] .faq__chevron {
		transition-duration: var(--faq-open);
	}

	/* `open` is still set during the close, so without this the chevron would stay rotated
	   until the very end and then snap back. */
	.faq__item[open]:global([data-closing]) .faq__chevron {
		transform: rotate(0deg);
		transition-duration: var(--faq-close);
	}

	.faq__item[open] .faq__chevron {
		transform: rotate(180deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.faq__chevron,
		.faq__item,
		.faq__item::details-content {
			transition: none;
		}

		/* Without the transition the opacity rule would leave the answer permanently invisible. */
		.faq__item::details-content {
			opacity: 1;
		}
	}

	.faq__answer {
		cursor: pointer;
		padding-bottom: var(--space-5);
		font-size: var(--font-size-base);
		line-height: var(--line-height-loose);
		color: var(--color-fg-forest);
	}

	@media (min-width: 1024px) {
		.faq {
			padding-block: var(--space-16);
		}

		.faq__container {
			display: grid;
			/* 5fr/7fr rather than half and half: a question is a line of text and
			   wants the room; a two-line heading does not. */
			grid-template-columns: 5fr 7fr;
			gap: var(--space-12);
			align-items: start;
		}

		.faq__header {
			margin-bottom: 0;
		}

		.faq__eyebrow {
			margin-bottom: var(--space-3);
		}
	}
</style>
