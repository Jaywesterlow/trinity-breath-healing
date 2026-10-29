<script lang="ts">
	/**
	 * One service as a card in a grid: name, teaser, and the
	 * arrow circle from the treatment card in the corner. The whole card is
	 * the link; the arrow runs the shared swap when the card is hovered, the
	 * same gesture as the carousel card and the modal's controls.
	 *
	 * On a green watercolour since 2026-10-29 (owner: cards get "a green
	 * background with that water paint touch"), like the home page's cards. Pass
	 * paintGreen() of the service's place in BRAND.services, so neighbours differ
	 * and a service always gets the same wash as its carousel card.
	 */
	import { paintGreen } from '$lib/paint';

	interface Props {
		href: string;
		name: string;
		teaser: string;
		/** Which of the ten washes; see $lib/paint.ts. */
		paint?: string;
	}
	let { href, name, teaser, paint = paintGreen(0) }: Props = $props();
</script>

<a class="scard roll-host" {href} style:--paint={paint}>
	<span class="scard__name">{name}</span>
	<span class="scard__teaser">{teaser}</span>
	<span class="scard__arrow arrow-swap" aria-hidden="true">
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
</a>

<style>
	.scard {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		height: 100%;
		padding: var(--space-6);
		padding-bottom: calc(var(--space-6) + 2.625rem + var(--space-4));
		border-radius: 1.125rem; /* the home page's green cards */
		background: var(--paint, var(--paint-green));
		text-decoration: none;
		transition: transform var(--motion-hover) var(--ease-hover);
	}

	.scard:focus-visible {
		outline: 2px solid var(--color-accent-gold);
		outline-offset: 3px;
	}

	@media (hover: hover) and (pointer: fine) {
		.scard:hover {
			transform: translateY(-3px);
		}
	}

	.scard__name {
		font-family: var(--font-display);
		font-size: var(--fs-h3);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-bg-sand);
	}

	.scard__teaser {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-bg-sand);
	}

	/* The treatment card's arrow circle (TreatmentCard.svelte, .tcard__arrow):
	   same size, same ring, same halo and fill on hover, in sand on the green. */
	.scard__arrow {
		position: absolute;
		right: var(--space-6);
		bottom: var(--space-6);
		width: 2.625rem;
		height: 2.625rem;
		border-radius: var(--radius-full);
		border: 1px solid var(--color-bg-sand);
		color: var(--color-bg-sand);
		--swap-x: var(--arrow-travel);
		--swap-y: calc(-1 * var(--arrow-travel));
		box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-bg-sand) 0%, transparent);
		transition:
			background-color var(--motion-arrow) var(--ease-arrow),
			color var(--motion-arrow) var(--ease-arrow),
			box-shadow var(--motion-hover) var(--ease-hover);
	}

	.scard:focus-visible .scard__arrow {
		box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-bg-sand) 22%, transparent);
		background: var(--color-bg-sand);
		color: var(--color-fg-forest);
	}

	@media (hover: hover) and (pointer: fine) {
		.scard:hover .scard__arrow {
			box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-bg-sand) 22%, transparent);
			background: var(--color-bg-sand);
			color: var(--color-fg-forest);
		}
	}
</style>
