<script lang="ts">
	interface Props {
		label: string;
		href: string;
		withArrow?: boolean;
		variant?: 'filled' | 'outline';
		/** Stretch to the container's width — the pill takes the slack, the arrow
		 *  circle keeps its 40px and lands on the far edge. */
		block?: boolean;
		onclick?: () => void;
	}

	let {
		label,
		href,
		withArrow = false,
		variant = 'filled',
		block = false,
		onclick
	}: Props = $props();
</script>

<a
	{href}
	{onclick}
	class="btn-link roll-host"
	class:btn-link--arrow={withArrow}
	class:btn-link--outline={variant === 'outline'}
	class:btn-link--block={block}
>
	<!-- data-label feeds the second copy of the word, which .text-roll draws as a
	     pseudo-element rather than a second node — see app.css. -->
	<span class="btn-link__label text-roll" data-label={label}>
		<span class="text-roll__face">{label}</span>
	</span>
	{#if withArrow}
		<!-- Two arrows, one on top of the other. They roll straight down while the
		     label rolls up, so the pill and the circle turn against each other. -->
		<span class="btn-link__circle arrow-swap" aria-hidden="true">
			<span class="arrow-swap__glyph arrow-swap__glyph--out">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<path
						d="M4 12L12 4M12 4H7M12 4V9"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</span>
			<span class="arrow-swap__glyph arrow-swap__glyph--in">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<path
						d="M4 12L12 4M12 4H7M12 4V9"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</span>
		</span>
	{/if}
</a>

<style>
	.btn-link {
		display: inline-flex;
		align-items: center;
		text-decoration: none;
		border-radius: var(--radius-full);
		transition:
			transform var(--motion-hover) var(--ease-hover),
			box-shadow var(--motion-hover) var(--ease-hover);
	}

	.btn-link:not(.btn-link--arrow) {
		gap: var(--space-2);
	}

	.btn-link--arrow {
		gap: 0;
	}

	/* The card version: the row fills the card's content box and the label eats
	   whatever the circle does not, so the circle's right edge lands exactly on
	   the card's padding. */
	.btn-link--block {
		display: flex;
		width: 100%;
	}

	.btn-link--block .btn-link__label {
		flex: 1;
		min-width: 0;
	}

	/* Clipping, nowrap and the second copy of the word come from .text-roll. */
	.btn-link__label {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: var(--space-10);
		padding: 0 var(--space-6);
		border-radius: var(--radius-full);
		background: var(--brand-border);
		color: var(--color-bg-sand);
		font-family: var(--font-display);
		font-size: var(--btn-label-size, var(--font-size-xl)); /* overridable per context */
		font-weight: 400;
		line-height: 1;
		transition:
			background-color var(--motion-arrow) var(--ease-arrow),
			border-color var(--motion-arrow) var(--ease-arrow),
			color var(--motion-arrow) var(--ease-arrow);
	}

	.btn-link--arrow .btn-link__label {
		margin-right: -2px; /* slight overlap with circle, per Figma */
	}

	/* Straight down, against the label's roll upward. Positioning, clipping and
	   the swap itself come from .arrow-swap in app.css. */
	.btn-link__circle {
		--swap-x: 0px;
		--swap-y: var(--arrow-roll);
		width: var(--space-10);
		height: var(--space-10);
		border-radius: 50%;
		border: 2px solid var(--btn-arrow-fill, var(--brand-border));
		background: transparent;
		color: var(--btn-arrow-fill, var(--brand-border));
		flex-shrink: 0;
		transition:
			background-color var(--motion-arrow) var(--ease-arrow),
			color var(--motion-arrow) var(--ease-arrow);
	}

	/* The pill swallows the circle: same fill, same border colour, so the two
	   stop reading as a shape plus a ring and become one shape. The -2px overlap
	   above is what closes the seam. */
	.btn-link:hover .btn-link__circle,
	.btn-link:focus-visible .btn-link__circle {
		background: var(--btn-arrow-fill, var(--brand-border));
		color: var(--btn-arrow-ink, var(--color-bg-sand));
	}

	.btn-link:hover {
		transform: translateY(var(--lift-hover));
		box-shadow: var(--shadow-hover);
	}

	.btn-link:active {
		transform: translateY(0);
		box-shadow: none;
	}

	.btn-link--outline .btn-link__label {
		background: transparent;
		border: 2px solid var(--color-accent-gold-soft);
		color: var(--color-bg-sand);
	}

	/* Outline sits on the dark portrait card, where --brand-border has nothing to
	   read against. Forest on gold-soft is 3.98:1 — the arrow is a graphic, and
	   WCAG 1.4.11 asks 3:1 of it. */
	.btn-link--outline {
		--btn-arrow-fill: var(--color-accent-gold-soft);
		--btn-arrow-ink: var(--color-fg-forest);
	}

	/* The outline button fills on hover as well as rolling its label, so the pill
	   and the circle arrive at the same colour together. Its ink is the deepened
	   forest, not the plain one: a *label* on gold-soft needs 4.5:1, which plain
	   forest misses. */
	.btn-link--outline:hover .btn-link__label,
	.btn-link--outline:focus-visible .btn-link__label {
		background: var(--color-accent-gold-soft);
		color: var(--color-fg-forest-deep);
	}
</style>
