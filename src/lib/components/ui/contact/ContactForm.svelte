<script lang="ts">
	// Temporary placeholder — real contact form comes later.
</script>

<div class="contact-panel">
	<span class="contact-panel__label">contact form</span>
</div>

<style>
	.contact-panel {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 26.25rem; /* 420px */
		background: #3e4734;
		color: var(--color-bg-sand);
		font-family: var(--font-body);
		border-radius: 1.5625rem; /* 25px */
		text-align: center;
	}

	.contact-panel__label {
		font-size: var(--font-size-xl);
	}

	@media (min-width: 1024px) {
		.contact-panel {
			min-height: 50rem; /* 800px */
		}
	}
</style>
