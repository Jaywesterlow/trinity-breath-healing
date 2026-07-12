<script lang="ts">
	import { ButtonLink } from '$lib/components/ui/interactions';
</script>

<div class="nav__cta">
	<ButtonLink label="Maak een afspraak" href="/contact" withArrow={true} />
</div>

<style>
	.nav__cta {
		display: none;
	}

	@media (min-width: 1024px) {
		.nav__cta {
			display: flex;
			align-items: center;
			gap: var(--space-2);
			flex-shrink: 0;
		}
	}
</style>
