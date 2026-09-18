<script lang="ts">
	import DrawOn from '$lib/components/ui/DrawOn.svelte';

	interface Props {
		iconSrc?: string;
		/** Raw inline SVG for the icon glyph — draws itself on scroll-in. Falls back to
		 *  `iconSrc` (a plain <img>) for icons that haven't been traced yet, e.g. infinity.png. */
		artSvg?: string;
		title: string;
		body: string;
		/* Icon source files don't crop their glyph to a consistent fraction of the
		   canvas — e.g. heart.png's glyph fills ~87% of its image, sprout.png's only
		   ~65% — so the same box size renders visibly smaller for sprout. Lets the
		   caller compensate per-icon instead of hardcoding filenames into this
		   reusable component. */
		iconScale?: number;
	}

	let { iconSrc, artSvg, title, body, iconScale = 1 }: Props = $props();
</script>

<div class="feature">
	<div class="feature__badge" style="--icon-scale: {iconScale}">
		{#if artSvg}
			<DrawOn svg={artSvg} class="feature__icon-draw" />
		{:else if iconSrc}
			<img src={iconSrc} alt="" aria-hidden="true" class="feature__icon" />
		{/if}
	</div>
	<div class="feature__text">
		<h3 class="feature__title">{title}</h3>
		<p class="feature__body">{body}</p>
	</div>
</div>

<style>
	.feature {
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
	}

	.feature__badge {
		flex-shrink: 0;
		width: 4.688rem; /* 75px — Figma spec, no token match */
		height: 4.688rem;
		border-radius: 50%;
		overflow: hidden;
		/* The art is a mask with a near-sand stroke and no ground of its own, so
		   this circle IS the ground — same green as every other filled surface. */
		background: var(--color-brand-green);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Base size chosen so heart.png (the denser glyph) sits with a clean, centered
	   margin instead of touching the circle's inscribed boundary. --icon-scale lets
	   individual icons (e.g. sprout.png, whose glyph occupies less of its own canvas)
	   compensate so they read as visually the same size — see AboutFeature's iconScale prop. */
	/* Same geometry for the inlined, self-drawing <svg> (DrawOn is display:contents, so it takes
	   the <img>'s place here) as for the raster <img> fallback. object-fit has no effect on an
	   inline SVG, but its default preserveAspectRatio ("xMidYMid meet") already behaves like
	   object-fit:contain, so no extra attribute is needed on the generated file here (unlike
	   WerkwijzeCard's filled variant, which needs "slice"/cover). :global() because {@html}
	   content gets no scoping class. Targeted via .feature__badge (a real, always-present class
	   on the wrapping <div>), not via the class prop passed down to <DrawOn> — that prop only
	   becomes a class name inside DrawOn's own markup, a different component, so selecting on
	   it here would be an always-unused selector as far as svelte-check's static analysis of
	   this file can tell. */
	.feature__icon,
	.feature__badge :global(svg.lt) {
		display: block;
		width: calc(75% * var(--icon-scale, 1));
		height: calc(75% * var(--icon-scale, 1));
		object-fit: contain;
	}

	.feature__title {
		font-family: var(--font-display);
		font-size: var(--fs-h3);
		font-weight: var(--font-weight-medium);
		color: var(--color-fg-forest);
	}

	.feature__body {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		color: var(--color-text-subtle);
	}
</style>
