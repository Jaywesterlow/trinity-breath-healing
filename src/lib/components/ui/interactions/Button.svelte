<script lang="ts">
	interface Props {
		label: string;
		href?: string;
		withArrow?: boolean;
		type?: 'button' | 'submit' | 'reset';
		onclick?: (e: MouseEvent) => void;
	}

	let { label, href, withArrow = false, type = 'button', onclick }: Props = $props();
</script>

{#if href}
	<a {href} class="btn" class:btn--arrow={withArrow}>
		<span class="btn__label">{label}</span>
		{#if withArrow}
			<span class="btn__circle" aria-hidden="true">
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
{:else}
	<button {type} class="btn" class:btn--arrow={withArrow} {onclick}>
		<span class="btn__label">{label}</span>
		{#if withArrow}
			<span class="btn__circle" aria-hidden="true">
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
	</button>
{/if}

<style>
	/* ─── Base: pill button (no arrow) ─── */
	.btn {
		display: inline-flex;
		align-items: center;
		text-decoration: none;
		border: none;
		cursor: pointer;
		background: transparent;
		padding: 0;
		gap: 8px;
		transition: opacity var(--motion-fast);
	}

	.btn:not(.btn--arrow) .btn__label {
		display: flex;
		align-items: center;
		height: 40px;
		padding: 0 24px;
		border-radius: var(--radius-full);
		background: var(--color-border);
		color: var(--color-bg-sand);
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		font-weight: 400;
		white-space: nowrap;
		line-height: 1;
	}

	.btn:hover {
		opacity: 0.88;
	}

	/* ─── Arrow variant: pill text + outside circle ─── */
	.btn--arrow {
		gap: 0;
	}

	.btn--arrow .btn__label {
		display: flex;
		align-items: center;
		height: 40px;
		padding: 0 24px;
		border-radius: var(--radius-full);
		background: var(--color-border);
		color: var(--color-bg-sand);
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		font-weight: 400;
		white-space: nowrap;
		line-height: 1;
		margin-right: -2px; /* slight overlap with circle, per Figma */
	}

	.btn__circle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 2px solid var(--color-border);
		background: transparent;
		color: var(--color-border);
		flex-shrink: 0;
	}
</style>
