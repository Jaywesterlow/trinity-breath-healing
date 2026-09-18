<script lang="ts">
	/**
	 * Over mij — the E-E-A-T page.
	 *
	 * Built as a finished page with the biography left open, rather than left as
	 * a "komt binnenkort" card, because the structure is the part that can be
	 * decided without the practitioner and the words are the part that cannot.
	 * Every <Todo> below is a paragraph she writes; nothing here invents a
	 * qualification, a year or a training she may not have.
	 *
	 * The copy that IS here is hers already: the introduction is the approved
	 * landing-page text, imported from the same constant rather than reworded
	 * into a second version that would then drift, and the service summaries come
	 * straight from BRAND.services.
	 *
	 * See +page.ts for why the page is noindex until the markers are filled.
	 */
	import { Breadcrumbs, Todo } from '$lib/components/ui';
	import DrawOn from '$lib/components/ui/DrawOn.svelte';
	import { PageShell, PageHead, PageSection, CtaBand, ServiceCard } from '$lib/components/page';
	import { reveal } from '$lib/actions/reveal';
	// The same portrait the landing page draws, see OverMij.svelte.
	import portrait from '$lib/images/about-portrait-1.svg?raw';
	import { BRAND } from '$lib/constants/brand';
	import { ABOUT_INTRO } from '$lib/content/about';
	import { COMPLETED_TRAININGS, PLANNED_TRAININGS } from '$lib/constants/trainings';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const areaList = BRAND.areaServed.join(', ');
</script>

<Breadcrumbs items={data.crumbs} />

<PageShell>
	<PageHead lead={ABOUT_INTRO}>
		Vanuit eigen ervaring weet ik wat jij doormaakt.
		{#snippet visual()}
			<div class="about-page__portrait">
				<DrawOn svg={portrait} />
			</div>
		{/snippet}
	</PageHead>

	<PageSection id="verhaal" title="Hoe ik hier terechtkwam">
		<p class="about-page__body" use:reveal>
			<Todo>
				Haar verhaal: wat er gebeurde waardoor ze zelf vastliep, en wat haar op dit werk bracht.
				Twee tot drie alinea's, in haar eigen woorden
			</Todo>
		</p>
	</PageSection>

	<PageSection id="werk" title="Hoe ik werk">
		<p class="about-page__body" use:reveal>
			Er is tijdens een sessie geen moeten en geen tempo dat gehaald moet worden. Jouw lichaam
			bepaalt wat er die dag mogelijk is, en ik volg dat in plaats van er iets doorheen te duwen.
		</p>
		<p class="about-page__body" use:reveal>
			<Todo>
				Wat iemand concreet kan verwachten van een eerste afspraak: hoe lang, wat er gebeurt, wat ze
				aan moeten trekken, hoe ze zich achteraf kunnen voelen
			</Todo>
		</p>
	</PageSection>

	<PageSection id="opleiding" title="Opleiding en achtergrond">
		<p class="about-page__body" use:reveal>
			Sinds 2024 volg ik onafgebroken opleidingen en verdiepingen. Niet één cursus en klaar — elk
			jaar komt er werk bij, een deel herhaal ik bewust, en sommige trajecten lopen nog. Het Soul
			Alchemist-traject telt zes modules; daarvan heb ik er twee afgerond en volgen de rest dit jaar
			en volgend jaar.
		</p>
		<!-- A ledger, like the one on the landing page: date on the left, course and
		     school on the right, a rule between rows. -->
		<ul class="trainings">
			{#each COMPLETED_TRAININGS as training (training.date + training.name)}
				<li class="trainings__row" use:reveal>
					<span class="trainings__date">{training.dateLabel}</span>
					<span class="trainings__name">
						{training.name}{#if training.provider}<span class="trainings__provider"
								>{training.provider}</span
							>{/if}
					</span>
				</li>
			{/each}
		</ul>

		{#if PLANNED_TRAININGS.length > 0}
			<!-- Separated on purpose. Something she has planned is not something she
			     has completed, and on a health page that difference is the whole
			     point of publishing the list. -->
			<p class="trainings__planned" use:reveal>
				Gepland:
				{#each PLANNED_TRAININGS as training, i (training.date + training.name)}{i > 0
						? ', '
						: ''}{training.name} ({training.dateLabel}){/each}
			</p>
		{/if}

		<p class="about-page__body" use:reveal>
			<Todo>Aangesloten bij een beroepsvereniging? Zo ja, welke, en sinds wanneer</Todo>
		</p>
	</PageSection>

	<PageSection id="doe" title="Wat ik doe" wide>
		<p class="about-page__body about-page__body--intro" use:reveal>
			In de praktijk werk ik met {BRAND.services.length} vormen van ademwerk, lichaamswerk en energetisch
			werk. Welke vorm het beste past, hangt af van wat er bij jou speelt — dat kijken we samen tijdens
			de kennismaking.
		</p>
		<ul class="about-page__services">
			{#each BRAND.services as service, i (service.slug)}
				<li use:reveal>
					<ServiceCard
						href="/diensten/{service.slug}"
						name={service.name}
						teaser={service.teaser}
						number={i + 1}
					/>
				</li>
			{/each}
		</ul>
	</PageSection>

	<PageSection id="waar" title="Waar ik werk">
		<p class="about-page__body" use:reveal>
			{BRAND.practice.locationNote}
			{BRAND.practice.homeVisitNote}
			{BRAND.practice.remoteNote} Mensen komen naar me toe uit {areaList} en omgeving.
		</p>
	</PageSection>

	<PageSection id="belangrijk" title="Belangrijk om te weten">
		<div class="about-page__note" use:reveal>
			<p>{BRAND.disclaimer}</p>
			<p>
				Wat een sessie wel en niet is, en wanneer je beter eerst met je arts overlegt, staat
				uitgebreid op de <a class="link-underline" href="/disclaimer">disclaimerpagina</a>.
			</p>
		</div>
	</PageSection>

	<CtaBand
		id="kennismaken"
		title="Even kennismaken?"
		lead="Een kennismaking duurt 30 minuten, is kosteloos en verplicht je tot niets. We kijken samen of dit werk bij je past."
		label="Plan een kennismaking"
		href="/contact"
	/>
</PageShell>

<style>
	/* DrawOn is display:contents, so the <svg> is the box; :global() because
	   {@html} content carries no scoping class. Same ink as the landing page. */
	/* Sized explicitly, not by percentage: the SVG carries its own 1060×1580
	   width/height attributes and a percentage height on the wrapper did not
	   resolve inside the head's centred grid cell, which left the drawing at
	   its full 1580px. Same height as PageHead's visual cell. */
	.about-page__portrait {
		height: 14rem;
		aspect-ratio: 1060 / 1580;
	}

	.about-page__portrait :global(svg.lt) {
		display: block;
		width: 100%;
		height: 100%;
	}

	@media (min-width: 1100px) {
		.about-page__body {
			font-size: var(--fs-body-lg);
		}

		.about-page__portrait {
			height: clamp(10rem, 16vw, 16rem);
		}
	}

	.about-page__portrait :global(svg.lt > path) {
		fill: var(--color-fg-forest);
	}

	.about-page__body {
		margin: 0 0 var(--space-4);
		font-family: var(--font-body);
		/* Lead size from the desktop breakpoint up; on a phone the intro at that size
		   ran to 298px, over the third-of-the-viewport band the reveal keeps to. */
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}

	.about-page__body:last-child {
		margin-bottom: 0;
	}

	.about-page__body--intro {
		max-width: 66ch;
		margin-bottom: var(--space-8);
	}

	.trainings {
		list-style: none;
		margin: var(--space-6) 0 var(--space-4);
		padding: 0;
	}

	.trainings__row {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-1) var(--space-6);
		padding: var(--space-3) 0;
		border-top: 1px solid color-mix(in srgb, var(--brand-border) 20%, transparent);
	}

	.trainings__row:last-child {
		border-bottom: 1px solid color-mix(in srgb, var(--brand-border) 20%, transparent);
	}

	.trainings__date {
		font-family: var(--font-display);
		font-size: var(--fs-body);
		color: var(--brand-border);
	}

	.trainings__name {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		line-height: var(--line-height-normal);
		color: var(--color-fg-forest);
	}

	/* The school on its own line under the course. It is the part a sceptical
	   reader checks, so it stays visible rather than collapsing into a tooltip —
	   just quieter than the course itself. */
	.trainings__provider {
		display: block;
		font-size: var(--fs-body-sm);
		color: var(--color-text-subtle);
	}

	.trainings__planned {
		margin: 0 0 var(--space-4);
		font-family: var(--font-body);
		font-size: var(--fs-body);
		color: var(--color-text-subtle);
	}

	.about-page__services {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-4);
	}

	.about-page__note {
		max-width: 66ch;
		padding-left: var(--space-5);
		border-left: 2px solid var(--brand-border);
	}

	.about-page__note p {
		margin: 0 0 var(--space-3);
		font-family: var(--font-body);
		font-size: var(--fs-body);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}

	.about-page__note p:last-child {
		margin-bottom: 0;
	}

	@media (min-width: 30rem) {
		.trainings__row {
			grid-template-columns: 9rem minmax(0, 1fr);
		}
	}

	@media (min-width: 700px) {
		.about-page__services {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 1100px) {
		.about-page__services {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (min-width: 1536px) {
		.about-page__services {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
</style>
