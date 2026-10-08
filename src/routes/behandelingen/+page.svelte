<script lang="ts">
	/**
	 * /behandelingen — the same seven treatments, reached from the other end.
	 *
	 * /diensten lists them by name. This page lists what people actually arrive
	 * with and routes each complaint to the treatments that address it, because
	 * "ik slaap al maanden slecht" is how the question gets asked, both to a
	 * person and to a search box. Content comes from `$lib/content/klachten`,
	 * which is built from the practitioner's own helpsWith lists — see the note
	 * at the top of that file.
	 *
	 * The two pages are linked to each other rather than competing: this one ends
	 * by pointing at /diensten, and every group links into the individual pages.
	 */
	import { Breadcrumbs } from '$lib/components/ui';
	import { PageShell, PageHead, CtaBand } from '$lib/components/page';
	import { BRAND } from '$lib/constants/brand';
	import { KLACHTEN } from '$lib/content/klachten';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const nameOf = (slug: string) => BRAND.services.find((s) => s.slug === slug)?.name ?? slug;
</script>

<Breadcrumbs items={data.crumbs} />

<PageShell>
	<PageHead
		lead="De meeste mensen komen niet binnen met de naam van een behandeling, maar met een klacht. Hieronder staat waar mensen mee komen en welke behandelingen daarbij horen. Je hoeft zelf niet te kiezen."
	>
		Waar kom je mee?
	</PageHead>

	<!-- Seven complaints as a grid of blocks, two across on a laptop and three on
	     a wide screen; each keeps its own reveal and its anchor id, which other
	     pages link to. -->
	<ul class="klachten">
		{#each KLACHTEN as klacht (klacht.id)}
			<li class="klacht" id={klacht.id} use:reveal>
				<h2 class="klacht__title">{klacht.title}</h2>
				<p class="klacht__body">{klacht.body}</p>
				<ul class="klacht__services">
					{#each klacht.services as slug (slug)}
						<li>
							<a class="chip" href="/diensten/{slug}">{nameOf(slug)}</a>
						</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ul>

	<p class="klachten__alt" use:reveal>
		Liever eerst lezen wat elke behandeling precies is?
		<a class="link-underline" href="/diensten">Bekijk alle diensten op naam</a>.
	</p>

	<CtaBand
		id="verder"
		title="Staat jouw klacht er niet bij?"
		lead="Dat komt vaker voor dan je denkt, en het betekent niet dat er niets te doen is. In een kennismaking van dertig minuten kijken we samen wat er speelt."
		label="Plan een kennismaking"
		href="/contact"
		note={BRAND.disclaimer}
	/>
</PageShell>

<style>
	.klachten {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-8) var(--space-10);
	}

	.klacht {
		display: flex;
		flex-direction: column;
		padding-top: var(--space-5);
		border-top: 1px solid color-mix(in srgb, var(--brand-border) 28%, transparent);
		scroll-margin-top: calc(var(--nav-height) + var(--space-6));
	}

	.klacht__title {
		margin: 0 0 var(--space-3);
		font-family: var(--font-display);
		font-size: var(--fs-h3);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		text-wrap: balance;
	}

	.klacht__body {
		flex: 1;
		margin: 0;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}

	.klacht__services {
		list-style: none;
		margin: var(--space-5) 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		min-height: 2.25rem; /* 36px — comfortably over the 24px target minimum */
		padding: 0 var(--space-4);
		border: 1px solid color-mix(in srgb, var(--brand-border) 40%, transparent);
		border-radius: var(--radius-full);
		font-family: var(--font-body);
		font-size: var(--fs-body-sm);
		color: var(--brand-border);
		text-decoration: none;
		transition:
			background-color var(--motion-hover) var(--ease-hover),
			border-color var(--motion-hover) var(--ease-hover),
			color var(--motion-hover) var(--ease-hover);
	}

	@media (hover: hover) and (pointer: fine) {
		.chip:hover {
			background: var(--brand-border);
			border-color: var(--brand-border);
			color: var(--color-bg-sand);
		}
	}

	.chip:focus-visible {
		background: var(--brand-border);
		border-color: var(--brand-border);
		color: var(--color-bg-sand);
	}

	.klachten__alt {
		margin: var(--block-gap) 0 var(--space-8);
		max-width: 60ch;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}

	@media (min-width: 700px) {
		.klachten {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 1536px) {
		.klachten {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
