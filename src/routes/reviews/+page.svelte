<script lang="ts">
	/**
	 * /reviews — three clients in their own words (sent by Marvin on their behalf,
	 * 17 Nov 2026, confirmed by Brigitte). First names only, text verbatim, two in
	 * English and kept that way. Each opens with its first two blocks; the rest is in a
	 * native <details>, so the whole review is in the HTML for crawlers either way.
	 *
	 * No Review/AggregateRating JSON-LD: there are no star ratings to report, and Google
	 * does not show self-hosted reviews of the business itself as rich results.
	 */
	import { Breadcrumbs } from '$lib/components/ui';
	import { PageShell, PageHead, PageSection, CtaBand } from '$lib/components/page';
	import { BRAND } from '$lib/constants/brand';
	import { REVIEWS } from '$lib/content/reviews';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const OPEN_BLOCKS = 2;
</script>

<Breadcrumbs items={data.crumbs} />

<PageShell>
	<PageHead eyebrow="Reviews" lead={data.lead}>Ervaringen van cliënten</PageHead>

	{#each REVIEWS as review (review.id)}
		<div class="review" lang={review.lang}>
			<PageSection id="review-{review.id}" eyebrow={review.name} title={review.title}>
				{#if review.subtitle}
					<p class="review__subtitle">{review.subtitle}</p>
				{/if}
				{#each review.blocks.slice(0, OPEN_BLOCKS) as block, i (i)}
					<p class="review__p">{block.text}</p>
				{/each}
				{#if review.blocks.length > OPEN_BLOCKS}
					<details class="review__more">
						<summary class="review__toggle" lang="nl">
							<span class="review__toggle-closed">Lees verder</span>
							<span class="review__toggle-open">Minder tonen</span>
						</summary>
						{#each review.blocks.slice(OPEN_BLOCKS) as block, i (i)}
							{#if block.kind === 'heading'}
								<h3 class="review__h3">{block.text}</h3>
							{:else}
								<p class="review__p">{block.text}</p>
							{/if}
						{/each}
					</details>
				{/if}
				<p class="review__sign">— {review.name}</p>
			</PageSection>
		</div>
	{/each}

	<CtaBand
		id="kennismaken"
		title="Vrijblijvende kennismaking"
		lead="Een kennismakingsgesprek van 30 minuten is kosteloos en vrijblijvend. Tijdens dit gesprek bespreken we jouw wensen en kijken we samen welke behandeling bij jou past."
		label="Plan een kennismaking"
		href="/contact"
		note={BRAND.disclaimer}
	/>
</PageShell>

<style>
	.review__subtitle {
		margin: 0 0 var(--space-4);
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-style: italic;
		color: var(--color-text-subtle);
	}

	.review__p {
		margin: 0 0 var(--space-4);
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}

	.review__h3 {
		margin: var(--space-6) 0 var(--space-3);
		font-family: var(--font-display);
		font-size: var(--fs-h3);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
	}

	.review__toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: 500;
		color: var(--color-fg-forest);
		text-decoration: underline;
		text-underline-offset: 0.2em;
		cursor: pointer;
		list-style: none;
	}

	.review__toggle::-webkit-details-marker {
		display: none;
	}

	.review__toggle:focus-visible {
		outline: 2px solid var(--color-fg-forest);
		outline-offset: 4px;
		border-radius: 2px;
	}

	.review__toggle-open,
	.review__more[open] .review__toggle-closed {
		display: none;
	}

	.review__more[open] .review__toggle-open {
		display: inline;
	}

	/* Open, the toggle moves to the end, under the text it just revealed. */
	.review__more[open] {
		display: flex;
		flex-direction: column;
	}

	.review__more[open] .review__toggle {
		order: 1;
		align-self: flex-start;
	}

	.review__sign {
		margin: 0;
		font-family: var(--font-display);
		font-size: var(--fs-h3);
		color: var(--color-fg-forest);
	}
</style>
