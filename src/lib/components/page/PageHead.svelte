<script lang="ts">
	/**
	 * A subpage's opening: eyebrow, <h1>, lead. On desktop the heading and the
	 * lead share one row — heading left, lead right, both on the baseline —
	 * so the first thing on the page already spans the container the way the
	 * landing page's sections do. Below 1100px it is a stack.
	 *
	 * The heading is the only <h1> on the page (checklist §A), and it starts at
	 * the container's left edge, where the breadcrumb and the footer start.
	 */
	import type { Snippet } from 'svelte';
	import { reveal } from '$lib/actions/reveal';

	interface Props {
		eyebrow?: string;
		lead?: string;
		children: Snippet;
	}
	let { eyebrow, lead, children }: Props = $props();
</script>

<header class="phead" use:reveal>
	<div class="phead__title">
		{#if eyebrow}
			<p class="phead__eyebrow">{eyebrow}</p>
		{/if}
		<h1 class="phead__h1">{@render children()}</h1>
	</div>
	{#if lead}
		<p class="phead__lead">{lead}</p>
	{/if}
</header>

<style>
	.phead {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		padding-bottom: var(--block-gap);
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
		/* The hero's own scale, one step under it: a subpage title is the largest
		   thing on its page but not a hero. */
		font-size: var(--fs-display);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		max-width: 20ch;
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

	@media (min-width: 1100px) {
		.phead {
			display: grid;
			grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
			align-items: end;
			column-gap: var(--space-12);
		}

		.phead__lead {
			/* A little above the heading's baseline: the lead's last line and the
			   heading's last line then read as one row rather than the lead
			   hanging under it. */
			padding-bottom: 0.35em;
		}
	}
</style>
