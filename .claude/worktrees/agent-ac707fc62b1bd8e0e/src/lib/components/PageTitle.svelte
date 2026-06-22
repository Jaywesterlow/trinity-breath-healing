<script lang="ts">
	/**
	 * PageTitle — enforces exactly one <h1> per page.
	 * Wraps a snippet in a single <h1> with display typography tokens.
	 * Requirements: SEO-02 (one H1 per page, defense in depth with Plan 08 audit gate)
	 */
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();
</script>

<h1>{#if children}{@render children()}{/if}</h1>

<style>
	h1 {
		font-family: var(--font-display, serif);
		font-size: var(--font-size-3xl, 2.25rem);
		line-height: var(--line-height-tight, 1.2);
		color: var(--color-fg-forest, #3a4530);
		/* Tokens land in Plan 06 global.css; forward references here are valid Svelte scoped CSS */
	}
</style>
