<script lang="ts">
	/**
	 * One section of a subpage: a heading and its content. On desktop the
	 * heading takes the left third and stays put while the content on the
	 * right scrolls past it, the way the landing page's "Over mij" ledger sets
	 * a label beside its rows. That is how a page of prose uses the width
	 * without stretching a line of text to 200 characters: the measure is on
	 * the content column, the page is still full-width.
	 *
	 * `wide` drops the two columns and lets the content run under the heading
	 * across the whole container — for grids of cards, steps, and anything
	 * else that is not a column of text.
	 */
	import type { Snippet } from 'svelte';
	import { reveal } from '$lib/actions/reveal';

	interface Props {
		id: string;
		title: string;
		eyebrow?: string;
		/** Content under the heading across the full container, not beside it. */
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
		max-width: 16ch;
		text-wrap: balance;
	}

	/* The measure lives on the content, see PageShell. Grids inside opt out by
	   being wider than this on their own (min-width: 0 keeps them honest). */
	.psec__body {
		min-width: 0;
	}

	.psec__body > :global(p) {
		max-width: 66ch;
	}

	@media (min-width: 1100px) {
		.psec {
			display: grid;
			grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
			column-gap: var(--space-12);
			align-items: start;
		}

		.psec__head {
			position: sticky;
			top: calc(var(--nav-height) + var(--space-8));
		}

		.psec--wide {
			grid-template-columns: minmax(0, 1fr);
		}

		.psec--wide .psec__head {
			position: static;
		}
	}
</style>
