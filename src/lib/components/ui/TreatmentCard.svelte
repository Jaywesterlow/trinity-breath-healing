<script lang="ts">
	/**
	 * The one place these cards' size/padding/layout is defined. Used
	 * identically for all 5 Behandelingen cards — no per-item branching in
	 * this file at all, so nothing here can drift out of sync between cards
	 * the way two separate template branches (a plain card vs. a link card)
	 * previously could.
	 *
	 * Purely presentational: knows nothing about carousel position. The
	 * carousel (Behandelingen.svelte) still owns where this card sits —
	 * --scale/--z/--offset/--rot are inherited CSS custom properties set on
	 * this component's parent wrapper, not props.
	 */
	interface Props {
		/** Service name — shown as the visible bottom title. */
		label: string;
		icon?: string | null;
		/** Not final copy — placeholder until real content is decided. */
		buttonLabel: string;
		buttonHref: string;
	}

	let { label, icon = null, buttonLabel, buttonHref }: Props = $props();
</script>

<div class="tcard">
	<a href={buttonHref} class="tcard__button" aria-label={`${buttonLabel} over ${label}`}>
		{buttonLabel}
	</a>

	<div class="tcard__icon-wrap">
		{#if icon}
			<img src={icon} alt="" aria-hidden="true" class="tcard__icon" />
		{/if}
	</div>

	<p class="tcard__title">{label}</p>
</div>

<style>
	.tcard {
		width: var(--card-width, 6.5rem);
		aspect-ratio: 282 / 459;
		display: grid;
		grid-template-rows: auto 1fr auto;
		justify-items: center;
		padding: var(--space-3); /* consistent on all 4 sides */
		border-radius: var(--radius-lg);
		background: var(--color-fg-forest);
		color: var(--color-bg-sand);
		z-index: var(--z, 1);
		/* No scale transform here — mobile is flat, one consistent size for
		   every card at every index, on purpose (that was the whole fix).
		   Desktop's arc adds --scale back below; --scale is inherited from
		   the carousel's pivot wrapper regardless of breakpoint, so applying
		   it unconditionally here would silently re-scale mobile cards too. */
	}

	.tcard__button {
		justify-self: end;
		border-radius: var(--radius-full);
		border: 1px solid var(--color-bg-sand);
		padding: 0.2rem var(--space-2);
		font-size: 0.5625rem;
		font-weight: var(--font-weight-medium);
		line-height: 1.4;
		white-space: nowrap;
		text-decoration: none;
		color: inherit;
		transition: background-color var(--motion-fast);
	}

	.tcard__button:hover {
		background: var(--brand-muted);
	}

	.tcard__icon-wrap {
		align-self: center;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
	}

	.tcard__icon {
		width: 65%;
		height: 65%;
		object-fit: contain;
	}

	.tcard__title {
		margin: 0;
		text-align: center;
		font-family: var(--font-body);
		font-size: var(--fs-body-xs);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
	}

	@media (min-width: 1024px) {
		.tcard {
			/* The arc's depth cue — center card full size, edges smaller.
			   --scale is inherited from the carousel's pivot wrapper. */
			transform-origin: center bottom;
			transform: scale(var(--scale, 1));
			transition: transform 600ms var(--ease-in-out);
		}

		.tcard__button {
			padding: 0.3rem var(--space-3);
			font-size: var(--font-size-xs);
		}

		.tcard__title {
			font-size: var(--fs-body-sm);
		}
	}
</style>
