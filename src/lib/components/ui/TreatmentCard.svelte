<script lang="ts">
	/**
	 * The one place these cards' size/padding/layout is defined. Used
	 * identically for all 5 Behandelingen cards — no per-item branching in
	 * this file at all, so nothing here can drift out of sync between cards
	 * the way two separate template branches (a plain card vs. a link card)
	 * previously could.
	 *
	 * Purely presentational: knows nothing about carousel position. The
	 * carousel (Behandelingen.svelte) owns where this card sits — cards
	 * never resize or overlap, at any position or breakpoint, on purpose,
	 * so there's nothing here to inherit for that.
	 */
	interface Props {
		/** Service name — shown as the visible bottom title. */
		label: string;
		icon?: string | null;
		/** Where the corner button goes. Accessible name only for now — the
		 * arrow itself carries no visible text (not final copy either way). */
		buttonLabel: string;
		buttonHref: string;
	}

	let { label, icon = null, buttonLabel, buttonHref }: Props = $props();
</script>

<div class="tcard">
	<a href={buttonHref} class="tcard__button" aria-label={`${buttonLabel} over ${label}`}>
		<svg width="14" height="14" viewBox="0 0 22 22" fill="none" aria-hidden="true">
			<path
				d="M5 17L17 5M17 5H9M17 5V13"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
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
	}

	.tcard__button {
		justify-self: end;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: var(--radius-full);
		border: 1px solid var(--color-bg-sand);
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
		/* ~75% bigger than the icon's original 65% — the source art has a lot
		   of built-in padding, so this is close to the practical ceiling
		   before it starts crowding the button/title above and below it. */
		width: 100%;
		height: 100%;
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
		.tcard__button {
			width: 1.75rem;
			height: 1.75rem;
		}

		.tcard__title {
			font-size: var(--fs-body-sm);
		}
	}
</style>
