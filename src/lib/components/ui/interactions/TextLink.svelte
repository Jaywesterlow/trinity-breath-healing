<script lang="ts">
	interface Props {
		label: string;
		href: string;
		inverted?: boolean;
		showArrow?: boolean;
		size?: 'lg' | 'sm';
		tone?: 'muted' | 'gold-soft';
		/** What the cursor says over this link — see CursorTooltip.svelte.
		 *  Omitted, the cursor stays the plain hand. */
		tooltip?: string;
		/** Glyph in front of that wording: 'page' for the up-right arrow, 'zoom'
		 *  for the magnifier. */
		tooltipIcon?: 'page' | 'zoom';
	}

	let {
		label,
		href,
		inverted = false,
		showArrow = true,
		size = 'lg',
		tone,
		tooltip,
		tooltipIcon
	}: Props = $props();
</script>

<a
	{href}
	data-tooltip={tooltip}
	data-tooltip-icon={tooltipIcon}
	class="text-link link-underline roll-host"
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
		<span class="text-link__arrows arrow-swap" aria-hidden="true">
			<span class="arrow-swap__glyph arrow-swap__glyph--out">
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
			<span class="arrow-swap__glyph arrow-swap__glyph--in">
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

	/* The underline and the arrow pair both come from app.css now
	   (.link-underline and .arrow-swap). This component carried its own copy of
	   each — a permanent 1px border first, then a hand-rolled wipe, then six
	   rules for the swap — which is exactly how the site ended up with
	   underlines at two different heights running in two different directions.
	   All that is left here is which way this particular arrow travels: it
	   points down and to the right, so it leaves that way and its replacement
	   arrives from the opposite corner along the same diagonal. */
	.text-link__arrows {
		width: 22px;
		height: 22px;
		flex-shrink: 0;
		--swap-x: var(--arrow-travel);
		--swap-y: var(--arrow-travel);
	}

	.text-link__arrow {
		rotate: 90deg; /* points right, per Figma */
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
