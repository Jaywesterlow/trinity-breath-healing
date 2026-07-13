<script lang="ts">
	import ButtonLink from '$lib/components/ui/interactions/ButtonLink.svelte';

	let {
		variant,
		title,
		body,
		imgSrc,
		ctaHref,
		ctaLabel
	}: {
		variant: 'filled' | 'outline';
		title: string;
		body: string;
		imgSrc: string;
		ctaHref?: string;
		ctaLabel?: string;
	} = $props();
</script>

<article class="wcard" class:wcard--filled={variant === 'filled'} class:wcard--outline={variant === 'outline'}>
	{#if variant === 'outline'}
		<img src={imgSrc} alt="" aria-hidden="true" class="wcard__art" />
	{/if}

	<h3 class="wcard__title">{title}</h3>
	<p class="wcard__body">{body}</p>

	{#if variant === 'filled'}
		<img src={imgSrc} alt="" aria-hidden="true" class="wcard__img" />
	{/if}

	{#if ctaHref && ctaLabel}
		<div class="wcard__cta">
			<ButtonLink href={ctaHref} label={ctaLabel} withArrow />
		</div>
	{/if}
</article>

<style>
	.wcard {
		position: relative;
		flex-shrink: 0;
		scroll-snap-align: center;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		width: 17.625rem; /* 282px — Figma spec */
		height: 28.688rem; /* 459px — Figma spec, rounded to 3dp */
		padding: var(--space-4); /* equal on all sides */
		gap: var(--space-4);
		border-radius: 1.563rem; /* 25px — Figma spec; --radius-lg (16px) is 9px off, too large to round */
		overflow: hidden;
	}

	.wcard--filled {
		background: var(--color-fg-forest);
		color: var(--color-bg-sand);
		align-items: flex-start;
		text-align: left;
		justify-content: flex-start; /* text pinned to top; image fills the remainder */
	}

	.wcard--outline {
		background: var(--color-bg-sand);
		color: var(--color-fg-forest);
		align-items: flex-start;
		justify-content: flex-end; /* art bleeds the top; text+CTA sit in the lower half, per Figma */
		border: 2px solid var(--brand-muted);
	}

	.wcard__title {
		position: relative;
		z-index: 1;
		width: 100%;
		font-family: var(--font-display);
		font-size: var(--font-size-2xl); /* clamp 24→32px; Figma spec is fixed 24px */
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
	}

	.wcard__body {
		position: relative;
		z-index: 1;
		width: 100%;
		font-family: var(--font-body);
		font-size: var(--fs-body); /* clamp 15→17px; Figma spec is fixed 16px */
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
	}

	.wcard--filled .wcard__body {
		color: var(--color-bg-sand);
	}

	.wcard--outline .wcard__body {
		color: var(--color-text-subtle);
	}

	.wcard__img {
		width: 100%;
		flex: 1 1 0%; /* fills whatever vertical space the title+body don't use — never overflows the fixed card height */
		min-height: 0;
		object-fit: cover;
	}

	.wcard__art {
		position: absolute;
		top: 1.723rem; /* 27.56px — Figma spec offset, rounded to 3dp */
		left: -0.125rem; /* -2px — Figma spec */
		z-index: 0;
		width: 24.847rem; /* 397.55px — Figma spec; wider than the card, clipped by wcard's overflow:hidden */
		max-width: none; /* global.css caps all <img> at max-width:100% — this art intentionally bleeds past the card edge */
		height: 13.553rem; /* 216.85px — Figma spec, rounded to 3dp */
		object-fit: cover;
		pointer-events: none;
	}

	.wcard__cta {
		position: relative;
		z-index: 1;
		width: 100%;
	}
</style>
