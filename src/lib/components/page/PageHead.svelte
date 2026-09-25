<script lang="ts">
	/**
	 * A subpage's opening: eyebrow, <h1>, lead, stacked. A heading and the text
	 * it introduces always sit one above the other, never side by side: split
	 * across a gutter they stop reading as one thing (proximity), and the eye
	 * has to hunt for where the sentence continues.
	 *
	 * An optional visual (a drawing, the portrait) may sit beside the whole
	 * text block on desktop. That is an illustration next to a paragraph, not
	 * a title split from its description.
	 *
	 * The heading is the only <h1> on the page (checklist §A), and it starts at
	 * the container's left edge, where the breadcrumb and the footer start.
	 */
	import type { Snippet } from 'svelte';
	import { reveal } from '$lib/actions/reveal';

	interface Props {
		eyebrow?: string;
		lead?: string;
		/** Something to look at beside the words: a drawing, a portrait. On
		 * desktop it sits to the right of the text block; on a phone, under it. */
		visual?: Snippet;
		children: Snippet;
	}
	let { eyebrow, lead, visual, children }: Props = $props();
</script>

<!-- Reveals per part, never on the header: title and lead together are well
     over a third of a phone screen, the band the reveal action keeps to
     (tests/integration/reveal-audit.spec.ts). The visual draws itself. -->
<header class="phead" class:phead--visual={!!visual}>
	<div class="phead__text">
		<div class="phead__title" use:reveal>
			{#if eyebrow}
				<p class="phead__eyebrow">{eyebrow}</p>
			{/if}
			<h1 class="phead__h1">{@render children()}</h1>
		</div>
		{#if lead}
			<p class="phead__lead" use:reveal>{lead}</p>
		{/if}
	</div>
	{#if visual}
		<div class="phead__visual">{@render visual()}</div>
	{/if}
</header>

<style>
	.phead {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		padding-bottom: var(--block-gap);
	}

	.phead__text {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.phead__eyebrow {
		margin: 0 0 var(--space-2);
		font-family: var(--font-body);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-light);
		color: var(--brand-muted);
	}

	.phead__h1 {
		margin: 0;
		font-family: var(--font-display);
		/* The hero's own scale: a subpage title is the largest thing on its
		   page. */
		font-size: var(--fs-display);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		max-width: 22ch;
		text-wrap: balance;
	}

	.phead__lead {
		margin: 0;
		max-width: 46ch;
		font-family: var(--font-body);
		font-size: var(--fs-body-lg);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.phead__visual {
		display: grid;
		place-items: center;
		height: 14rem;
		overflow: hidden;
	}

	@media (min-width: 1100px) {
		/* Text block left, illustration right, bottoms aligned. Only when there
		   is an illustration; otherwise the text block simply stands alone. */
		/* The illustration sits right after the text column, not against the
		   container's far edge, so the two read as one opening rather than a
		   title with something floating a screen away. */
		.phead--visual {
			display: grid;
			grid-template-columns: minmax(0, 46rem) auto;
			justify-content: start;
			align-items: end;
			column-gap: var(--space-16);
		}

		.phead__visual {
			height: clamp(10rem, 16vw, 16rem);
		}
	}
</style>
