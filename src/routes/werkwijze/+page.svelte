<script lang="ts">
	/**
	 * /werkwijze — what actually happens, in order, from first contact to after.
	 *
	 * The landing page has a three-card version of this. That one is a summary
	 * for someone scrolling; this is for someone who has decided to book and now
	 * wants to know what they are walking into. The questions it answers are the
	 * ones people ask before a first session — do I have to talk, what do I wear,
	 * what if I cry — and they are answered plainly rather than reassuringly.
	 *
	 * Practical facts (where, which day, home visits, remote) come from
	 * BRAND.practice and BRAND.areaServed, never retyped, because the footer and
	 * the JSON-LD read the same fields and a second copy would drift.
	 */
	import { Breadcrumbs } from '$lib/components/ui';
	import { PageShell, PageHead, PageSection, CtaBand } from '$lib/components/page';
	import { BRAND } from '$lib/constants/brand';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const STEPS = [
		{
			n: '01',
			title: 'Kennismaking',
			/* Her text of 2-11; the last sentence is her answer of 8-11 (09:26). */
			body: 'Tijdens een vrijblijvend kennismakingsgesprek van 30 minuten nemen we rustig de tijd om elkaar te leren kennen. Je kunt vertellen wat je bezighoudt en waar je behoefte aan hebt. Ik vertel je over mijn werkwijze en de mogelijkheden binnen mijn praktijk. Samen kijken we of mijn begeleiding bij jou past, zodat je in alle rust kunt voelen of je een volgende stap wilt zetten.\n\nHet gesprek kan online of telefonisch. Wil je meteen een behandeling, dan kun je ook langskomen.'
		},
		{
			n: '02',
			title: 'Voor de sessie',
			body: 'Voorafgaand aan de behandeling nemen we rustig de tijd om stil te staan bij hoe het met je gaat en wat je op dat moment nodig hebt. Ik leg uit wat je kunt verwachten en er is alle ruimte om vragen te stellen of je wensen aan te geven. Het is prettig om comfortabele, makkelijk zittende kleding te dragen en vlak voor de sessie geen zware maaltijd te eten.'
		},
		{
			n: '03',
			title: 'De sessie zelf',
			/* Steps 3 to 5: her texts of 2-11. "aangekleed" (3) and "appen" (4) are ours
			   and stay until she answers questions 4 and 5 (TODO.md §0a). */
			body: 'Tijdens de sessie staat jouw welzijn centraal. Afhankelijk van de gekozen behandeling werk ik met energie, zachte aanraking, ademhaling of lichaamsgerichte technieken. Je ligt daarbij aangekleed op een behandeltafel. Je krijgt de ruimte om te ontspannen en te ervaren wat zich op dat moment aandient. Iedere sessie is anders en wordt afgestemd op jouw persoonlijke behoeften.\n\nEr is niets wat je moet voelen of ervaren. Je mag er helemaal zijn, precies zoals je bent. Alles gebeurt in jouw tempo, met aandacht en respect voor jouw persoonlijke grenzen.'
		},
		{
			n: '04',
			title: 'Na afloop',
			body: 'Na de sessie nemen we rustig de tijd om bij te komen en stil te staan bij jouw ervaring. Er is ruimte om te delen wat je hebt gevoeld of ervaren, maar niets hoeft. Iedereen ervaart een behandeling op zijn eigen manier. Soms voel je direct verschil, terwijl je op andere momenten pas later iets opmerkt.\n\nIk geef je, waar nodig, persoonlijke tips mee om ook na de sessie goed voor jezelf te zorgen. Vraag je je de dagen erna iets af, dan kun je me altijd appen.'
		},
		{
			n: '05',
			title: 'Hoe nu verder?',
			body: 'Na de behandeling kijken we samen hoe je de sessie hebt ervaren en of je behoefte hebt aan verdere begeleiding. Soms is één sessie voldoende, terwijl op andere momenten meerdere behandelingen prettig kunnen zijn. Jij bepaalt wat goed voelt en welke volgende stap bij jou past. Alles gebeurt in jouw eigen tempo.'
		}
	];

	const FACTS = [
		{
			label: 'Duur',
			value:
				'De tijdsduur verschilt per behandeling. Bij de verschillende behandelingen vind je meer informatie. Het vrijblijvende kennismakingsgesprek duurt 30 minuten.'
		},
		/* Her text of 2-11; the address may be published (her answer of 8-11). */
		{
			label: 'Waar',
			value: `Op zaterdag ontvang ik je in de praktijk in Amsterdam-Zuidoost: ${BRAND.address.street}, ${BRAND.address.floor}, ${BRAND.address.postalCode} ${BRAND.address.city}.`
		},
		{
			label: 'Bij jou thuis',
			value:
				'Op andere dagen zijn behandelingen aan huis mogelijk. Hiervoor worden reiskosten in rekening gebracht.'
		},
		{
			label: 'Op afstand',
			value:
				'Mahatma Healing, Gold Healing en Rasterenergie kunnen ook op afstand worden aangeboden.'
		},
		{
			label: 'Regio',
			value: `${BRAND.areaServed.join(', ')}. Andere locaties zijn mogelijk in overleg.`
		}
	];
</script>

<Breadcrumbs items={data.crumbs} />

<PageShell>
	<PageHead
		eyebrow="Werkwijze"
		lead="Vanaf het eerste contact tot de begeleiding na afloop neem ik je stap voor stap mee. Zo weet je wat je kunt verwachten en is er alle ruimte om je op je gemak te voelen."
	>
		Zo verloopt een sessie
	</PageHead>

	<!-- Five steps in one row on a wide screen, so the whole route from first
	     message to afterwards is in view at once; three and two on a laptop,
	     a column on a phone. Number and title fade as one, the text as another:
	     her "Voor de sessie" (7-11) made a whole step taller than the third of
	     the viewport one revealed block may be (reveal-audit.spec.ts). -->
	<ol class="steps">
		{#each STEPS as step (step.n)}
			<li class="step">
				<div class="step__head" use:reveal>
					<span class="step__n" aria-hidden="true">{step.n}</span>
					<h2 class="step__title">{step.title}</h2>
				</div>
				{#each step.body.split('\n\n') as para, i (i)}
					<p class="step__body" use:reveal>{para}</p>
				{/each}
			</li>
		{/each}
	</ol>

	<PageSection id="praktisch" eyebrow="Goed om te weten" title="Praktisch">
		<dl class="facts">
			{#each FACTS as fact (fact.label)}
				<div class="facts__row" use:reveal>
					<dt>{fact.label}</dt>
					<dd>{fact.value}</dd>
				</div>
			{/each}
		</dl>
	</PageSection>

	<CtaBand
		id="beginnen"
		title="Beginnen bij het begin"
		lead="Wil je ontdekken wat ik voor je kan betekenen? Tijdens een vrijblijvend kennismakingsgesprek van 30 minuten nemen we rustig de tijd om kennis te maken en jouw vragen te bespreken. Samen kijken we of mijn begeleiding aansluit bij jouw wensen en behoeften."
		label="Plan een kennismaking"
		href="/contact"
		note={BRAND.disclaimer}
	/>
</PageShell>

<style>
	.steps {
		list-style: none;
		margin: 0;
		padding: 0 0 var(--block-gap);
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-8) var(--space-10);
	}

	/* A rule above each step and the number on it, the way the ledger on the
	   landing page sets its rows: the rule is what makes five columns read as
	   one row rather than five loose blocks. */
	.step {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		/* space-4, not 5: at 1440×900 the tallest step was 302px with 5, two over
		   the third-of-the-viewport band the reveal keeps to. */
		padding-top: var(--space-4);
		border-top: 1px solid color-mix(in srgb, var(--brand-border) 28%, transparent);
	}

	.step__head {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.step__n {
		font-family: var(--font-display);
		font-size: var(--fs-h3);
		line-height: 1;
		color: var(--brand-border);
		letter-spacing: 0.04em;
	}

	.step__title {
		margin: var(--space-2) 0 0;
		font-family: var(--font-display);
		font-size: var(--fs-h3);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
	}

	.step__body {
		margin: 0;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}

	.step__body + .step__body {
		margin-top: var(--space-3);
	}

	@media (min-width: 700px) {
		.steps {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 1100px) {
		.steps {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (min-width: 1536px) {
		.steps {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}
	}

	.facts {
		margin: 0;
		display: grid;
		gap: 0;
		/* Two facts per row on desktop: the dl is the section's content column,
		   so this is what fills it. */
		grid-template-columns: 1fr;
	}

	.facts__row {
		display: grid;
		grid-template-columns: minmax(7rem, 1fr) minmax(0, 3fr);
		gap: var(--space-4);
		padding: var(--space-4) 0;
		border-top: 1px solid color-mix(in srgb, var(--brand-border) 20%, transparent);
	}

	.facts__row:first-child {
		border-top: none;
		padding-top: 0;
	}

	.facts dt {
		font-family: var(--font-display);
		font-size: var(--fs-body-lg);
		color: var(--color-fg-forest);
	}

	.facts dd {
		margin: 0;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		line-height: var(--line-height-loose);
		color: var(--color-text-subtle);
	}
</style>
