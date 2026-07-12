<script lang="ts">
	interface Props {
		iconSrc: string;
		title: string;
		body: string;
		/* Icon source files don't crop their glyph to a consistent fraction of the
		   canvas — e.g. heart.png's glyph fills ~87% of its image, sprout.png's only
		   ~65% — so the same box size renders visibly smaller for sprout. Lets the
		   caller compensate per-icon instead of hardcoding filenames into this
		   reusable component. */
		iconScale?: number;
	}

	let { iconSrc, title, body, iconScale = 1 }: Props = $props();
</script>

<div class="feature">
	<div class="feature__badge">
		<img
			src={iconSrc}
			alt=""
			aria-hidden="true"
			class="feature__icon"
			style="--icon-scale: {iconScale}"
		/>
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
		background: var(--color-fg-forest); /* matches the icon art's own baked-in background, so the shrunk-down margin below blends in seamlessly */
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Base size chosen so heart.png (the denser glyph) sits with a clean, centered
	   margin instead of touching the circle's inscribed boundary. --icon-scale lets
	   individual icons (e.g. sprout.png, whose glyph occupies less of its own canvas)
	   compensate so they read as visually the same size — see AboutFeature's iconScale prop. */
	.feature__icon {
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
