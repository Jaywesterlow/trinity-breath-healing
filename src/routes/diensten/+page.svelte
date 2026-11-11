<script lang="ts">
	/**
	 * /diensten — the index of the eight modalities, by name.
	 *
	 * Deliberately not the same page as /behandelingen. That one is organised by
	 * what someone arrives with (stress, slecht slapen, rugpijn) and routes them
	 * to a treatment; this one is organised by the treatments themselves, for the
	 * reader who already knows the word they are looking for. Two URLs saying the
	 * same thing in a different order would be a duplicate-content problem on a
	 * site whose first success metric is being found, so they answer different
	 * questions or one of them should not exist.
	 *
	 * Cards come from BRAND.services, in BRAND's order. No teaser is written here.
	 */
	import { Breadcrumbs } from '$lib/components/ui';
	import { PageShell, PageHead, CtaBand, ServiceCard } from '$lib/components/page';
	import { BRAND } from '$lib/constants/brand';
	import { reveal } from '$lib/actions/reveal';
	import { paintGreen } from '$lib/paint';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Breadcrumbs items={data.crumbs} />

<PageShell>
	<PageHead
		eyebrow="Diensten"
		lead="Iedere behandeling heeft een eigen werkwijze, met aandacht voor lichaam, geest en ziel. Samen kijken we welke behandeling het beste aansluit bij jouw wensen en behoeften."
	>
		Alle behandelingen
	</PageHead>

	<!-- Each card keeps its own reveal: the grid is taller than a third of any screen. -->
	<ul class="index__grid">
		{#each BRAND.services as service, i (service.slug)}
			<li use:reveal>
				<ServiceCard
					href="/diensten/{service.slug}"
					name={service.name}
					teaser={service.teaser}
					paint={paintGreen(i)}
				/>
			</li>
		{/each}
	</ul>

	<CtaBand
		id="hulp"
		title="Weet je niet welke behandeling bij jou past?"
		lead="Dat is helemaal niet erg. Tijdens een vrijblijvend kennismakingsgesprek van ongeveer 30 minuten bespreken we samen wat er bij jou speelt en welke behandeling het beste bij jouw behoeften aansluit. Het gesprek vindt plaats via telefonisch contact of videobellen."
		label="Plan een kennismaking"
		href="/contact"
		note={BRAND.disclaimer}
	/>
</PageShell>

<style>
	.index__grid {
		list-style: none;
		margin: 0;
		padding: 0 0 var(--block-gap);
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-4);
	}

	@media (min-width: 700px) {
		.index__grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 1100px) {
		.index__grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (min-width: 1536px) {
		.index__grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
</style>
