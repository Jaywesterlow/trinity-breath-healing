<script lang="ts">
	import { ButtonLink } from '$lib/components/ui/interactions';
</script>

<div class="nav__cta">
	<ButtonLink label="Maak een afspraak" href="/contact" />
</div>

<style>
	.nav__cta {
		display: none;
	}

	@media (min-width: 1024px) {
		/* The button grows with the site scale as one thing — pill, label, ring and
		   arrow, ratio kept — via `zoom` on this inert wrapper, so nothing inside
		   ButtonLink changes. See the hero's .hero__cta for why zoom over transform. */
		.nav__cta {
			display: flex;
			align-items: center;
			gap: var(--space-2);
			flex-shrink: 0;
			zoom: var(--site-scale);
		}
	}
</style>
