<script lang="ts">
	/**
	 * A quote in her own words. Two fonts on this site, so it stands out by size
	 * and space instead of a third typeface: the display serif at heading scale,
	 * a large mark above it, and more air around it than any other block on the page.
	 */
	import { reveal } from '$lib/actions/reveal';

	let { text, author }: { text: string; author: string } = $props();
</script>

<figure class="quote" use:reveal>
	<span class="quote__mark" aria-hidden="true">“</span>
	<blockquote class="quote__text">{text}</blockquote>
	<figcaption class="quote__author">{author}</figcaption>
</figure>

<style>
	.quote {
		margin: 0;
		padding-block: var(--space-16);
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.quote__mark {
		height: 0.5em;
		font-family: var(--font-display);
		font-size: 6rem;
		line-height: 1;
		color: var(--brand-border);
	}

	.quote__text {
		margin: 0;
		max-width: 34ch;
		font-family: var(--font-display);
		font-size: clamp(1.625rem, 3.2vw, 2.5rem);
		line-height: 1.3;
		color: var(--color-fg-forest);
		text-wrap: balance;
	}

	.quote__author {
		margin-top: var(--space-6);
		font-family: var(--font-body);
		font-size: var(--fs-body);
		color: var(--color-text-subtle);
	}
</style>
