<script lang="ts">
	/**
	 * The proof band, straight under the hero (2026-10-17). The three figures used to
	 * sit at the foot of Over mij, four sections down; a visitor comparing on trust
	 * now meets them before the first scroll is over. Same figures, same labels, same
	 * count-up (AboutStat), so nothing here is new copy.
	 *
	 * Hairlines between the figures, the old ledger's rule (the site's brown at 28%):
	 * between rows on a phone, between columns from 700px.
	 */
	import { BRAND } from '$lib/constants/brand';
	import AboutStat from '$lib/components/ui/AboutStat.svelte';
	import { reveal } from '$lib/actions/reveal';

	const FIGURES = [
		{ value: BRAND.stats.yearsExperience, label: 'jaar ervaring' },
		{ value: BRAND.stats.clientsHelped, label: 'klachten verholpen' },
		{ value: BRAND.stats.satisfaction, label: 'mogelijkheden voor herstel' }
	] as const;
</script>

<section class="proof" aria-label="In cijfers">
	<ul class="proof__list">
		{#each FIGURES as figure (figure.label)}
			<li class="proof__item" use:reveal>
				<AboutStat value={figure.value} label={figure.label} />
			</li>
		{/each}
	</ul>
</section>

<style>
	.proof {
		background: var(--color-card-warm);
		--proof-hairline: color-mix(in srgb, var(--brand-border) 28%, transparent);
	}

	.proof__list {
		list-style: none;
		margin: 0 auto;
		padding: var(--space-10) var(--space-6);
		max-width: var(--container-max);
		display: grid;
	}

	/* Phone: the old ledger, centred, a hairline between the rows. */
	.proof__item {
		padding: var(--space-6) 0;
		text-align: center;
	}

	.proof__item + .proof__item {
		border-top: 1px solid var(--proof-hairline);
	}

	@media (min-width: 700px) {
		/* A row of three, a hairline in each seam. */
		.proof__list {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			padding-block: var(--space-12);
		}

		.proof__item {
			padding: var(--space-2) var(--space-6);
		}

		.proof__item + .proof__item {
			border-top: 0;
			border-left: 1px solid var(--proof-hairline);
		}
	}

	@media (min-width: 1100px) {
		.proof__list {
			padding-inline: 0; /* max-width + centring sets the edge, as everywhere else */
		}
	}
</style>
