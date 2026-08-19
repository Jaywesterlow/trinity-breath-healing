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
		background: transparent;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			box-shadow var(--motion-hover) var(--ease-hover);
		border-radius: var(--radius-full);
	}

	.btn__label {
		display: flex;
		align-items: center;
		height: 40px;
		padding: 0 24px;
		border-radius: var(--radius-full);
		background: var(--brand-border);
		color: var(--color-bg-sand);
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		font-weight: 400;
		white-space: nowrap;
		line-height: 1;
	}

	.btn:hover {
		transform: translateY(var(--lift-hover));
		box-shadow: var(--shadow-hover);
	}

	/* Press cancels the lift — the button meets the finger instead of dodging it. */
	.btn:active {
		transform: translateY(0);
		box-shadow: none;
	}
</style>
