<script lang="ts">
	/**
	 * The call button in the nav (2026-10-17), instead of a contact bar above it.
	 * Built from the same global pieces as ButtonLink (btn-host, btn-pill--secondary,
	 * roll-host + text-roll), so it hovers exactly like every other button: the
	 * outlined pill fills, the number rolls. ButtonLink itself is left alone; it has
	 * no icon slot and must stay as it is.
	 *
	 * Phone and tablet: an outlined ring with the receiver, beside the menu button.
	 * Desktop: the same ring, beside the CTA. The nav row is logo, six links and the
	 * buttons in a container that is 1200px wide up to a 1667px screen, and the number
	 * does not fit in that. From 1800px the container is 1296 and it does, so there
	 * the ring grows into a pill with the number in it.
	 */
	import { BRAND } from '$lib/constants/brand';

	let { hidden = false }: { hidden?: boolean } = $props();

	const hasPhone = Boolean(BRAND.phone);
</script>

{#if hasPhone}
	<a
		class="call btn-host btn-pill btn-pill--secondary roll-host"
		class:call--hidden={hidden}
		href="tel:{BRAND.phone}"
		aria-label="Bel {BRAND.phoneDisplay}"
		tabindex={hidden ? -1 : undefined}
	>
		<svg
			class="call__icon"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M5 4h3.2l1.6 4-2 1.3a11 11 0 0 0 5 5l1.3-2 4 1.6V17a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"
				stroke="currentColor"
				stroke-width="1.6"
				stroke-linejoin="round"
			/>
		</svg>
		<span class="call__label text-roll" data-label={BRAND.phoneDisplay} aria-hidden="true">
			<span class="text-roll__face">{BRAND.phoneDisplay}</span>
		</span>
	</a>
{/if}

<style>
	.call {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: 44px; /* touch target on a phone */
		height: 44px;
		padding: 0;
		border-radius: var(--radius-full);
		flex-shrink: 0;
		text-decoration: none;
		box-sizing: border-box;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			background-color var(--motion-arrow) var(--ease-arrow),
			color var(--motion-arrow) var(--ease-arrow),
			opacity var(--motion-base) var(--ease-out);
	}

	/* The open mobile menu is forest green; a brown ring on it would be noise, and the
	   menu carries its own call to action. */
	.call--hidden {
		opacity: 0;
		pointer-events: none;
	}

	.call__icon {
		display: block;
		flex-shrink: 0;
	}

	.call__label {
		display: none;
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		font-weight: 400;
		line-height: 1;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	@media (hover: hover) and (pointer: fine) {
		.call:hover {
			transform: translateY(var(--lift-hover));
		}
	}

	@media (min-width: 1100px) {
		.call {
			width: var(--space-10);
			height: var(--space-10);
		}
	}

	@media (min-width: 1800px) {
		.call {
			width: auto;
			padding: 0 var(--space-5) 0 var(--space-4);
		}

		/* Stretched to the pill's height, so the roll carries the number fully out
		   of it (the same reason .text-roll__face stretches, see app.css). */
		.call__label {
			display: inline-flex;
			align-self: stretch;
		}
	}
</style>
