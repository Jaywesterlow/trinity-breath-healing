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
	import { Breadcrumbs, PageTitle } from '$lib/components/ui';
	import { ButtonLink } from '$lib/components/ui/interactions';
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

<article class="ww">
	<header class="ww__head">
		<PageTitle>Zo verloopt een sessie</PageTitle>
		<p class="ww__lead" use:reveal>
			Van het eerste bericht tot de dagen na een behandeling. Geen verrassingen, want dat is nou net
			wat niet helpt als je al gespannen binnenkomt.
		</p>
	</header>

	<ol class="ww__steps">
		{#each STEPS as step (step.n)}
			<li class="step" use:reveal>
				<span class="step__n" aria-hidden="true">{step.n}</span>
				<div class="step__text">
					<h2 class="step__title">{step.title}</h2>
					<p class="step__body">{step.body}</p>
				</div>
			</li>
		{/each}
	</ol>

	<section class="ww__facts" aria-labelledby="praktisch">
		<h2 id="praktisch" class="ww__h2" use:reveal>Praktisch</h2>
		<dl class="facts">
			{#each FACTS as fact (fact.label)}
				<div class="facts__row" use:reveal>
					<dt>{fact.label}</dt>
					<dd>{fact.value}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="ww__cta" aria-labelledby="beginnen">
		<h2 id="beginnen" class="ww__h2" use:reveal>Beginnen bij het begin</h2>
		<p class="ww__body" use:reveal>
			De kennismaking is er om te kijken of het klikt, niet om je iets te verkopen. Kies zelf een
			moment dat je uitkomt.
		</p>
		<div class="ww__button" use:reveal>
			<ButtonLink label="Plan een kennismaking" href="/contact" />
		</div>
		<p class="ww__note" use:reveal>{BRAND.disclaimer}</p>
	</section>
</article>

<style>
	/* Every page sits in the same box as the landing page's sections and the
	   footer below it, so a heading never starts 256px to the right of the logo
	   directly underneath it. The gutter is added to the max-width rather than
	   taken out of it (box-sizing is border-box), so the content box is exactly
	   --container-max. Reading measure is restored on the children, not by
	   narrowing the box — otherwise the whole page slides right again. */
	.ww {
		max-width: calc(var(--container-max) + 3rem);
		margin: 0 auto;
		padding: var(--space-8) 1.5rem var(--space-16);
	}

	/* Reading measure. Direct children only, so a section can opt out by
	   nesting if it ever needs the full container. */
	.ww > * {
		max-width: var(--content-max-width);
	}

	.ww__head {
		margin-bottom: var(--space-10);
	}

	.ww__lead {
		margin-top: var(--space-4);
		font-family: var(--font-body);
		font-size: var(--fs-body-lg);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.ww__steps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.step {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-5);
		align-items: start;
	}

	/* A number in a ring rather than a plain numeral: at this size a bare "01"
	   next to a heading reads as part of the heading. */
	.step__n {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 1px solid color-mix(in srgb, var(--brand-border) 40%, transparent);
		border-radius: var(--radius-full);
		font-family: var(--font-display);
		font-size: var(--fs-body-sm);
		color: var(--brand-border);
		letter-spacing: 0.06em;
	}

	.step__title {
		font-family: var(--font-display);
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		margin-bottom: var(--space-2);
	}

	.step__body,
	.ww__body {
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.ww__facts,
	.ww__cta {
		margin-top: var(--space-16);
	}

	.ww__h2 {
		font-family: var(--font-display);
		font-size: var(--fs-h2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-tight);
		color: var(--color-fg-forest);
		margin-bottom: var(--space-5);
	}

	.facts {
		margin: 0;
		display: flex;
		flex-direction: column;
	}

	.facts__row {
		display: grid;
		gap: var(--space-1);
		padding: var(--space-4) 0;
		border-top: 1px solid color-mix(in srgb, var(--brand-border) 25%, transparent);
	}

	.facts__row:last-child {
		border-bottom: 1px solid color-mix(in srgb, var(--brand-border) 25%, transparent);
	}

	.facts dt {
		font-family: var(--font-display);
		font-size: var(--font-size-xl);
		color: var(--color-fg-forest);
	}

	.facts dd {
		margin: 0;
		font-family: var(--font-body);
		font-size: var(--fs-body);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	.ww__button {
		margin-top: var(--space-6);
	}

	.ww__note {
		margin-top: var(--space-8);
		padding-left: var(--space-4);
		border-left: 2px solid var(--brand-border);
		font-family: var(--font-body);
		font-size: var(--fs-body-sm);
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--color-text-subtle);
	}

	@media (min-width: 768px) {
		.facts__row {
			grid-template-columns: 12rem 1fr;
			gap: var(--space-6);
			align-items: baseline;
		}
	}
</style>
