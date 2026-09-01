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
	import { Breadcrumbs, PageTitle, Todo } from '$lib/components/ui';
	import { ButtonLink } from '$lib/components/ui/interactions';
	import { BRAND } from '$lib/constants/brand';
	import { ABOUT_INTRO } from '$lib/content/about';
	import { COMPLETED_TRAININGS, PLANNED_TRAININGS } from '$lib/constants/trainings';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const areaList = BRAND.areaServed.join(', ');
</script>

<Breadcrumbs items={data.crumbs} />

<article class="about-page">
	<header class="about-page__header">
		<p class="about-page__eyebrow">Over mij</p>
		<PageTitle>Vanuit eigen ervaring weet ik wat jij doormaakt.</PageTitle>
		<p class="about-page__lead">{ABOUT_INTRO}</p>
	</header>

	<section class="about-page__section">
		<h2>Hoe ik hier terechtkwam</h2>
		<p>
			<Todo>
				Haar verhaal: wat er gebeurde waardoor ze zelf vastliep, en wat haar op dit werk bracht.
				Twee tot drie alinea's, in haar eigen woorden
			</Todo>
		</p>
	</section>

	<section class="about-page__section">
		<h2>Hoe ik werk</h2>
		<p>
			Er is tijdens een sessie geen moeten en geen tempo dat gehaald moet worden. Jouw lichaam
			bepaalt wat er die dag mogelijk is, en ik volg dat in plaats van er iets doorheen te duwen.
		</p>
		<p>
			<Todo>
				Wat iemand concreet kan verwachten van een eerste afspraak: hoe lang, wat er gebeurt, wat ze
				aan moeten trekken, hoe ze zich achteraf kunnen voelen
			</Todo>
		</p>
	</section>

	<section class="about-page__section">
		<h2>Opleiding en achtergrond</h2>
		<p>
			Sinds 2024 volg ik onafgebroken opleidingen en verdiepingen. Niet één cursus en klaar — elk
			jaar komt er werk bij, een deel herhaal ik bewust, en sommige trajecten lopen nog. Het Soul
			Alchemist-traject telt zes modules; daarvan heb ik er twee afgerond en volgen de rest dit jaar
			en volgend jaar.
		</p>
		<ul class="about-page__trainings">
			{#each COMPLETED_TRAININGS as training (training.date + training.name)}
				<li>
					<span class="about-page__training-date">{training.dateLabel}</span>
					<span class="about-page__training-name">
						{training.name}{#if training.provider}<span class="about-page__training-provider"
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
			<p class="about-page__training-planned">
				Gepland:
				{#each PLANNED_TRAININGS as training, i (training.date + training.name)}{i > 0
						? ', '
						: ''}{training.name} ({training.dateLabel}){/each}
			</p>
		{/if}

		<p>
			<Todo>Aangesloten bij een beroepsvereniging? Zo ja, welke, en sinds wanneer</Todo>
		</p>
	</section>

	<section class="about-page__section">
		<h2>Wat ik doe</h2>
		<p>
			In de praktijk werk ik met {BRAND.services.length} vormen van ademwerk, lichaamswerk en energetisch
			werk. Welke vorm het beste past, hangt af van wat er bij jou speelt — dat kijken we samen tijdens
			de kennismaking.
		</p>
		<ul class="about-page__services">
			{#each BRAND.services as service (service.slug)}
				<li>
					<h3>{service.name}</h3>
					<p>{service.teaser}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section class="about-page__section">
		<h2>Waar ik werk</h2>
		<p>
			{BRAND.practice.locationNote}
			{BRAND.practice.homeVisitNote}
			{BRAND.practice.remoteNote} Mensen komen naar me toe uit {areaList} en omgeving.
		</p>
	</section>

	<section class="about-page__section about-page__section--note">
		<h2>Belangrijk om te weten</h2>
		<p>{BRAND.disclaimer}</p>
		<p>
			Wat een sessie wel en niet is, en wanneer je beter eerst met je arts overlegt, staat
			uitgebreid op de <a href="/disclaimer">disclaimerpagina</a>.
		</p>
	</section>

	<aside class="about-page__cta">
		<h2>Even kennismaken?</h2>
		<p>
			Een kennismaking duurt 30 minuten, is kosteloos en verplicht je tot niets. We kijken samen of
			dit werk bij je past.
		</p>
		<ButtonLink label="Plan een kennismaking" href="/#contact" />
	</aside>
</article>

<style>
	.about-page {
		max-width: var(--content-max-width, 42rem);
		margin: 0 auto;
		padding: clamp(1.5rem, 6vw, 3rem) clamp(1rem, 5vw, 1.5rem) clamp(3rem, 10vw, 5rem);
		color: var(--color-fg-forest);
	}

	.about-page__eyebrow {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--brand-muted);
		margin-bottom: 0.5rem;
	}

	.about-page__lead {
		margin-top: 1rem;
		font-size: 1.0625rem;
		line-height: 1.7;
		color: var(--brand-muted);
	}

	.about-page__section {
		margin-top: clamp(2rem, 7vw, 3rem);
	}

	.about-page__section h2 {
		font-family: var(--font-display);
		font-size: clamp(1.25rem, 4vw, 1.5rem);
		line-height: 1.25;
		margin-bottom: 0.75rem;
	}

	.about-page__section p {
		font-size: 1rem;
		line-height: 1.7;
		color: var(--brand-muted);
		margin-bottom: 1rem;
	}

	.about-page__section a {
		color: var(--color-fg-forest);
		text-decoration: underline;
	}

	.about-page__services {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1.25rem;
	}

	.about-page__services h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.about-page__services p {
		margin: 0;
		font-size: 0.9375rem;
	}

	/* Date and course name as two columns on anything but the narrowest phone:
	   a reader scanning for "how recent is this" wants the years to line up. It
	   collapses to a stacked list below 30rem, where a fixed date column would
	   squeeze the longer course names to three words a line. */
	.about-page__trainings {
		list-style: none;
		margin: 0 0 1.25rem;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}

	.about-page__trainings li {
		display: grid;
		gap: 0.1rem 1rem;
	}

	.about-page__training-date {
		font-size: 0.8125rem;
		color: var(--color-text-subtle);
	}

	/* The school on its own line under the course. It is the part a sceptical
	   reader checks, so it stays visible rather than collapsing into a tooltip —
	   just quieter than the course itself. */
	.about-page__training-provider {
		display: block;
		font-size: 0.8125rem;
		color: var(--color-text-subtle);
	}

	.about-page__training-planned {
		font-size: 0.9375rem;
		color: var(--color-text-subtle);
	}

	@media (min-width: 30rem) {
		.about-page__trainings li {
			grid-template-columns: 9rem 1fr;
			align-items: baseline;
		}
	}

	.about-page__section--note {
		padding: clamp(1rem, 4vw, 1.5rem);
		border-left: 2px solid var(--brand-border);
		background: color-mix(in srgb, var(--brand-border) 6%, transparent);
	}

	.about-page__section--note p:last-child {
		margin-bottom: 0;
	}

	.about-page__cta {
		margin-top: clamp(2.5rem, 8vw, 3.5rem);
		padding-top: clamp(1.5rem, 5vw, 2rem);
		border-top: 1px solid var(--brand-border);
		text-align: center;
	}

	.about-page__cta h2 {
		font-family: var(--font-display);
		font-size: clamp(1.25rem, 4vw, 1.5rem);
		margin-bottom: 0.5rem;
	}

	.about-page__cta p {
		font-size: 1rem;
		line-height: 1.7;
		color: var(--brand-muted);
		margin: 0 auto 1.25rem;
		max-width: 34rem;
	}
</style>
