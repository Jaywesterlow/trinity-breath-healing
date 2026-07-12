<script lang="ts">
	interface Props {
		label: string;
		type?: 'button' | 'submit' | 'reset';
		onclick?: (e: MouseEvent) => void;
	}

	let { label, type = 'button', onclick }: Props = $props();
</script>

<button {type} class="btn" {onclick}>
	<span class="btn__label">{label}</span>
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: opacity var(--motion-fast);
	}

	.btn__label {
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
</style>
