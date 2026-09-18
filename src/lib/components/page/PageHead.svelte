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
		/** Something to look at beside the words: a drawing, a numeral. On
		 * desktop it takes the right end of the row; on a phone it sits under
		 * the lead. */
		visual?: Snippet;
		children: Snippet;
	}
	let { eyebrow, lead, visual, children }: Props = $props();
</script>

<!-- Reveals per part, never on the header: title and lead together are
     well over a third of a phone screen, the band the reveal action keeps
     to (tests/integration/reveal-audit.spec.ts). The visual draws itself. -->
<header class="phead">
	<div class="phead__title" use:reveal>
		{#if eyebrow}
			<p class="phead__eyebrow">{eyebrow}</p>
		{/if}
		<h1 class="phead__h1">{@render children()}</h1>
	</div>
	{#if lead}
		<p class="phead__lead" use:reveal>{lead}</p>
	{/if}
	{#if visual}
		<div class="phead__visual">{@render visual()}</div>
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
		.phead {
			display: grid;
			grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
			align-items: end;
			column-gap: var(--space-12);
		}

		.phead:has(.phead__visual) {
			grid-template-columns: minmax(0, 6fr) minmax(0, 4fr) auto;
		}

		.phead__visual {
			height: clamp(10rem, 16vw, 16rem);
			justify-self: end;
		}

		.phead__lead {
			/* A little above the heading's baseline: the lead's last line and the
			   heading's last line then read as one row rather than the lead
			   hanging under it. */
			padding-bottom: 0.35em;
		}
	}
</style>
