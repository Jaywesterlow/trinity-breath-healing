<script lang="ts">
	import ButtonLink from '$lib/components/ui/interactions/ButtonLink.svelte';
	import DrawOn from '$lib/components/ui/DrawOn.svelte';
	import { reveal } from '$lib/actions/reveal';

	let {
		variant,
		title,
		body,
		imgSrc,
		imgWidth,
		imgHeight,
		artSvg,
		ctaHref,
		ctaLabel
	}: {
		variant: 'filled' | 'outline';
		title: string;
		body: string;
		imgSrc?: string;
		/** Intrinsic pixel dimensions of `imgSrc`. Present so the box is reserved before the
		 *  image arrives — the CSS below fixes the rendered size either way, so these never
		 *  change the layout, they only stop it from being unknown for a frame. Both are
		 *  required together; one alone would hand the UA a bogus aspect ratio. */
		imgWidth?: number;
		imgHeight?: number;
		/** Raw inline SVG for the card art — draws itself on scroll-in. Outline: backdrop art
		 *  bleeding behind the text. Filled: the `.wcard__img` slot. `imgSrc` stays as a fallback
		 *  for art that hasn't been traced yet (or never will be, e.g. raster-only assets). */
		artSvg?: string;
		ctaHref?: string;
		ctaLabel?: string;
	} = $props();
</script>

<article
	class="wcard"
	class:wcard--filled={variant === 'filled'}
	class:wcard--outline={variant === 'outline'}
>
	{#if variant === 'outline'}
		{#if artSvg}
			<!-- Draws itself. The art is deliberately NOT faded in: a fade would cross-dissolve
			     the very strokes that are meant to appear one at a time. -->
			<DrawOn svg={artSvg} class="wcard__art-draw" />
		{:else if imgSrc}
			<img
				src={imgSrc}
				alt=""
				aria-hidden="true"
				class="wcard__art"
				width={imgWidth}
				height={imgHeight}
				decoding="async"
			/>
		{/if}
	{/if}

	<!-- Text fades; the art draws. Cards 2 and 3 sit horizontally outside the viewport until
	     the pan brings them in, and the observer only fires on intersection — so each card's
	     text arrives as that card does, rather than all three firing when the section opens. -->
	<h3 class="wcard__title" use:reveal={{ delay: 0 }}>{title}</h3>
	<p class="wcard__body" use:reveal={{ delay: 110 }}>{body}</p>

	{#if variant === 'filled'}
		{#if artSvg}
			<!-- Draws itself; see the outline variant above. -->
			<DrawOn svg={artSvg} class="wcard__img-draw" />
		{:else if imgSrc}
			<img
				src={imgSrc}
				alt=""
				aria-hidden="true"
				class="wcard__img"
				width={imgWidth}
				height={imgHeight}
				decoding="async"
			/>
		{/if}
	{/if}

	{#if ctaHref && ctaLabel}
		<div class="wcard__cta" use:reveal={{ delay: 220 }}>
			<ButtonLink href={ctaHref} label={ctaLabel} withArrow block />
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
		background: var(--color-brand-green);
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

	/* Same geometry whether the art is a raster <img> (fallback) or the inlined, self-drawing
	   <svg> (DrawOn is display:contents, so it takes the <img>'s place in this flex layout).
	   object-fit has no effect on an inline SVG; its equivalent, preserveAspectRatio="slice", is
	   expected to be baked into the generated file, same as the outline variant's art. :global()
	   because {@html} content gets no scoping class. Targeted via .wcard--filled (a real class
	   binding on <article>, always present in this component's own template), not via the class
	   prop passed down to <DrawOn> — that prop only becomes a class name inside DrawOn's own
	   markup, a different component, so selecting on it here would be an always-unused selector
	   as far as svelte-check's static analysis of this file can tell. Same precedent as the
	   outline variant's .wcard--outline :global(svg.lt) below. */
	/* `.drawon--layers` is the wrapper DrawOn uses when the art ships as stacked layers: it takes
	   the slot the single <svg> would have, and the layers position against it. Same geometry
	   either way. */
	.wcard__img,
	.wcard--filled :global(svg.lt),
	.wcard--filled :global(.drawon--layers) {
		display: block;
		width: 100%;
		flex: 1 1 0%; /* fills whatever vertical space the title+body don't use — never overflows the fixed card height */
		min-height: 0;
		object-fit: cover;
	}

	/* Same geometry whether the art is a raster <img> or the inlined, self-drawing <svg>.
	   object-fit has no effect on an inline SVG — its equivalent, preserveAspectRatio="slice",
	   is baked into the generated file. :global() because {@html} content gets no scoping
	   class; the scoped .wcard parent keeps it contained. Scoped to --outline only: the filled
	   variant's inline svg (.wcard__img-draw above) needs normal flex-flow sizing, not this
	   absolute-position backdrop treatment. */
	.wcard__art,
	.wcard--outline :global(svg.lt) {
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
