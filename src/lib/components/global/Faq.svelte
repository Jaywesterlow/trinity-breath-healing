<script lang="ts">
	/**
	 * FAQ section — LND-07.
	 *
	 * Renders the same `faqItems` array that `src/routes/+page.ts` feeds to
	 * `buildFaqPage()` for the FAQPage JSON-LD in the landing page's @graph.
	 * Single source of truth: Google requires FAQPage markup to correspond to
	 * content visible on the same page, so these must never diverge.
	 *
	 * Native <details>/<summary> on purpose — no JS, fully present in the initial
	 * HTML for AI crawlers, and keyboard-accessible without an ARIA implementation.
	 */
	import { faqItems } from '$lib/content/faq/index';
</script>

<section class="faq" id="faq">
	<div class="faq__container">
		<header class="faq__header">
			<p class="faq__eyebrow">FAQ</p>
			<h2 class="faq__heading">Veelgestelde vragen</h2>
		</header>

		<div class="faq__list">
			{#each faqItems as item (item.question)}
				<details class="faq__item">
					<summary class="faq__question">
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
					<p class="faq__answer">{item.answer}</p>
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
		padding-bottom: var(--space-5);
		font-size: var(--font-size-base);
		line-height: var(--line-height-loose);
		color: var(--color-fg-forest);
	}

	@media (min-width: 1024px) {
		.faq {
			padding-block: var(--space-16);
		}
	}
</style>
