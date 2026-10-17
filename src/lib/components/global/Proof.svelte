<script lang="ts">
	/**
	 * The proof band, straight under the hero (2026-10-17). The three figures used to
	 * sit at the foot of Over mij, four sections down; a visitor comparing on trust
	 * now meets them before the first scroll is over. Same figures, same labels, same
	 * count-up (AboutStat), so nothing here is new copy.
	 *
	 * The lotus from the logo stands between the figures where a hairline would, so
	 * the mark is part of the page and not only of the nav. It is a CSS mask over the
	 * logo file, which lets it take any colour without a second copy of the artwork.
	 * (A large watermark behind the band was tried first: it landed behind the third
	 * figure and read as part of it.)
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
	}

	.proof__list {
		list-style: none;
		margin: 0 auto;
		padding: var(--space-10) var(--space-6);
		max-width: var(--container-max);
		display: grid;
	}

	/* Phone: the old ledger, centred, with a small lotus between the rows. */
	.proof__item {
		position: relative;
		padding: var(--space-6) 0;
		text-align: center;
	}

	.proof__item + .proof__item::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 0;
		width: 2rem;
		aspect-ratio: 4096 / 3410; /* the logo file's own ratio */
		transform: translate(-50%, -50%);
		background: #c19e22; /* the logo's own gold (trinity-logo.svg), so it reads as the mark */
		-webkit-mask: url('/trinity-logo.svg') center / contain no-repeat;
		mask: url('/trinity-logo.svg') center / contain no-repeat;
	}

	@media (min-width: 700px) {
		/* A row of three, the lotus standing in each seam, level with the figures. */
		.proof__list {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			padding-block: var(--space-12);
		}

		.proof__item {
			padding: var(--space-2) var(--space-6);
		}

		.proof__item + .proof__item::before {
			left: 0;
			top: 50%;
			width: 2.5rem;
		}
	}

	@media (min-width: 1100px) {
		.proof__list {
			padding-inline: 0; /* max-width + centring sets the edge, as everywhere else */
		}
	}
</style>
