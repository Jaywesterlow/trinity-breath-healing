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

<!-- With the arrow, the whole link is the pill and the circle sits inside it (Figma
     "Hero (scrolling)", Frame 49, 2026-10-24), so .btn-pill goes on the <a>. Without
     it, the label span is the pill, as before. -->
<a
	{href}
	{onclick}
	class="btn-link roll-host btn-host"
	class:btn-link--arrow={withArrow}
	class:btn-link--block={block}
	class:btn-pill={withArrow}
	class:btn-pill--secondary={withArrow && variant === 'secondary'}
>
	<!-- data-label feeds the second copy of the word, which .text-roll draws as a
	     pseudo-element rather than a second node — see app.css. -->
	<span
		class="btn-link__label text-roll"
		class:btn-pill={!withArrow}
		class:btn-pill--secondary={!withArrow && variant === 'secondary'}
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

	/* Frame 49, measured from the 4x export: 44px tall, the label 16px DM Sans starting 16px
	   in, 10px to a 32px circle that sits 6px from the pill's edge. The 2px edge is the
	   button rule's, inside the 44 (border-box). */
	.btn-link--arrow {
		box-sizing: border-box;
		gap: 0.625rem;
		height: 2.75rem;
		padding: 0 0.25rem 0 0.875rem; /* + the 2px edge: 16px and 6px */
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

	.btn-link--block.btn-link--arrow .btn-link__label {
		justify-content: flex-start;
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

	/* Inside the pill the label is only the clipping box for the roll: as tall as the pill,
	   so the word rolls right out of it, with no fill or padding of its own. */
	.btn-link--arrow .btn-link__label {
		align-self: stretch;
		height: auto;
		padding: 0;
		border-radius: 0;
		font-family: var(--font-body);
		font-size: 1rem;
	}

	/* Straight down, against the label's roll upward. Positioning, clipping and
	   the swap itself come from .arrow-swap in app.css. */
	/* A cream disc with a gold arrow inside the pill, per Frame 49. On hover and focus the
	   pill inverts (the button rule: sand fill, tan label), and the disc goes the other way,
	   tan with a sand arrow, so it never vanishes into the pill. The arrow's gold (#c7a27a)
	   is decorative: the label already says where the link goes. */
	.btn-link__circle {
		--swap-x: 0px;
		--swap-y: var(--arrow-roll);
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--btn-ink);
		color: var(--color-accent-gold-soft);
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

	/* Secondary is the same two colours in the opposite order, so its disc starts tan. */
	.btn-pill--secondary .btn-link__circle {
		background: var(--btn-fill);
		color: var(--btn-ink);
	}

	.btn-pill--secondary.btn-link:focus-visible .btn-link__circle {
		background: var(--btn-ink);
		color: var(--color-accent-gold-soft);
	}

	@media (hover: hover) and (pointer: fine) {
		.btn-pill--secondary.btn-link:hover .btn-link__circle {
			background: var(--btn-ink);
			color: var(--color-accent-gold-soft);
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
