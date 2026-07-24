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

	.faq__item {
		border-bottom: 1px solid var(--color-border);
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

	.faq__chevron {
		flex-shrink: 0;
		transition: transform var(--motion-fast) var(--ease-out);
	}

	.faq__item[open] .faq__chevron {
		transform: rotate(180deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.faq__chevron {
			transition: none;
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
