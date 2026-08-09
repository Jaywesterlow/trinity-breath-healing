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
		/** TEMPORARY diagnostic aid (see Behandelingen.svelte) — when set,
		 * renders this number in place of the icon/image, large and legible,
		 * so the carousel owner can tell cards apart by number while testing
		 * more items than ship ("card 5 jumped"). Optional and additive on
		 * purpose so this component stays position-unaware and presentational
		 * — the carousel decides the number, this just draws it. Will be
		 * removed, along with every call site that passes it, once the
		 * diagnostic is reverted. */
		cardNumber?: number | null;
		/** Where the corner button goes. Accessible name only for now — the
		 * arrow itself carries no visible text (not final copy either way). */
		buttonLabel: string;
		buttonHref: string;
	}

	let { label, icon = null, cardNumber = null, buttonLabel, buttonHref }: Props = $props();
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
		{#if cardNumber !== null}
			<span class="tcard__number" aria-hidden="true">{cardNumber}</span>
		{:else if icon}
			<img src={icon} alt="" aria-hidden="true" class="tcard__icon" draggable="false" />
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

	/* TEMPORARY (see cardNumber in the script block above) — sized to read at
	   a glance at the mobile card width (--card-width defaults to 6.5rem, see
	   TreatmentCard's own default and Behandelingen.svelte's override), bumped
	   further at the desktop breakpoint below where cards are noticeably
	   bigger. Reuses the same sand-on-forest contrast as the rest of the card,
	   so no separate accessibility check is needed for this throwaway state. */
	.tcard__number {
		font-family: var(--font-display);
		font-size: 2.5rem;
		font-weight: var(--font-weight-medium);
		line-height: 1;
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
			/* ~50% bigger than the base 1.75rem (2.625rem) — tap target and
			   glyph scale together (see the svg rule below) so the arrow's
			   proportions inside the circle hold at the new size. Mobile's
			   1.5rem/14x14 is untouched. */
			width: 2.625rem;
			height: 2.625rem;
		}

		.tcard__button svg {
			/* Scaled by the same ~1.5x as the button circle above (14px ->
			   21px) so the glyph keeps the same visual proportion inside its
			   now-bigger tap target. Overrides the width/height attributes
			   set in the markup, which stay 14x14 for mobile. */
			width: 21px;
			height: 21px;
		}

		.tcard__number {
			font-size: 4.5rem;
		}

		.tcard__title {
			font-size: var(--fs-body-sm);
		}
	}
</style>
