<script lang="ts">
	// Temporary placeholder — real date planner comes later.
</script>

<div class="date-planner-panel">
	<span class="date-planner-panel__label">date planner</span>
</div>

<style>
	.date-planner-panel {
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

	.date-planner-panel__label {
		font-size: var(--font-size-xl);
	}

	@media (min-width: 1024px) {
		.date-planner-panel {
			min-height: 50rem; /* 800px */
		}
	}
</style>
