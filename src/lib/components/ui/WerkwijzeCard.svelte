<script lang="ts">
	import type { Picture } from 'vite-imagetools';
	import { reveal } from '$lib/actions/reveal';

	let {
		title,
		body,
		image
	}: {
		title: string;
		body: string;
		/** The whole card's image (approved in Figma 2026-10-24): 9:16, texture on top,
		 *  illustration at the bottom, on the site green. Covers the card, anchored to the
		 *  bottom, so a taller card shows more of the calm top and never loses the drawing. */
		image: Picture;
	} = $props();
</script>

<article class="wcard">
	<!-- Decorative: the title and body say what the step is. Lazy: the section is well below
	     the fold, and the browser's lazy margin starts the fetch long before the staircase
	     brings the cards into view. -->
	<picture class="wcard__media">
		{#each Object.entries(image.sources) as [format, srcset] (format)}
			<source type="image/{format}" {srcset} sizes="(min-width: 1100px) 408px, 100vw" />
		{/each}
		<img
			src={image.img.src}
			width={image.img.w}
			height={image.img.h}
			alt=""
			loading="lazy"
			decoding="async"
		/>
	</picture>

	<!-- `exit: false` because the way out belongs to the row, not to these lines: Werkwijze
	     fades whole cards (the staircase on desktop). Nothing in this file writes `opacity`
	     on the card itself; the <li> around it is the one element that fades. -->
	<h3 class="wcard__title" use:reveal={{ exit: false }}>{title}</h3>
	<p class="wcard__body" use:reveal={{ exit: false }}>{body}</p>
</article>

<style>
	/* Figma "Werkwijze (redesign) — chosen": 408×580, radius 24, 36px padding, title
	   Cormorant 32/1.15, body DM Sans 16/26, 16px between them. The image is the card; the
	   site green under it is the fallback while it loads. The illustration takes the lower
	   ~330px, so that much is kept clear under the text (padding-bottom), and the card grows
	   rather than letting a longer text run into the drawing on a narrower card. */
	.wcard {
		position: relative;
		isolation: isolate;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		width: 100%;
		height: 100%;
		min-height: 36.25rem; /* 580px */
		padding: 2.25rem 2.25rem 20.5rem; /* 36px; 328px for the illustration */
		border-radius: 1.5rem; /* 24px */
		overflow: hidden;
		background: var(--color-brand-green);
		color: var(--color-bg-sand);
	}

	.wcard__media {
		position: absolute;
		inset: 0;
		z-index: -1;
	}

	.wcard__media img {
		display: block;
		width: 100%;
		height: 100%;
		max-width: none;
		object-fit: cover;
		object-position: bottom;
	}

	.wcard__title {
		font-family: var(--font-display);
		font-size: 2rem; /* 32px */
		font-weight: var(--font-weight-medium);
		line-height: 1.15;
	}

	.wcard__body {
		font-family: var(--font-body);
		font-size: 1rem; /* 16px */
		line-height: 1.625; /* 26px */
	}
</style>
