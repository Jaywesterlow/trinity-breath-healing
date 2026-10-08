<script lang="ts">
	interface Props {
		label: string;
		href: string;
		/**
		 * The circle-and-arrow. Defaults to on, because this component is an <a>
		 * and the arrow is what says the press leaves the page or the section —
		 * see the button rule in app.css. An in-place action is a <button> and
		 * uses Button.svelte, which never has one. Pass false only where a link
		 * genuinely should not read as navigation.
		 */
		withArrow?: boolean;
		/** See the button rule in app.css. `outline` is gone: it was a third
		 *  colour scheme for one button on one card, which is the inconsistency
		 *  the rule exists to remove. */
		variant?: 'primary' | 'secondary';
		/** Stretch to the container's width — the pill takes the slack, the arrow
		 *  circle keeps its 40px and lands on the far edge. */
		block?: boolean;
		onclick?: () => void;
	}

	let {
		label,
		href,
		withArrow = true,
		variant = 'primary',
		block = false,
		onclick
	}: Props = $props();
</script>

<a
	{href}
	{onclick}
	class="btn-link roll-host btn-host"
	class:btn-link--arrow={withArrow}
	class:btn-link--block={block}
>
	<!-- data-label feeds the second copy of the word, which .text-roll draws as a
	     pseudo-element rather than a second node — see app.css. -->
	<span
		class="btn-link__label btn-pill text-roll"
		class:btn-pill--secondary={variant === 'secondary'}
		data-label={label}
	>
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
		font-family: var(--font-display);
		font-size: var(--btn-label-size, var(--font-size-xl)); /* overridable per context */
		font-weight: 400;
		line-height: 1;
		/* Fill, edge, ink and the hover swap are .btn-pill's — see app.css. */
	}

	.btn-link--arrow .btn-link__label {
		margin-right: -2px; /* slight overlap with circle, per Figma */
	}

	/* Straight down, against the label's roll upward. Positioning, clipping and
	   the swap itself come from .arrow-swap in app.css. */
	/* The circle is built from the pill's own two colours, which is what makes the
	   arrow a modifier rather than a variant. It fills with whatever the LABEL
	   currently is: an empty brown ring while the label is sand on brown, and a
	   filled brown disc with a sand arrow once the pill has inverted and the label
	   has gone brown. Filling it with the pill's own fill instead would be
	   invisible — that fill is sand on hover, and so is the page. */
	.btn-link__circle {
		--swap-x: 0px;
		--swap-y: var(--arrow-roll);
		width: var(--space-10);
		height: var(--space-10);
		border-radius: 50%;
		border: 2px solid var(--btn-fill);
		background: transparent;
		color: var(--btn-fill);
		flex-shrink: 0;
		transition:
			background-color var(--motion-arrow) var(--ease-arrow),
			color var(--motion-arrow) var(--ease-arrow);
	}

	.btn-link:focus-visible .btn-link__circle {
		background: var(--btn-fill);
		color: var(--btn-ink);
	}

	@media (hover: hover) and (pointer: fine) {
		.btn-link:hover .btn-link__circle {
			background: var(--btn-fill);
			color: var(--btn-ink);
		}
	}

	@media (hover: hover) and (pointer: fine) {
		.btn-link:hover {
			transform: translateY(var(--lift-hover));
			box-shadow: var(--shadow-hover);
		}
	}

	.btn-link:active {
		transform: translateY(0);
		box-shadow: none;
	}
</style>
