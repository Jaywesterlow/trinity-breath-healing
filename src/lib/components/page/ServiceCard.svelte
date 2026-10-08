<script lang="ts">
	/**
	 * One service as a card in a grid: name, teaser, and the
	 * arrow circle from the treatment card in the corner. The whole card is
	 * the link; the arrow runs the shared swap when the card is hovered, the
	 * same gesture as the carousel card and the modal's controls.
	 *
	 * Under the cursor the card lights up where the pointer is: animation 33 from the
	 * library (33-spotlight-border-cards.html). The grid holding the cards carries
	 * `use:spotlight`, which hands every card the pointer's position; the light is the
	 * ::before below.
	 */
	interface Props {
		href: string;
		name: string;
		teaser: string;
	}
	let { href, name, teaser }: Props = $props();
</script>

<a class="scard roll-host" {href} data-spotlight>
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
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-lg);
		text-decoration: none;
		overflow: hidden;
		isolation: isolate; /* the light sits behind the words, inside the card */
		transition:
			background-color var(--motion-hover) var(--ease-hover),
			border-color var(--motion-hover) var(--ease-hover);
	}

	.scard:focus-visible {
		background: color-mix(in srgb, var(--brand-border) 7%, transparent);
		border-color: var(--brand-border);
	}

	/* Animation 33's light, as its source has it: a 180px circle at the pointer,
	   fading in over .3s on the card under the cursor. White at 6% on black there;
	   the brand's brown on sand here, at a strength that reads the same. */
	.scard::before {
		content: '';
		position: absolute;
		inset: -1px;
		z-index: -1;
		background: radial-gradient(
			circle 180px at var(--mx, 50%) var(--my, 50%),
			color-mix(in srgb, var(--brand-border) 12%, transparent),
			transparent
		);
		opacity: 0;
		transition: opacity 0.3s;
		pointer-events: none;
	}

	@media (hover: hover) and (pointer: fine) {
		.scard:hover {
			border-color: var(--brand-border);
		}

		.scard:hover::before {
			opacity: 1;
		}
	}

	.scard__name {
		font-family: var(--font-display);
		font-size: var(--fs-h3);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
	}

	.scard__teaser {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	/* The treatment card's arrow circle (TreatmentCard.svelte, .tcard__arrow):
	   same size, same ring, same halo and fill on hover. Sand here is the
	   page's own background, so the fill is the brand border colour with the
	   glyph turning sand — the ButtonLink's circle does the same. */
	.scard__arrow {
		position: absolute;
		right: var(--space-6);
		bottom: var(--space-6);
		width: 2.625rem;
		height: 2.625rem;
		border-radius: var(--radius-full);
		border: 1px solid var(--brand-border);
		color: var(--brand-border);
		--swap-x: var(--arrow-travel);
		--swap-y: calc(-1 * var(--arrow-travel));
		box-shadow: 0 0 0 0 color-mix(in srgb, var(--brand-border) 0%, transparent);
		transition:
			background-color var(--motion-arrow) var(--ease-arrow),
			color var(--motion-arrow) var(--ease-arrow),
			box-shadow var(--motion-hover) var(--ease-hover);
	}

	.scard:focus-visible .scard__arrow {
		box-shadow: 0 0 0 6px color-mix(in srgb, var(--brand-border) 22%, transparent);
		background: var(--brand-border);
		color: var(--color-bg-sand);
	}

	@media (hover: hover) and (pointer: fine) {
		.scard:hover .scard__arrow {
			box-shadow: 0 0 0 6px color-mix(in srgb, var(--brand-border) 22%, transparent);
			background: var(--brand-border);
			color: var(--color-bg-sand);
		}
	}
</style>
