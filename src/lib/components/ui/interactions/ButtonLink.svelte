<script lang="ts">
	interface Props {
		label: string;
		href: string;
		withArrow?: boolean;
		variant?: 'filled' | 'outline';
		onclick?: () => void;
	}

	let { label, href, withArrow = false, variant = 'filled', onclick }: Props = $props();
</script>

<a
	{href}
	{onclick}
	class="btn-link"
	class:btn-link--arrow={withArrow}
	class:btn-link--outline={variant === 'outline'}
>
	<span class="btn-link__label">{label}</span>
	{#if withArrow}
		<!-- Two arrows, one on top of the other. The visible one leaves along the
		     diagonal it points down, up and to the right; the second arrives on the
		     same axis from the opposite corner. -->
		<span class="btn-link__circle" aria-hidden="true">
			<span class="btn-link__arrow btn-link__arrow--out">
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
			<span class="btn-link__arrow btn-link__arrow--in">
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

	.btn-link__label {
		display: flex;
		align-items: center;
		height: var(--space-10);
		padding: 0 var(--space-6);
		border-radius: var(--radius-full);
		background: var(--brand-border);
		color: var(--color-bg-sand);
		font-family: var(--font-display);
		font-size: var(--btn-label-size, var(--font-size-xl)); /* overridable per context */
		font-weight: 400;
		white-space: nowrap;
		line-height: 1;
	}

	.btn-link--arrow .btn-link__label {
		margin-right: -2px; /* slight overlap with circle, per Figma */
	}

	.btn-link__circle {
		position: relative; /* the two arrows position against it */
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--space-10);
		height: var(--space-10);
		border-radius: 50%;
		border: 2px solid var(--btn-arrow-fill, var(--brand-border));
		background: transparent;
		color: var(--btn-arrow-fill, var(--brand-border));
		flex-shrink: 0;
		overflow: hidden; /* the departing arrow is clipped at the rim, not drawn outside it */
		transition:
			background-color var(--motion-arrow) var(--ease-arrow),
			color var(--motion-arrow) var(--ease-arrow);
	}

	.btn-link__arrow {
		position: absolute;
		display: inline-flex;
		transition:
			transform var(--motion-arrow) var(--ease-arrow),
			opacity var(--motion-arrow) var(--ease-arrow);
	}

	/* Waits off-circle at the bottom-left — the corner the arrow points away from. */
	.btn-link__arrow--in {
		opacity: 0;
		transform: translate(calc(-1 * var(--arrow-travel)), var(--arrow-travel));
	}

	.btn-link:hover .btn-link__arrow--out,
	.btn-link:focus-visible .btn-link__arrow--out {
		opacity: 0;
		transform: translate(var(--arrow-travel), calc(-1 * var(--arrow-travel)));
	}

	.btn-link:hover .btn-link__arrow--in,
	.btn-link:focus-visible .btn-link__arrow--in {
		opacity: 1;
		transform: translate(0, 0);
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
</style>
