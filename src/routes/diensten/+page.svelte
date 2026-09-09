<script lang="ts">
	/**
	 * /diensten — the index of the seven modalities, by name.
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
	import { Breadcrumbs, PageTitle } from '$lib/components/ui';
	import { ButtonLink } from '$lib/components/ui/interactions';
	import { BRAND } from '$lib/constants/brand';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Breadcrumbs items={data.crumbs} wide />

<article class="index">
	<header class="index__head">
		<p class="index__eyebrow" use:reveal>Diensten</p>
		<PageTitle>Alle behandelingen</PageTitle>
		<p class="index__lead" use:reveal>
			Zeven behandelingen, elk met een eigen ingang. De ene werkt via de adem, de andere via
			aanraking of energie. Welke bij jou past hoeft je niet zelf uit te zoeken.
		</p>
	</header>

	<ul class="index__grid">
		{#each BRAND.services as service, i (service.slug)}
			<li use:reveal>
				<a class="card" href="/diensten/{service.slug}">
					<span class="card__number">{String(i + 1).padStart(2, '0')}</span>
					<span class="card__name">{service.name}</span>
					<span class="card__teaser">{service.teaser}</span>
					<span class="card__more">Lees meer</span>
				</a>
			</li>
		{/each}
	</ul>

	<section class="index__cta" aria-labelledby="hulp">
		<h2 id="hulp" class="index__h2" use:reveal>Weet je niet welke je nodig hebt?</h2>
		<p class="index__body" use:reveal>
			Dat hoeft ook niet. In een kennismaking van dertig minuten kijken we samen wat er speelt en
			wat daarbij past. Vrijblijvend, online.
		</p>
		<div class="index__button" use:reveal>
			<ButtonLink label="Plan een kennismaking" href="/contact" />
		</div>
		<p class="index__note" use:reveal>{BRAND.disclaimer}</p>
	</section>
</article>

<style>
	/* See <Breadcrumbs>'s .nav--wide: the gutter is added to the max-width, not
	   taken out of it, so the content box is exactly --container-max and starts
	   on the same vertical line as every section on the landing page. */
	.index {
		max-width: calc(var(--container-max) + 3rem);
		margin: 0 auto;
		padding: var(--space-8) 1.5rem var(--space-16);
	}

	.index__head {
		max-width: 42rem;
		margin-bottom: var(--space-10);
	}

	.index__eyebrow {
		font-family: var(--font-body);
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-light);
		color: var(--brand-muted);
		margin-bottom: var(--space-2);
	}

	.index__lead {
		margin-top: var(--space-4);
		font-family: var(--font-body);
		font-size: var(--fs-body-lg);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.index__grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-4);
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		height: 100%;
		padding: var(--space-6);
		border: 1px solid color-mix(in srgb, var(--brand-border) 30%, transparent);
		border-radius: 1.125rem;
		text-decoration: none;
		transition:
			background-color var(--motion-hover) var(--ease-hover),
			border-color var(--motion-hover) var(--ease-hover);
	}

	@media (hover: hover) and (pointer: fine) {
		.card:hover {
			background: color-mix(in srgb, var(--brand-border) 7%, transparent);
			border-color: var(--brand-border);
		}
	}

	.card:focus-visible {
		background: color-mix(in srgb, var(--brand-border) 7%, transparent);
		border-color: var(--brand-border);
	}

	/* Position in the list, not a ranking. Quiet enough to read as an index
	   marker rather than as a score. */
	.card__number {
		font-family: var(--font-display);
		font-size: var(--fs-body-sm);
		color: var(--brand-muted);
		letter-spacing: 0.08em;
	}

	.card__name {
		font-family: var(--font-display);
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
	}

	.card__teaser {
		flex: 1;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.card__more {
		margin-top: var(--space-2);
		font-family: var(--font-body);
		font-size: var(--fs-body-sm);
		color: var(--brand-border);
	}

	.index__cta {
		max-width: 42rem;
		margin-top: var(--space-16);
	}

	.index__h2 {
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		margin-bottom: var(--space-4);
	}

	.index__body {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.index__button {
		margin-top: var(--space-6);
	}

	.index__note {
		margin-top: var(--space-8);
		padding-left: var(--space-4);
		border-left: 2px solid var(--brand-border);
		font-family: var(--font-body);
		font-size: var(--fs-body-sm);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	@media (min-width: 640px) {
		.index__grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (min-width: 1024px) {
		.index__grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
