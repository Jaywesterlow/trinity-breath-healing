<script lang="ts">
	interface Props {
		label: string;
		href: string;
		inverted?: boolean;
		showArrow?: boolean;
		size?: 'lg' | 'sm';
		tone?: 'muted' | 'gold-soft';
	}

	let { label, href, inverted = false, showArrow = true, size = 'lg', tone }: Props = $props();
</script>

<a
	{href}
	class="text-link"
	class:text-link--inverted={inverted}
	class:text-link--sm={size === 'sm'}
	class:text-link--muted={tone === 'muted'}
	class:text-link--gold-soft={tone === 'gold-soft'}
>
	<span class="text-link__label">{label}</span>
	{#if showArrow}
		<!-- Two arrows, one leaving. This one points down-right, so it exits that
		     way and its replacement arrives from the top-left — the opposite
		     corner, along the same diagonal. -->
		<span class="text-link__arrows" aria-hidden="true">
			<span class="text-link__arrow-slot text-link__arrow-slot--out">
				<svg
			class="text-link__arrow"
			width="22"
			height="22"
			viewBox="0 0 22 22"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M5 17L17 5M17 5H9M17 5V13"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
			</span>
			<span class="text-link__arrow-slot text-link__arrow-slot--in">
				<svg
			class="text-link__arrow"
			width="22"
			height="22"
			viewBox="0 0 22 22"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M5 17L17 5M17 5H9M17 5V13"
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
	.text-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		position: relative;
		padding: 2px var(--space-1);
		text-decoration: none;
		color: var(--color-fg-forest);
		transition: transform var(--motion-hover) var(--ease-hover);
	}

	.text-link__label {
		font-family: var(--font-display);
		font-size: var(
			--text-link-size,
			1.5rem
		); /* overridable per context, same pattern as ButtonLink's --btn-label-size */
		font-weight: 600;
		white-space: nowrap;
		line-height: 1;
	}

	/* ─── The underline ───
	   Was a permanent 1px border. It is the shared wipe now: in from the left on
	   hover, out to the right on leave, at --underline-height like every other
	   animated underline on the site. */
	.text-link::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: var(--underline-height);
		background: currentColor;
		transform: scaleX(0);
		transform-origin: right center;
		transition: transform var(--motion-underline) var(--ease-out);
	}

	.text-link:hover::after,
	.text-link:focus-visible::after {
		transform: scaleX(1);
		transform-origin: left center;
	}

	/* ─── The arrow ───
	   Both copies sit in one box, clipped to it, so the departing arrow is cut
	   off at the edge rather than drawn outside the link. */
	.text-link__arrows {
		position: relative;
		display: inline-flex;
		width: 22px;
		height: 22px;
		flex-shrink: 0;
		overflow: hidden;
	}

	.text-link__arrow-slot {
		position: absolute;
		inset: 0;
		display: inline-flex;
		transition:
			transform var(--motion-arrow) var(--ease-arrow),
			opacity var(--motion-arrow) var(--ease-arrow);
	}

	.text-link__arrow {
		rotate: 90deg; /* points right, per Figma */
	}

	/* Waits at the top-left — the corner opposite the one it points at. */
	.text-link__arrow-slot--in {
		opacity: 0;
		transform: translate(calc(-1 * var(--arrow-travel)), calc(-1 * var(--arrow-travel)));
	}

	.text-link:hover .text-link__arrow-slot--out,
	.text-link:focus-visible .text-link__arrow-slot--out {
		opacity: 0;
		transform: translate(var(--arrow-travel), var(--arrow-travel));
	}

	.text-link:hover .text-link__arrow-slot--in,
	.text-link:focus-visible .text-link__arrow-slot--in {
		opacity: 1;
		transform: translate(0, 0);
	}

	/* The underline is currentColor, so a tone only has to set the text colour. */
	.text-link--inverted {
		color: var(--color-bg-sand);
	}

	/* ─── Small variant (footer contact links) ─── */
	.text-link--sm .text-link__label {
		font-family: var(--font-body);
		font-size: var(--font-size-base);
		font-weight: 400;
	}

	.text-link--muted {
		color: var(--brand-muted);
	}

	.text-link--gold-soft {
		color: var(--color-accent-gold-soft);
	}
</style>
