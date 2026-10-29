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
	import { paintGreen } from '$lib/paint';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const nameOf = (slug: string) => BRAND.services.find((s) => s.slug === slug)?.name ?? slug;
</script>

<Breadcrumbs items={data.crumbs} />

<PageShell>
	<PageHead
		eyebrow="Behandelingen"
		lead="Je komt meestal niet met de naam van een behandeling, maar met een klacht. Zoek wat herkenbaar is; kiezen hoeft niet."
	>
		Waar kom je mee?
	</PageHead>

	<!-- Seven complaints as green watercolour cards (2026-10-29, owner: the cards get
	     the home page's painted green, the treatments become small gold tags), two
	     across on a tablet and three on a laptop; each keeps its anchor id, which other
	     pages link to. No reveal: a card is a third of the screen or more, over the
	     limit for a fading block (reveal-audit.spec.ts). -->
	<ul class="klachten">
		{#each KLACHTEN as klacht, i (klacht.id)}
			<li class="klacht" id={klacht.id} style:--paint={paintGreen(i + 2)}>
				<h2 class="klacht__title">{klacht.title}</h2>
				<p class="klacht__body">{klacht.body}</p>
				<ul class="klacht__services">
					{#each klacht.services as slug (slug)}
						<li>
							<a
								class="chip btn-pill btn-host text-roll roll-host"
								href="/diensten/{slug}"
								data-label={nameOf(slug)}
							>
								<span class="text-roll__face">{nameOf(slug)}</span>
							</a>
						</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ul>

	<p class="klachten__alt" use:reveal>
		Liever per behandeling lezen?
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
		gap: var(--space-5);
	}

	.klacht {
		display: flex;
		flex-direction: column;
		padding: var(--space-8) var(--space-6) var(--space-6);
		border-radius: 1.125rem; /* the home page's green cards */
		background: var(--paint, var(--paint-green));
		color: var(--color-bg-sand);
		scroll-margin-top: calc(var(--nav-height) + var(--space-6));
	}

	.klacht__title {
		margin: 0 0 var(--space-3);
		font-family: var(--font-display);
		font-size: var(--fs-h3);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-bg-sand);
		text-wrap: balance;
	}

	.klacht__body {
		flex: 1;
		margin: 0;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-bg-sand);
	}

	.klacht__services {
		list-style: none;
		margin: var(--space-6) 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	/* Small tags in the site's button (2026-10-29, owner: brown "like the original
	   call-to-action colors" with the buttons' hover, not gold, no glow): .btn-pill
	   brings the brown fill and the swap, .text-roll the rolling label, both from
	   app.css. Only the size is the tag's own. 28px tall, over the 24px target minimum. */
	.chip {
		display: inline-flex;
		align-items: stretch;
		min-height: 1.75rem;
		padding: 0 var(--space-3);
		border-radius: var(--radius-full);
		font-family: var(--font-body);
		font-size: 0.8125rem; /* 13px */
		text-decoration: none;
	}

	.chip:focus-visible {
		outline: 2px solid var(--color-bg-sand);
		outline-offset: 2px;
	}

	.klachten__alt {
		margin: var(--block-gap) auto var(--space-8);
		max-width: 60ch;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
		text-align: center;
	}

	@media (min-width: 700px) {
		.klachten {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 1100px) {
		.klachten {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		/* A card alone on the last row sits in the middle, not under the first. */
		.klacht:last-child:nth-child(3n + 1) {
			grid-column: 2;
		}
	}
</style>
