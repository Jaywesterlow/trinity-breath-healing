<script lang="ts">
	/**
	 * One section of a subpage: a heading, and under it its content. Stacked
	 * on every width. A heading placed in a column beside its content reads as
	 * a label for something else; above it, it reads as the start of the same
	 * thought (proximity). An earlier version put the heading in a sticky left
	 * third to use the width, and that was the mistake: width is used by
	 * content that is genuinely wide (a grid of cards, a row of steps), never
	 * by pulling a heading away from its text.
	 *
	 * `wide` lets the content run the full container, for grids. Without it
	 * the content keeps a reading measure.
	 */
	import type { Snippet } from 'svelte';
	import { reveal } from '$lib/actions/reveal';

	interface Props {
		id: string;
		title: string;
		eyebrow?: string;
		/** Content across the full container (card grids, rows of steps). */
		wide?: boolean;
		children: Snippet;
	}
	let { id, title, eyebrow, wide = false, children }: Props = $props();
</script>

<section class="psec" class:psec--wide={wide} aria-labelledby={id}>
	<div class="psec__head" use:reveal>
		{#if eyebrow}
			<p class="psec__eyebrow">{eyebrow}</p>
		{/if}
		<h2 {id} class="psec__h2">{title}</h2>
	</div>
	<div class="psec__body">
		{@render children()}
	</div>
</section>

<style>
	.psec {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		padding-block: var(--block-gap);
		border-top: 1px solid color-mix(in srgb, var(--brand-border) 28%, transparent);
	}

	.psec__eyebrow {
		margin: 0 0 var(--space-2);
		font-family: var(--font-body);
		font-size: var(--fs-label);
		font-weight: var(--font-weight-medium);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--brand-muted);
	}

	.psec__h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		max-width: 22ch;
		text-wrap: balance;
	}

	/* The reading measure: the same column the heading sits at the top of. */
	.psec__body {
		min-width: 0;
		max-width: 46rem;
	}

	.psec--wide .psec__body {
		max-width: none;
	}
</style>
