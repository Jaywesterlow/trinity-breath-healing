<script lang="ts">
	/**
	 * A subpage's opening: eyebrow, <h1>, lead, stacked and centred. A heading and the text
	 * it introduces always sit one above the other, never side by side: split
	 * across a gutter they stop reading as one thing (proximity), and the eye
	 * has to hunt for where the sentence continues.
	 *
	 * An optional visual (a drawing, the portrait) sits above the whole text
	 * block, on the same centre line.
	 *
	 * The heading is the only <h1> on the page (checklist §A).
	 */
	import type { Snippet } from 'svelte';
	import { reveal } from '$lib/actions/reveal';

	interface Props {
		eyebrow?: string;
		lead?: string;
		/** Something to look at with the words: a drawing, a portrait. It sits
		 * above the text block, centred, on every width. */
		visual?: Snippet;
		children: Snippet;
	}
	let { eyebrow, lead, visual, children }: Props = $props();
</script>

<!-- Reveals per part, never on the header: title and lead together are well
     over a third of a phone screen, the band the reveal action keeps to
     (tests/integration/reveal-audit.spec.ts). The visual draws itself. -->
<header class="phead">
	{#if visual}
		<div class="phead__visual">{@render visual()}</div>
	{/if}
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
</header>

<style>
	/* Centred since 2026-10-29 (owner: "each sub page can have their title and
	   description centered, have a little bit more space below that"): the small
	   eyebrow over the big title, the home page's pairing, with the lead under it
	   and a drawing, when there is one, above the lot. Everything on one axis, so
	   the drawing sits over the words instead of beside them, and the content
	   starts well clear of the opening. */
	.phead {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-8);
		padding-top: var(--space-6);
		padding-bottom: calc(var(--block-gap) * 1.5);
		text-align: center;
	}

	.phead__text {
		display: flex;
		flex-direction: column;
		align-items: center;
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
		margin: 0 auto;
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
		text-wrap: pretty;
	}

	.phead__visual {
		/* Exposed so a wide drawing inside can size itself to fit the column
		   (see ServicePage's .service__art). */
		--phead-visual-h: 9rem;
		display: grid;
		place-items: center;
		height: var(--phead-visual-h);
		overflow: hidden;
	}

	@media (min-width: 1100px) {
		.phead__visual {
			--phead-visual-h: 11rem;
		}
	}
</style>
