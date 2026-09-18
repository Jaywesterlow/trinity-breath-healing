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
			body: 'Dertig minuten, online, vrijblijvend. Je vertelt waar je tegenaan loopt en ik vertel wat ik doe. Aan het eind weten we allebei of het klikt. Er volgt geen verkooppraatje en je hoeft ter plekke niets te beslissen.'
		},
		{
			n: '02',
			title: 'Voor de sessie',
			body: 'Je krijgt vooraf te horen wat je kunt verwachten en waar we werken. Draag kleding waarin je makkelijk kunt liggen. Eet niet te zwaar vlak van tevoren. Verder hoef je niets voor te bereiden.'
		},
		{
			n: '03',
			title: 'De sessie zelf',
			body: 'We beginnen met een gesprek. Daarna lig je aangekleed op een behandeltafel en werk ik met adem, aanraking of energie, afhankelijk van wat er nodig is. Je bepaalt zelf hoeveel je vertelt. Er is geen goed of fout, en je hoeft niets te voelen wat er niet is.'
		},
		{
			n: '04',
			title: 'Na afloop',
			body: 'Er is tijd om te landen en na te praten. Sommige mensen zijn stil, anderen willen juist alles kwijt. Beide is prima. De dagen erna kan er nog iets nakomen: dat hoort erbij, en je kunt me altijd appen als je je afvraagt of het klopt.'
		},
		{
			n: '05',
			title: 'Verder, of niet',
			body: 'Eén sessie kan genoeg zijn. Bij langer bestaande klachten werken we vaker in een reeks, in jouw tempo. Je zit nergens aan vast en ik hou geen traject aan dat niet meer nodig is.'
		}
	];

	const FACTS = [
		{ label: 'Duur', value: 'Ongeveer een uur, de kennismaking dertig minuten' },
		{ label: 'Waar', value: BRAND.practice.locationNote },
		{ label: 'Bij jou thuis', value: BRAND.practice.homeVisitNote },
		{ label: 'Op afstand', value: BRAND.practice.remoteNote },
		{ label: 'Regio', value: BRAND.areaServed.join(', ') }
	];
</script>

<Breadcrumbs items={data.crumbs} />

<PageShell>
	<PageHead
		lead="Van het eerste bericht tot de dagen na een behandeling. Geen verrassingen, want dat is nou net wat niet helpt als je al gespannen binnenkomt."
	>
		Zo verloopt een sessie
	</PageHead>

	<!-- Five steps in one row on a wide screen, so the whole route from first
	     message to afterwards is in view at once; three and two on a laptop,
	     a column on a phone. Each step keeps its own reveal. -->
	<ol class="steps">
		{#each STEPS as step (step.n)}
			<li class="step" use:reveal>
				<span class="step__n" aria-hidden="true">{step.n}</span>
				<h2 class="step__title">{step.title}</h2>
				<p class="step__body">{step.body}</p>
			</li>
		{/each}
	</ol>

	<PageSection id="praktisch" title="Praktisch">
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
		lead="De kennismaking is er om te kijken of het klikt, niet om je iets te verkopen. Kies zelf een moment dat je uitkomt."
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
		padding-top: var(--space-5);
		border-top: 1px solid color-mix(in srgb, var(--brand-border) 28%, transparent);
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
