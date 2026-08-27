<script lang="ts">
	interface Props {
		label: string;
		href: string;
		withArrow?: boolean;
		variant?: 'filled' | 'outline';
		onclick?: () => void;
	}

	let { label, href, withArrow = false, variant = 'filled', onclick }: Props = $props();
</script>

<a
	{href}
	{onclick}
	class="btn-link"
	class:btn-link--arrow={withArrow}
	class:btn-link--outline={variant === 'outline'}
>
	<span class="btn-link__label">{label}</span>
	{#if withArrow}
		<span class="btn-link__circle" aria-hidden="true">
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

	.btn-link--arrow {
		gap: 0;
	}

	.btn-link__label {
		display: flex;
		align-items: center;
		height: var(--space-10);
		padding: 0 var(--space-6);
		border-radius: var(--radius-full);
		background: var(--brand-border);
		color: var(--color-bg-sand);
		font-family: var(--font-display);
		font-size: var(--btn-label-size, var(--font-size-xl)); /* overridable per context */
		font-weight: 400;
		white-space: nowrap;
		line-height: 1;
	}

	.btn-link--arrow .btn-link__label {
		margin-right: -2px; /* slight overlap with circle, per Figma */
	}

	.btn-link__circle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--space-10);
		height: var(--space-10);
		border-radius: 50%;
		border: 2px solid var(--brand-border);
		background: transparent;
		color: var(--brand-border);
		flex-shrink: 0;
	}

	.btn-link:hover {
		transform: translateY(var(--lift-hover));
		box-shadow: var(--shadow-hover);
	}

	.btn-link:active {
		transform: translateY(0);
		box-shadow: none;
	}

	.btn-link--outline .btn-link__label {
		background: transparent;
		border: 2px solid var(--color-accent-gold-soft);
		color: var(--color-bg-sand);
	}
</style>
