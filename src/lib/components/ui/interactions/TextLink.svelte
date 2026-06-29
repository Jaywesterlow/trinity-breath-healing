<script lang="ts">
	interface Props {
		label: string;
		href: string;
	}

	let { label, href }: Props = $props();
</script>

<a {href} class="text-link">
	<span class="text-link__label">{label}</span>
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
</a>

<style>
	.text-link {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 2px 4px;
		border-bottom: 1px solid var(--color-fg-forest);
		text-decoration: none;
		color: var(--color-fg-forest);
		transition: opacity var(--motion-fast);
	}

	.text-link__label {
		font-family: var(--font-display);
		font-size: 24px;
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
</style>
