<script lang="ts">
	/**
	 * The box every subpage sits in: the landing page's container, so the
	 * breadcrumb, the <h1> and the footer share one left edge on every width
	 * (tests/integration/page-grid.spec.ts holds that). The gutter is added to
	 * the max-width rather than taken out of it, so the content box is exactly
	 * --container-max. No reading measure here on purpose: each section decides
	 * how it uses the width (see PageSection), which is the point of the
	 * subpage layout — one 46rem column left of a 2000px-wide void was not.
	 */
	import type { Snippet } from 'svelte';
	let { children }: { children: Snippet } = $props();
</script>

<article class="page">
	{@render children()}
</article>

<style>
	.page {
		max-width: calc(var(--container-max) + 3rem);
		margin: 0 auto;
		padding: var(--space-8) 1.5rem var(--section-pad);
	}
</style>
