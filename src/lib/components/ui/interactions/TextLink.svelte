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
	{/if}
</a>

<style>
	.text-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: 2px var(--space-1);
		border-bottom: 1px solid var(--color-fg-forest);
		text-decoration: none;
		color: var(--color-fg-forest);
		transition: opacity var(--motion-fast);
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

	.text-link__arrow {
		flex-shrink: 0;
		rotate: 90deg; /* points right, per Figma */
	}

	.text-link:hover {
		opacity: 0.8;
	}

	.text-link--inverted {
		color: var(--color-bg-sand);
		border-bottom-color: var(--color-bg-sand);
	}

	/* ─── Small variant (footer contact links) ─── */
	.text-link--sm .text-link__label {
		font-family: var(--font-body);
		font-size: var(--font-size-base);
		font-weight: 400;
	}

	.text-link--muted {
		color: var(--brand-muted);
		border-bottom-color: var(--brand-muted);
	}

	.text-link--gold-soft {
		color: var(--color-accent-gold-soft);
		border-bottom-color: var(--color-accent-gold-soft);
	}
</style>
